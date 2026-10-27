import { db } from "../db/client";

export interface AdminOverviewStats {
  totalInstallations: number;
  totalLocations: number;
  totalBridgeKeys: number;
  activeBridgeKeys: number;
  keysUsed24h: number;
  webhooksTotal: number;
  webhooks24h: number;
  webhooks7d: number;
  completedWebhooks: number;
  processingWebhooks: number;
  pendingWebhooks: number;
  failedWebhooks: number;
  dlqWebhooks: number;
  successRate: number;
  activeSubscriptions: number;
}

export interface TimeSeriesPoint {
  bucket: string;
  total: number;
  completed: number;
  failed: number;
  dlq: number;
}

export interface EventTypeStat {
  eventType: string;
  count: number;
  percentage: number;
}

export interface WebhookEventRow {
  id: string;
  location_id: string;
  event_type: string;
  status: string;
  attempts: number;
  max_attempts: number;
  created_at: string;
  processed_at: string | null;
  next_retry_at: string | null;
  error_message: string | null;
  idempotency_key: string | null;
  payload?: any;
}

export interface TenantRow {
  id: string;
  company_id: string;
  user_type: string;
  expires_at: string;
  scopes: string[] | null;
  created_at: string;
  updated_at: string;
  locationsCount: number;
  keysCount: number;
}

export interface LocationDetailRow {
  id: string;
  installation_id: string | null;
  location_id: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
  webhookCount: number;
  bridgeKeys: string[];
}

export interface BridgeKeyRow {
  id: string;
  bridge_key: string;
  company_id: string;
  label: string | null;
  is_active: boolean;
  last_used_at: string | null;
  created_at: string;
  locationsCount: number;
  locations: string[];
}

export interface WebhookSubscriptionRow {
  id: string;
  location_id: string;
  webhook_url: string;
  event_types: string[];
  is_active: boolean;
  has_secret: boolean;
  created_at: string;
  updated_at: string;
}

export interface SystemDiagnostics {
  tableCounts: {
    installations: number;
    locations: number;
    bridgeKeys: number;
    bridgeLocations: number;
    webhookEvents: number;
    webhookSubscriptions: number;
  };
  pendingQueueCount: number;
  oldestPendingAgeSeconds: number | null;
  isRedisConfigured: boolean;
  retentionDays: number;
}

/**
 * Fetches top-level KPIs for the overview dashboard
 */
export async function getAdminOverviewStats(): Promise<AdminOverviewStats> {
  const [instRes, locRes, keyRes, key24hRes, eventsRes, subsRes] =
    await Promise.all([
      db.query("SELECT count(*) as count FROM ghl_installations"),
      db.query("SELECT count(*) as count FROM ghl_location_tokens"),
      db.query(
        `SELECT 
         count(*) as total,
         count(*) FILTER (WHERE is_active = true) as active
       FROM bridge_keys`,
      ),
      db.query(
        "SELECT count(*) as count FROM bridge_keys WHERE last_used_at >= now() - interval '24 hours'",
      ),
      db.query(
        `SELECT
         count(*) as total,
         count(*) FILTER (WHERE created_at >= now() - interval '24 hours') as v24h,
         count(*) FILTER (WHERE created_at >= now() - interval '7 days') as v7d,
         count(*) FILTER (WHERE status = 'completed') as completed,
         count(*) FILTER (WHERE status = 'processing') as processing,
         count(*) FILTER (WHERE status = 'pending') as pending,
         count(*) FILTER (WHERE status = 'failed') as failed,
         count(*) FILTER (WHERE status = 'dlq') as dlq
       FROM webhook_events`,
      ),
      db.query(
        "SELECT count(*) as count FROM webhook_subscriptions WHERE is_active = true",
      ),
    ]);

  const ev = eventsRes.rows[0] || {};
  const completed = Number(ev.completed || 0);
  const dlq = Number(ev.dlq || 0);
  const failed = Number(ev.failed || 0);
  const evaluated = completed + dlq + failed;
  const successRate = evaluated > 0 ? (completed / evaluated) * 100 : 100;

  return {
    totalInstallations: Number(instRes.rows[0]?.count || 0),
    totalLocations: Number(locRes.rows[0]?.count || 0),
    totalBridgeKeys: Number(keyRes.rows[0]?.total || 0),
    activeBridgeKeys: Number(keyRes.rows[0]?.active || 0),
    keysUsed24h: Number(key24hRes.rows[0]?.count || 0),
    webhooksTotal: Number(ev.total || 0),
    webhooks24h: Number(ev.v24h || 0),
    webhooks7d: Number(ev.v7d || 0),
    completedWebhooks: completed,
    processingWebhooks: Number(ev.processing || 0),
    pendingWebhooks: Number(ev.pending || 0),
    failedWebhooks: failed,
    dlqWebhooks: dlq,
    successRate: Math.round(successRate * 10) / 10,
    activeSubscriptions: Number(subsRes.rows[0]?.count || 0),
  };
}

