"use server";

import { revalidatePath } from "next/cache";
import { db } from "../db/client";
import { dispatchPendingEvents, pruneOldEvents } from "../webhook/queue";
import { getAdminSession } from "./auth";

async function requireAdmin() {
  const isAuth = await getAdminSession();
  if (!isAuth) {
    throw new Error("Unauthorized: Admin session required");
  }
}

/**
 * Re-enqueues a specific failed or DLQ webhook event for immediate processing
 */
export async function retryWebhookEventAction(eventId: string) {
  await requireAdmin();

  await db.query(
    `UPDATE webhook_events
     SET status = 'pending', attempts = 0, next_retry_at = now(), error_message = NULL
     WHERE id = $1`,
    [eventId],
  );

  // Trigger dispatch immediately
  await dispatchPendingEvents(10);

  revalidatePath("/admin/overview");
  revalidatePath("/admin/webhooks");
  return { success: true };
}

/**
 * Re-enqueues all Dead Letter Queue events back into the active queue
 */
export async function retryAllDlqEventsAction() {
  await requireAdmin();

  const { rowCount } = await db.query(
    `UPDATE webhook_events
     SET status = 'pending', attempts = 0, next_retry_at = now(), error_message = 'Manually replayed from DLQ'
     WHERE status = 'dlq'`,
  );

  // Run dispatch
  const dispatched = await dispatchPendingEvents(50);

  revalidatePath("/admin/overview");
  revalidatePath("/admin/webhooks");
  return { success: true, count: rowCount ?? 0, dispatched };
}

/**
 * Toggles a bridge key between active and revoked
 */
export async function toggleBridgeKeyAction(keyId: string, isActive: boolean) {
  await requireAdmin();

  await db.query("UPDATE bridge_keys SET is_active = $1 WHERE id = $2", [
    isActive,
    keyId,
  ]);

  revalidatePath("/admin/keys");
  revalidatePath("/admin/overview");
  return { success: true };
}

/**
 * Toggles an n8n webhook subscription between active and inactive
 */
export async function toggleSubscriptionAction(
  subscriptionId: string,
  isActive: boolean,
) {
  await requireAdmin();

  await db.query(
    "UPDATE webhook_subscriptions SET is_active = $1 WHERE id = $2",
    [isActive, subscriptionId],
  );

  revalidatePath("/admin/subscriptions");
  return { success: true };
}

/**
 * Manually triggers the webhook queue worker
 */
export async function triggerManualDispatchAction() {
  await requireAdmin();

  const processed = await dispatchPendingEvents(50);
  revalidatePath("/admin/overview");
  revalidatePath("/admin/webhooks");
  revalidatePath("/admin/system");
  return { success: true, processed };
}

/**
 * Manually triggers the old event cleanup
 */
export async function triggerManualPruneAction(days?: number) {
  await requireAdmin();

  const pruned = await pruneOldEvents(days);
  revalidatePath("/admin/overview");
  revalidatePath("/admin/system");
  return { success: true, pruned };
}
