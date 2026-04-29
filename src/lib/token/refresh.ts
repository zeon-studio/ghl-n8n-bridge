import { getSupabaseServiceRoleClient } from '../supabase/client';
import { tryAcquireRefreshLock, upsertLocationToken } from '../supabase/queries';
import { refreshAccessToken } from '../ghl/oauth';
import { encrypt, decrypt } from '../crypto/encryption';
import { TokenError } from '../errors';
import { logger } from '../logger';

// 5 minutes TTL in seconds
const ACCESS_TOKEN_TTL_SECONDS = 300; 

// A helper for sleep
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Executes token refresh with an advisory lock to prevent multiple concurrent refreshes
 * for the same location. Implements exponential backoff on GHL failures.
 */
export async function refreshWithLock(locationId: string) {
  const lockAcquired = await tryAcquireRefreshLock(locationId);

  if (!lockAcquired) {
    // Lock couldn't be acquired, another request is refreshing it.
    // Wait briefly and then fetch the newly refreshed token from the database.
    logger.debug('Could not acquire refresh lock, waiting for other process', { locationId });
    await sleep(1500); // Wait 1.5 seconds to let the other process finish
    
    const supabase = getSupabaseServiceRoleClient();
    const { data: updatedToken } = await supabase
      .from('ghl_location_tokens')
      .select('*')
      .eq('location_id', locationId)
      .single();
      
    if (updatedToken) {
      return updatedToken;
    }
    
    throw new TokenError('Failed to retrieve refreshed token after waiting');
  }

  // We have the lock. Fetch the current refresh token and proceed.
  const supabase = getSupabaseServiceRoleClient();
  const { data: currentToken, error } = await supabase
    .from('ghl_location_tokens')
    .select('*')
    .eq('location_id', locationId)
    .single();

  if (error || !currentToken) {
    throw new TokenError('Token record not found for refresh');
  }

  const decryptedRefreshToken = decrypt(currentToken.refresh_token);

  // Exponential backoff logic
  let attempt = 0;
  const maxAttempts = 3;
  let delayMs = 100;
  
  while (attempt < maxAttempts) {
    try {
      const newTokenRes = await refreshAccessToken(decryptedRefreshToken);
      
      // Force 5-minute TTL constraints even if GHL returns longer
      const expiresAt = new Date(Date.now() + ACCESS_TOKEN_TTL_SECONDS * 1000).toISOString();
      const encryptedNewRefresh = encrypt(newTokenRes.refresh_token);

      const updatedToken = await upsertLocationToken({
        id: currentToken.id, // specify ID to update existing row
        installation_id: currentToken.installation_id,
        location_id: locationId,
        access_token: newTokenRes.access_token,
        refresh_token: encryptedNewRefresh,
        expires_at: expiresAt,
      });

      logger.info('Token refreshed successfully', { locationId, attempt });
      return updatedToken;

    } catch (e) {
      attempt++;
      logger.warn(`Refresh attempt ${attempt} failed`, { locationId, error: e });
      
      if (attempt >= maxAttempts) {
        logger.error('Token refresh failed after max attempts', e, { locationId });
        throw new TokenError(`Token refresh failed after ${maxAttempts} attempts`);
      }
      
      await sleep(delayMs);
      delayMs *= 2; // 100ms -> 200ms -> 400ms
    }
  }

  throw new TokenError('Token refresh failed');
}
