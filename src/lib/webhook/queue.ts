import crypto from "crypto";
import { db } from "../db/client";
import { logger } from "../logger";

export interface WebhookEventPayload {
  type: string;
  locationId: string;
  [key: string]: any;
}

interface DirectDispatchResult {
  matchedSubscriptions: number;
  delivered: number;
  failed: number;
}

async function sendPayloadToSubscription(
  subscription: any,
  payload: WebhookEventPayload,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const payloadStr = JSON.stringify(payload);
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (subscription.secret) {
      const hmac = crypto.createHmac("sha256", subscription.secret);
      hmac.update(payloadStr, "utf8");
      headers["X-Bridge-Signature"] = hmac.digest("hex");
    }

    const res = await fetch(subscription.webhook_url, {
      method: "POST",
      headers,
      body: payloadStr,
      signal: AbortSignal.timeout(10000), // Increased timeout to 10s
    });

    if (!res.ok) {
      return { ok: false, error: `[${subscription.webhook_url}] Push failed with status: ${res.status}` };
    }

    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: `[${subscription.webhook_url}] ${e.message || "Network error"}` };
  }
}

/**
 * Direct-delivery mode for low-latency pass-through (no queue persistence by default, but we log for the dashboard).
 */
export async function dispatchEventDirect(
  locationId: string,
  eventType: string,
  payload: WebhookEventPayload,
): Promise<DirectDispatchResult> {
  // Create an initial log entry for visibility in the dashboard
  const eventId =
    payload.id ||
    crypto.createHash("sha256").update(JSON.stringify(payload)).digest("hex");
  const idempotencyKey = `ghl_direct_${eventId}`;

  const { rows: eventRows } = await db.query(
    `INSERT INTO webhook_events (location_id, event_type, payload, idempotency_key, status)
     VALUES ($1, $2, $3, $4, 'processing')
     RETURNING id`,
    [locationId, eventType, JSON.stringify(payload), idempotencyKey],
  );
  const eventRecord = eventRows[0];

  const { rows: subscriptions } = await db.query(
    "SELECT * FROM webhook_subscriptions WHERE location_id = $1 AND is_active = true",
    [locationId],
  );

  if (!subscriptions || subscriptions.length === 0) {
    if (eventRecord) {
      await db.query(
        `UPDATE webhook_events
         SET status = 'completed', error_message = $2, processed_at = now()
         WHERE id = $1`,
        [eventRecord.id, "No active subscriptions found for this location"],
      );
    }
    return { matchedSubscriptions: 0, delivered: 0, failed: 0 };
  }

  const matched = subscriptions.filter(
    (sub) =>
      sub.event_types.includes("*") || sub.event_types.includes(eventType),
  );

  if (matched.length === 0) {
    if (eventRecord) {
      await db.query(
        `UPDATE webhook_events
         SET status = 'completed', error_message = $2, processed_at = now()
         WHERE id = $1`,
        [eventRecord.id, "No matching subscriptions for this event type"],
      );
    }
    return { matchedSubscriptions: 0, delivered: 0, failed: 0 };
  }

  let delivered = 0;
  let failed = 0;
  let lastError: string | undefined;

  for (const sub of matched) {
    const { ok, error } = await sendPayloadToSubscription(sub, payload);
    if (ok) {
      delivered += 1;
      logger.info("Direct webhook pushed to n8n", {
        eventType,
        url: sub.webhook_url,
      });
    } else {
      failed += 1;
      lastError = error;
      logger.warn("Direct webhook push failed", {
        eventType,
        url: sub.webhook_url,
        error,
      });
    }
  }

  // Finalize the log entry
  if (eventRecord) {
    await db.query(
      `UPDATE webhook_events
       SET status = $2, processed_at = now(), error_message = $3, attempts = 1
       WHERE id = $1`,
      [
        eventRecord.id,
        failed === 0 ? "completed" : delivered > 0 ? "completed" : "dlq",
        lastError || (delivered > 0 ? `Delivered to ${delivered} sub(s)` : null),
      ],
    );
  }

  return {
    matchedSubscriptions: matched.length,
    delivered,
    failed,
  };
}

/**
 * Enqueues an event received from GHL into the database queue.
 */
