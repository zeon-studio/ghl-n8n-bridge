import { decrypt, encrypt } from "../crypto/encryption";
import { ghlFetch } from "../ghl/api";
import { refreshAccessToken } from "../ghl/oauth";
import { getSupabaseServiceRoleClient } from "./client";
import { Database } from "./schema";

type Tables = Database["public"]["Tables"];

/**
 * Attempts to acquire a Postgres advisory transaction lock.
 * This lock is automatically released at the end of the transaction.
 * Note: Since Supabase JS uses connection pooling (pgbouncer in transaction mode),
 * advisory xact locks might be tricky. We will use a dedicated connection or rely on
 * standard row-level locking via SKIP LOCKED if advisory locks fail, but the RPC is defined.
 */
export async function tryAcquireRefreshLock(
  locationId: string,
): Promise<boolean> {
  const supabase = getSupabaseServiceRoleClient();
  const lockKey = `refresh:${locationId}`;

  const { data, error } = await supabase.rpc("try_acquire_refresh_lock", {
    lock_key: lockKey,
  });

  if (error) {
    console.error("Error acquiring refresh lock:", error);
    return false;
  }

  return !!data;
}

/**
 * Upserts a main installation record (Company or Location level)
 */
export async function upsertInstallation(
  data: Tables["ghl_installations"]["Insert"],
) {
  const supabase = getSupabaseServiceRoleClient();
  const { data: installation, error } = await supabase
    .from("ghl_installations")
    .upsert(data, { onConflict: "company_id" })
    .select()
    .single();

  if (error) throw error;
  return installation;
}

/**
 * Upserts a location-specific token record
 */
export async function upsertLocationToken(
  data: Tables["ghl_location_tokens"]["Insert"],
) {
  const supabase = getSupabaseServiceRoleClient();
  const { data: token, error } = await supabase
    .from("ghl_location_tokens")
    .upsert(data, { onConflict: "location_id" })
    .select()
    .single();

  if (error) throw error;
  return token;
}

/**
 * Creates a new bridge key
 */
export async function createBridgeKey(data: Tables["bridge_keys"]["Insert"]) {
  const supabase = getSupabaseServiceRoleClient();
  const { data: key, error } = await supabase
    .from("bridge_keys")
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  return key;
}

/**
 * Links a bridge key to a location
 */
export async function linkBridgeLocation(
  bridgeKeyId: string,
  locationId: string,
) {
  const supabase = getSupabaseServiceRoleClient();
  const { error } = await supabase
    .from("bridge_locations")
    .upsert(
      { bridge_key_id: bridgeKeyId, location_id: locationId },
      { onConflict: "bridge_key_id,location_id" },
    );

  if (error) throw error;
}

/**
 * Resolves a token for a given bridge key and location ID
 */
export async function resolveToken(bridgeKeyStr: string, locationId: string) {
  const supabase = getSupabaseServiceRoleClient();

  // 1. Validate bridge key is active
  const { data: bridgeKey, error: bkError } = await supabase
    .from("bridge_keys")
    .select("id, company_id")
    .eq("bridge_key", bridgeKeyStr)
    .eq("is_active", true)
    .single();

  if (bkError || !bridgeKey) return null;

  // 2. Validate location is authorized for this bridge key
  const { data: authLocation, error: alError } = await supabase
    .from("bridge_locations")
    .select("id")
    .eq("bridge_key_id", bridgeKey.id)
    .eq("location_id", locationId)
    .single();

  if (alError || !authLocation) return null;

  // 3. Fetch the location token
  const { data: token, error: tokenError } = await supabase
    .from("ghl_location_tokens")
    .select("*")
    .eq("location_id", locationId)
    .single();

  if (tokenError || !token) return null;

  // Update last_used_at (fire and forget)
  supabase
    .from("bridge_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", bridgeKey.id)
    .then();

  return token;
}

/**
 * Returns recent webhook events for a location sorted by newest first.
 */
export async function getWebhookEventsByLocation(
  locationId: string,
  limit: number = 50,
) {
  const supabase = getSupabaseServiceRoleClient();

  const { data, error } = await supabase
    .from("webhook_events")
    .select(
      "id,event_type,status,attempts,max_attempts,created_at,processed_at,next_retry_at,error_message,idempotency_key",
    )
    .eq("location_id", locationId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

/**
 * Resolves a human-friendly location name for dashboard display.
 */
export async function getLocationDisplayName(locationId: string) {
  const supabase = getSupabaseServiceRoleClient();
  const { data: tokenRow, error } = await supabase
    .from("ghl_location_tokens")
    .select("id,installation_id,access_token,refresh_token,expires_at")
    .eq("location_id", locationId)
    .single();

  if (error || !tokenRow?.access_token) return null;

  let accessToken = tokenRow.access_token;
  const expiresAtMs = new Date(tokenRow.expires_at).getTime();
  const needsRefresh = Date.now() + 60 * 1000 >= expiresAtMs;

  if (needsRefresh) {
    try {
      const refreshed = await refreshAccessToken(
        decrypt(tokenRow.refresh_token),
      );
      const expiresAt = new Date(
        Date.now() + refreshed.expires_in * 1000,
      ).toISOString();

      await upsertLocationToken({
        id: tokenRow.id,
        installation_id: tokenRow.installation_id,
        location_id: locationId,
        access_token: refreshed.access_token,
        refresh_token: encrypt(refreshed.refresh_token),
        expires_at: expiresAt,
      });

      accessToken = refreshed.access_token;
    } catch {
      return null;
    }
  }

  try {
    const response = await ghlFetch(
      `/locations/${encodeURIComponent(locationId)}`,
      accessToken,
    );
    const data = (await response.json()) as {
      location?: { name?: string };
      name?: string;
      locationName?: string;
    };

    return data.location?.name || data.name || data.locationName || null;
  } catch {
    return null;
  }
}
