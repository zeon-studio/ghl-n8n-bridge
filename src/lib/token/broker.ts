import { resolveToken as dbResolveToken } from '../supabase/queries';
import { refreshWithLock } from './refresh';
import { TokenError } from '../errors';

// 4 minutes remaining threshold (in milliseconds)
const REFRESH_THRESHOLD_MS = 4 * 60 * 1000;
// We issue tokens with max 5-min TTL
const MAX_TTL_SECONDS = 300;

export async function resolveBrokerToken(bridgeKey: string, locationId: string) {
  let tokenData = await dbResolveToken(bridgeKey, locationId);

  if (!tokenData) {
    throw new TokenError('Invalid bridge key or unauthorized location');
  }

  const expiresAtMs = new Date(tokenData.expires_at).getTime();
  const timeRemainingMs = expiresAtMs - Date.now();

  // If expiring soon (less than 4 minutes remaining), refresh it
  if (timeRemainingMs < REFRESH_THRESHOLD_MS) {
    tokenData = await refreshWithLock(locationId);
  }

  // Calculate actual expires_in for the response (capped at 5 mins)
  const finalExpiresAtMs = new Date(tokenData.expires_at).getTime();
  const actualRemainingSeconds = Math.floor((finalExpiresAtMs - Date.now()) / 1000);
  const expiresIn = Math.min(actualRemainingSeconds, MAX_TTL_SECONDS);

  // Return ONLY the short-lived access token, never the refresh token
  return {
    access_token: tokenData.access_token,
    expires_in: Math.max(expiresIn, 0),
    token_type: 'Bearer',
  };
}