export async function enqueueEvent(
  locationId: string,
  eventType: string,
  payload: WebhookEventPayload,
) {
  // Use event ID from payload if available, else hash the payload for idempotency
  const eventId =
    payload.id ||
    crypto.createHash("sha256").update(JSON.stringify(payload)).digest("hex");
  const idempotencyKey = `ghl_${eventId}`;

  try {
    await db.query(
      `INSERT INTO webhook_events (location_id, event_type, payload, idempotency_key, status)
       VALUES ($1, $2, $3, $4, 'pending')`,
      [locationId, eventType, JSON.stringify(payload), idempotencyKey],
    );
  } catch (error: any) {
    // Ignore unique constraint violation (duplicate event)
    if (error?.code !== "23505") {
      throw error;
    }
  }
}

/**
 * Dispatches an event to registered n8n webhook URLs.
 */
async function pushEventToSubscription(subscription: any, eventData: any) {
  try {
    const { ok, error } = await sendPayloadToSubscription(
      subscription,
      eventData.payload as WebhookEventPayload,
    );
    if (!ok) {
      throw new Error(error || "Push failed");
    }

    // Success
    await db.query(
      "UPDATE webhook_events SET status = 'completed', processed_at = now() WHERE id = $1",
      [eventData.id],
    );

    logger.info("Successfully pushed webhook to n8n", {
      eventId: eventData.id,
      url: subscription.webhook_url,
    });
    return true;
  } catch (error) {
    logger.warn("Failed to push webhook to n8n", {
      eventId: eventData.id,
      url: subscription.webhook_url,
      error,
    });

    // Mark for retry
    const attempts = (eventData.attempts || 0) + 1;
    const maxAttempts = eventData.max_attempts || 3;

    if (attempts >= maxAttempts) {
      await db.query(
        "UPDATE webhook_events SET status = 'dlq', attempts = $2, error_message = $3 WHERE id = $1",
        [eventData.id, attempts, String(error)],
      );
    } else {
      // Exponential backoff for retry: next retry in 2^attempts minutes
      const delayMinutes = Math.pow(2, attempts);
      const nextRetryAt = new Date(
        Date.now() + delayMinutes * 60000,
      ).toISOString();

      await db.query(
        `UPDATE webhook_events
         SET status = 'failed', attempts = $2, next_retry_at = $3, error_message = $4
         WHERE id = $1`,
        [eventData.id, attempts, nextRetryAt, String(error)],
      );
    }

    return false;
  }
}

/**
 * Dispatches pending events. Designed to be called by Vercel Cron or immediately after enqueueing.
 */
export async function dispatchPendingEvents(limit: number = 50) {
  // 1. Fetch pending or ready-to-retry events
  const { rows: events } = await db.query(
    `SELECT * FROM webhook_events
     WHERE status IN ('pending', 'failed')
       AND (next_retry_at IS NULL OR next_retry_at <= now())
     ORDER BY created_at ASC
     LIMIT $1`,
    [limit],
  );

  if (!events || events.length === 0) return 0;

  // Mark as processing
  const eventIds = events.map((e) => e.id);
  await db.query(
    "UPDATE webhook_events SET status = 'processing' WHERE id = ANY($1::uuid[])",
    [eventIds],
  );

  let processedCount = 0;

  for (const event of events) {
    // Find active subscriptions for this location
    const { rows: subscriptions } = await db.query(
      "SELECT * FROM webhook_subscriptions WHERE location_id = $1 AND is_active = true",
      [event.location_id],
    );

    if (!subscriptions || subscriptions.length === 0) {
      // No active subscriptions, mark as completed (dropped)
      await db.query(
        `UPDATE webhook_events
         SET status = 'completed', processed_at = now(), error_message = $2
         WHERE id = $1`,
        [event.id, "No active subscriptions"],
      );
      processedCount++;
      continue;
    }

    // Push to all relevant subscriptions
    for (const sub of subscriptions) {
      // Check event types
      if (
        sub.event_types.includes("*") ||
        sub.event_types.includes(event.event_type)
      ) {
        await pushEventToSubscription(sub, event);
        processedCount++;
      }
    }
  }

  return processedCount;
}
