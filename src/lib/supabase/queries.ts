import { decrypt, encrypt } from "../crypto/encryption";
import { db } from "../db/client";
import { ghlFetch } from "../ghl/api";
import { refreshAccessToken } from "../ghl/oauth";

export interface Installation {
  id: string;
  company_id: string;
  user_type: string;
  access_token: string;
  refresh_token: string;
  token_type: string | null;
  expires_at: string;
  scopes: string[] | null;
  raw_data: unknown;
  created_at: string | null;
  updated_at: string | null;
}

export interface LocationToken {
  id: string;
  installation_id: string | null;
  location_id: string;
  access_token: string;
  refresh_token: string;
  expires_at: string;
  created_at: string | null;
  updated_at: string | null;
}

export interface BridgeKey {
  id: string;
  bridge_key: string;
  installation_id: string | null;
  company_id: string;
  label: string | null;
  is_active: boolean | null;
  last_used_at: string | null;
  created_at: string | null;
}

/**
 * Attempts to acquire a Postgres advisory transaction lock.
 * The lock is scoped to the single query's implicit transaction, so it only
 * guards the instant of acquisition (matches prior Supabase RPC behavior).
 */
export async function tryAcquireRefreshLock(
  locationId: string,
): Promise<boolean> {
  const lockKey = `refresh:${locationId}`;

  try {
    const { rows } = await db.query(
      "SELECT try_acquire_refresh_lock($1) AS acquired",
      [lockKey],
    );
    return !!rows[0]?.acquired;
  } catch (error) {
    console.error("Error acquiring refresh lock:", error);
    return false;
  }
}

/**
 * Upserts a main installation record (Company or Location level)
 */
export async function upsertInstallation(data: {
  company_id: string;
  user_type: string;
  access_token: string;
  refresh_token: string;
  expires_at: string;
  scopes?: string[] | null;
  raw_data?: unknown;
}): Promise<Installation> {
  const { rows } = await db.query(
    `INSERT INTO ghl_installations (
      company_id, user_type, access_token, refresh_token, expires_at, scopes, raw_data, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, now())
    ON CONFLICT (company_id) DO UPDATE SET
      user_type = EXCLUDED.user_type,
      access_token = EXCLUDED.access_token,
      refresh_token = EXCLUDED.refresh_token,
      expires_at = EXCLUDED.expires_at,
      scopes = EXCLUDED.scopes,
      raw_data = EXCLUDED.raw_data,
      updated_at = now()
    RETURNING *`,
    [
      data.company_id,
      data.user_type,
      data.access_token,
      data.refresh_token,
      data.expires_at,
      data.scopes ?? null,
      data.raw_data ? JSON.stringify(data.raw_data) : null,
    ],
  );

  return rows[0];
}

/**
 * Upserts a location-specific token record
 */
export async function upsertLocationToken(data: {
  id?: string;
  installation_id?: string | null;
  location_id: string;
  access_token: string;
  refresh_token: string;
  expires_at: string;
}): Promise<LocationToken> {
  const { rows } = await db.query(
    `INSERT INTO ghl_location_tokens (
      installation_id, location_id, access_token, refresh_token, expires_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, now())
    ON CONFLICT (location_id) DO UPDATE SET
      installation_id = EXCLUDED.installation_id,
      access_token = EXCLUDED.access_token,
      refresh_token = EXCLUDED.refresh_token,
      expires_at = EXCLUDED.expires_at,
      updated_at = now()
    RETURNING *`,
    [
      data.installation_id ?? null,
      data.location_id,
      data.access_token,
      data.refresh_token,
      data.expires_at,
    ],
  );

  return rows[0];
}

/**
 * Creates a new bridge key
 */
export async function createBridgeKey(data: {
  bridge_key: string;
  installation_id?: string | null;
  company_id: string;
  label?: string | null;
  is_active?: boolean;
}): Promise<BridgeKey> {
  const { rows } = await db.query(
    `INSERT INTO bridge_keys (bridge_key, installation_id, company_id, label, is_active)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [
      data.bridge_key,
      data.installation_id ?? null,
      data.company_id,
      data.label ?? null,
      data.is_active ?? true,
    ],
  );

  return rows[0];
}

/**
 * Links a bridge key to a location
 */
export async function linkBridgeLocation(
  bridgeKeyId: string,
  locationId: string,
) {
  await db.query(
    `INSERT INTO bridge_locations (bridge_key_id, location_id)
     VALUES ($1, $2)
     ON CONFLICT (bridge_key_id, location_id) DO NOTHING`,
    [bridgeKeyId, locationId],
  );
}

/**
 * Resolves a token for a given bridge key and location ID
 */
export async function resolveToken(bridgeKeyStr: string, locationId: string) {
  // 1. Validate bridge key is active
  const { rows: bkRows } = await db.query(
    "SELECT id, company_id FROM bridge_keys WHERE bridge_key = $1 AND is_active = true",
    [bridgeKeyStr],
  );
  const bridgeKey = bkRows[0];
  if (!bridgeKey) return null;

  // 2. Validate location is authorized for this bridge key
  const { rows: alRows } = await db.query(
    "SELECT id FROM bridge_locations WHERE bridge_key_id = $1 AND location_id = $2",
    [bridgeKey.id, locationId],
  );
  if (!alRows[0]) return null;

  // 3. Fetch the location token
  const { rows: tokenRows } = await db.query(
    "SELECT * FROM ghl_location_tokens WHERE location_id = $1",
    [locationId],
  );
  const token = tokenRows[0];
  if (!token) return null;

  // Update last_used_at (fire and forget)
  db.query("UPDATE bridge_keys SET last_used_at = now() WHERE id = $1", [
    bridgeKey.id,
  ]).catch(() => {});

  return token;
}

/**
 * Returns recent webhook events for a location sorted by newest first.
 */
export async function getWebhookEventsByLocation(
  locationId: string,
  limit: number = 50,
) {
  const { rows } = await db.query(
    `SELECT id, event_type, status, attempts, max_attempts, created_at, processed_at,
            next_retry_at, error_message, idempotency_key
     FROM webhook_events
     WHERE location_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [locationId, limit],
  );

  return rows;
}

/**
 * Resolves a human-friendly location name for dashboard display.
 */
export async function getLocationDisplayName(locationId: string) {
  const { rows } = await db.query(
    "SELECT id, installation_id, access_token, refresh_token, expires_at FROM ghl_location_tokens WHERE location_id = $1",
    [locationId],
  );
  const tokenRow = rows[0];

  if (!tokenRow?.access_token) return null;

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