/**
 * Hourly (24h) or Daily (7d / 30d) time-series data for webhook throughput
 */
export async function getWebhookThroughputTimeSeries(
  timeframe: "24h" | "7d" | "30d" = "7d",
): Promise<TimeSeriesPoint[]> {
  if (timeframe === "24h") {
    const { rows } = await db.query(
      `SELECT
         to_char(date_trunc('hour', created_at), 'HH24:00') AS bucket,
         count(*)::int AS total,
         count(*) FILTER (WHERE status = 'completed')::int AS completed,
         count(*) FILTER (WHERE status = 'failed')::int AS failed,
         count(*) FILTER (WHERE status = 'dlq')::int AS dlq
       FROM webhook_events
       WHERE created_at >= now() - interval '24 hours'
       GROUP BY date_trunc('hour', created_at)
       ORDER BY date_trunc('hour', created_at) ASC`,
    );
    return rows;
  }

  const days = timeframe === "30d" ? 30 : 7;
  const { rows } = await db.query(
    `SELECT
       to_char(date_trunc('day', created_at), 'Mon DD') AS bucket,
       count(*)::int AS total,
       count(*) FILTER (WHERE status = 'completed')::int AS completed,
       count(*) FILTER (WHERE status = 'failed')::int AS failed,
       count(*) FILTER (WHERE status = 'dlq')::int AS dlq
     FROM webhook_events
     WHERE created_at >= now() - ($1 || ' days')::interval
     GROUP BY date_trunc('day', created_at)
     ORDER BY date_trunc('day', created_at) ASC`,
    [days],
  );
  return rows;
}

/**
 * Top event types with distribution percentages
 */
export async function getEventTypeDistribution(
  limit: number = 7,
): Promise<EventTypeStat[]> {
  const { rows } = await db.query(
    `SELECT
       event_type as "eventType",
       count(*)::int as count
     FROM webhook_events
     GROUP BY event_type
     ORDER BY count DESC
     LIMIT $1`,
    [limit],
  );

  const total = rows.reduce((acc, r) => acc + Number(r.count), 0);

  return rows.map((r) => ({
    eventType: r.eventType,
    count: Number(r.count),
    percentage: total > 0 ? Math.round((Number(r.count) / total) * 100) : 0,
  }));
}

/**
 * Fetches recent DLQ/failed events for real-time alerting
 */
export async function getRecentDlqAlerts(
  limit: number = 5,
): Promise<WebhookEventRow[]> {
  const { rows } = await db.query(
    `SELECT id, location_id, event_type, status, attempts, max_attempts,
            created_at, processed_at, next_retry_at, error_message, idempotency_key
     FROM webhook_events
     WHERE status IN ('dlq', 'failed')
     ORDER BY created_at DESC
     LIMIT $1`,
    [limit],
  );
  return rows;
}

/**
 * Paginated webhook events with search and status filtering
 */
