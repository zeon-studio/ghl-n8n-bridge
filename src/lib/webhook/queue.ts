import crypto from "crypto";
import { logger } from "../logger";
import { getSupabaseServiceRoleClient } from "../supabase/client";

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
): Promise<boolean> {
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
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      throw new Error(`Push failed with status: ${res.status}`);
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Direct-delivery mode for low-latency pass-through (no queue persistence).
 */
export async function dispatchEventDirect(
  locationId: string,
  eventType: string,
  payload: WebhookEventPayload,
): Promise<DirectDispatchResult> {
  const supabase = getSupabaseServiceRoleClient();

  const { data: subscriptions } = await supabase
    .from("webhook_subscriptions")
    .select("*")
    .eq("location_id", locationId)
    .eq("is_active", true);

  if (!subscriptions || subscriptions.length === 0) {
    return { matchedSubscriptions: 0, delivered: 0, failed: 0 };
  }

  const matched = subscriptions.filter(
    (sub) =>
      sub.event_types.includes("*") || sub.event_types.includes(eventType),
  );

  if (matched.length === 0) {
    return { matchedSubscriptions: 0, delivered: 0, failed: 0 };
  }

  let delivered = 0;
  let failed = 0;

  for (const sub of matched) {
    const ok = await sendPayloadToSubscription(sub, payload);
    if (ok) {
      delivered += 1;
      logger.info("Direct webhook pushed to n8n", {
        eventType,
        url: sub.webhook_url,
      });
    } else {
      failed += 1;
      logger.warn("Direct webhook push failed", {
        eventType,
        url: sub.webhook_url,
      });
    }
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
  const supabase = getSupabaseServiceRoleClient();

  // Use event ID from payload if available, else hash the payload for idempotency
  const eventId =
    payload.id ||
    crypto.createHash("sha256").update(JSON.stringify(payload)).digest("hex");
  const idempotencyKey = `ghl_${eventId}`;

  const { error } = await supabase.from("webhook_events").insert({
    location_id: locationId,
    event_type: eventType,
    payload: payload as any,
    idempotency_key: idempotencyKey,
    status: "pending",
  });

  // Ignore unique constraint violation (duplicate event)
  if (error && error.code !== "23505") {
    throw error;
  }
}

/**
 * Dispatches an event to registered n8n webhook URLs.
 */
async function pushEventToSubscription(
  subscription: any,
  eventData: any,
  supabase: ReturnType<typeof getSupabaseServiceRoleClient>,
) {
  try {
    const ok = await sendPayloadToSubscription(
      subscription,
      eventData.payload as WebhookEventPayload,
    );
    if (!ok) {
      throw new Error("Push failed");
    }

    // Success
    await supabase
      .from("webhook_events")
      .update({ status: "completed", processed_at: new Date().toISOString() })
      .eq("id", eventData.id);

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
      await supabase
        .from("webhook_events")
        .update({ status: "dlq", attempts, error_message: String(error) })
        .eq("id", eventData.id);
    } else {
      // Exponential backoff for retry: next retry in 2^attempts minutes
      const delayMinutes = Math.pow(2, attempts);
      const nextRetryAt = new Date(
        Date.now() + delayMinutes * 60000,
      ).toISOString();

      await supabase
        .from("webhook_events")
        .update({
          status: "failed",
          attempts,
          next_retry_at: nextRetryAt,
          error_message: String(error),
        })
        .eq("id", eventData.id);
    }

    return false;
  }
}

/**
 * Dispatches pending events. Designed to be called by Vercel Cron or immediately after enqueueing.
 */
export async function dispatchPendingEvents(limit: number = 50) {
  const supabase = getSupabaseServiceRoleClient();

  // 1. Fetch pending or ready-to-retry events
  // Note: For real concurrency control at scale, we'd use SKIP LOCKED in raw SQL via RPC.
  // For Vercel Cron single-instance running, this is generally okay.
  const { data: events, error } = await supabase
    .from("webhook_events")
    .select("*")
    .in("status", ["pending", "failed"])
    .or("next_retry_at.is.null,next_retry_at.lte.now()")
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error || !events || events.length === 0) return 0;

  // Mark as processing
  const eventIds = events.map((e) => e.id);
  await supabase
    .from("webhook_events")
    .update({ status: "processing" })
    .in("id", eventIds);

  let processedCount = 0;

  for (const event of events) {
    // Find active subscriptions for this location
    const { data: subscriptions } = await supabase
      .from("webhook_subscriptions")
      .select("*")
      .eq("location_id", event.location_id)
      .eq("is_active", true);

    if (!subscriptions || subscriptions.length === 0) {
      // No active subscriptions, mark as completed (dropped)
      await supabase
        .from("webhook_events")
        .update({
          status: "completed",
          processed_at: new Date().toISOString(),
          error_message: "No active subscriptions",
        })
        .eq("id", event.id);
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
        await pushEventToSubscription(sub, event, supabase);
        processedCount++;
      }
    }
  }

  return processedCount;
}