export async function getPaginatedWebhookEvents(options: {
  page?: number;
  limit?: number;
  status?: string;
  eventType?: string;
  locationId?: string;
  search?: string;
}): Promise<{ events: WebhookEventRow[]; total: number; totalPages: number }> {
  const page = Math.max(1, options.page || 1);
  const limit = Math.min(100, Math.max(10, options.limit || 25));
  const offset = (page - 1) * limit;

  const conditions: string[] = [];
  const params: any[] = [];
  let paramIdx = 1;

  if (options.status && options.status !== "all") {
    conditions.push(`status = $${paramIdx++}`);
    params.push(options.status);
  }

  if (options.eventType && options.eventType !== "all") {
    conditions.push(`event_type = $${paramIdx++}`);
    params.push(options.eventType);
  }

  if (options.locationId) {
    conditions.push(`location_id = $${paramIdx++}`);
    params.push(options.locationId);
  }

  if (options.search) {
    conditions.push(
      `(location_id ILIKE $${paramIdx} OR event_type ILIKE $${paramIdx} OR error_message ILIKE $${paramIdx})`,
    );
    params.push(`%${options.search}%`);
    paramIdx++;
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const [countRes, eventsRes] = await Promise.all([
    db.query(
      `SELECT count(*)::int as count FROM webhook_events ${whereClause}`,
      params,
    ),
    db.query(
      `SELECT id, location_id, event_type, status, attempts, max_attempts,
              created_at, processed_at, next_retry_at, error_message, idempotency_key
       FROM webhook_events
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${paramIdx++} OFFSET $${paramIdx++}`,
      [...params, limit, offset],
    ),
  ]);

  const total = Number(countRes.rows[0]?.count || 0);

  return {
    events: eventsRes.rows,
    total,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

/**
 * Fetches a single event with complete payload for inspection
 */
export async function getWebhookEventDetail(
  id: string,
): Promise<WebhookEventRow | null> {
  const { rows } = await db.query(
    `SELECT id, location_id, event_type, payload, status, attempts, max_attempts,
            created_at, processed_at, next_retry_at, error_message, idempotency_key
     FROM webhook_events
     WHERE id = $1`,
    [id],
  );
  return rows[0] || null;
}

/**
 * Fetches installations and their linked locations
 */
export async function getTenantsWithLocations(): Promise<{
  installations: TenantRow[];
  locations: LocationDetailRow[];
}> {
  const [instRes, locRes] = await Promise.all([
    db.query(
      `SELECT 
         i.id, i.company_id, i.user_type, i.expires_at, i.scopes, i.created_at, i.updated_at,
         count(DISTINCT l.id)::int as "locationsCount",
         count(DISTINCT k.id)::int as "keysCount"
       FROM ghl_installations i
       LEFT JOIN ghl_location_tokens l ON l.installation_id = i.id
       LEFT JOIN bridge_keys k ON k.installation_id = i.id
       GROUP BY i.id
       ORDER BY i.created_at DESC`,
    ),
    db.query(
      `SELECT
         l.id, l.installation_id, l.location_id, l.expires_at, l.created_at, l.updated_at,
         coalesce(count(DISTINCT e.id), 0)::int as "webhookCount",
         coalesce(array_remove(array_agg(DISTINCT k.bridge_key), NULL), '{}') as "bridgeKeys"
       FROM ghl_location_tokens l
       LEFT JOIN webhook_events e ON e.location_id = l.location_id
       LEFT JOIN bridge_locations bl ON bl.location_id = l.location_id
       LEFT JOIN bridge_keys k ON k.id = bl.bridge_key_id
       GROUP BY l.id
       ORDER BY l.created_at DESC`,
    ),
  ]);

  return {
    installations: instRes.rows,
    locations: locRes.rows,
  };
}

/**
 * Fetches all bridge keys with usage metrics and mapped locations
 */
export async function getBridgeKeysWithStats(): Promise<BridgeKeyRow[]> {
  const { rows } = await db.query(
    `SELECT
       k.id, k.bridge_key, k.company_id, k.label, k.is_active, k.last_used_at, k.created_at,
       count(bl.id)::int as "locationsCount",
       coalesce(array_remove(array_agg(bl.location_id), NULL), '{}') as locations
     FROM bridge_keys k
     LEFT JOIN bridge_locations bl ON bl.bridge_key_id = k.id
     GROUP BY k.id
     ORDER BY k.created_at DESC`,
  );
  return rows;
}

/**
 * Fetches all registered n8n webhook push subscriptions
 */
export async function getSubscriptionsWithStats(): Promise<
  WebhookSubscriptionRow[]
> {
  const { rows } = await db.query(
    `SELECT
       id, location_id, webhook_url, event_types, is_active,
       (secret IS NOT NULL AND secret != '') as has_secret,
       created_at, updated_at
     FROM webhook_subscriptions
     ORDER BY created_at DESC`,
  );
  return rows;
}

/**
 * Fetches system diagnostics, table sizes, and backlog metrics
 */
export async function getSystemDiagnostics(): Promise<SystemDiagnostics> {
  const [
    instCount,
    locCount,
    keyCount,
    blocCount,
    eventsCount,
    subsCount,
    pendingRes,
  ] = await Promise.all([
    db.query("SELECT count(*)::int as c FROM ghl_installations"),
    db.query("SELECT count(*)::int as c FROM ghl_location_tokens"),
    db.query("SELECT count(*)::int as c FROM bridge_keys"),
    db.query("SELECT count(*)::int as c FROM bridge_locations"),
    db.query("SELECT count(*)::int as c FROM webhook_events"),
    db.query("SELECT count(*)::int as c FROM webhook_subscriptions"),
    db.query(
      `SELECT
         count(*)::int as count,
         extract(epoch from (now() - min(created_at)))::int as "oldestAge"
       FROM webhook_events
       WHERE status = 'pending'`,
    ),
  ]);

  return {
    tableCounts: {
      installations: instCount.rows[0]?.c || 0,
      locations: locCount.rows[0]?.c || 0,
      bridgeKeys: keyCount.rows[0]?.c || 0,
      bridgeLocations: blocCount.rows[0]?.c || 0,
      webhookEvents: eventsCount.rows[0]?.c || 0,
      webhookSubscriptions: subsCount.rows[0]?.c || 0,
    },
    pendingQueueCount: pendingRes.rows[0]?.count || 0,
    oldestPendingAgeSeconds: pendingRes.rows[0]?.oldestAge || null,
    isRedisConfigured: !!process.env.UPSTASH_REDIS_REST_URL,
    retentionDays: Number(process.env.WEBHOOK_EVENT_RETENTION_DAYS ?? 7),
  };
}
