import { WebhookError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { dispatchEventDirect, enqueueEvent } from "@/lib/webhook/queue";
import { verifyGhlWebhookSignature } from "@/lib/webhook/verify";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function getWebhookSignature(req: NextRequest): {
  headerName: string | null;
  signature: string | null;
} {
  const signatureHeaders = [
    "X-GHL-Signature",
    "x-ghl-signature",
    "X-Wh-Signature",
    "x-wh-signature",
    "X-LeadConnector-Signature",
    "x-leadconnector-signature",
  ];

  for (const headerName of signatureHeaders) {
    const value = req.headers.get(headerName);
    if (value) return { headerName, signature: value };
  }

  return { headerName: null, signature: null };
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const { headerName, signature } = getWebhookSignature(req);

    // 1. Verify HMAC Signature
    try {
      verifyGhlWebhookSignature(rawBody, signature);
    } catch (e) {
      logger.warn("Webhook signature verification failed", {
        error: e,
        signatureHeader: headerName,
        signatureLength: signature?.length ?? 0,
        bodyLength: rawBody.length,
        bodyPrefix: rawBody.slice(0, 120),
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse payload
    const payload = JSON.parse(rawBody);
    const locationId = payload.locationId;
    const eventType = payload.type;

    if (!locationId || !eventType) {
      logger.warn("Invalid webhook payload format", { payload });
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const deliveryMode = (
      process.env.WEBHOOK_DELIVERY_MODE ?? "direct"
    ).toLowerCase();

    if (deliveryMode === "direct") {
      const result = await dispatchEventDirect(locationId, eventType, payload);

      if (result.matchedSubscriptions === 0) {
        logger.info("Direct webhook received, no matching subscriptions", {
          locationId,
          eventType,
        });
        return NextResponse.json({ success: true, mode: "direct", ...result });
      }

      if (result.delivered === 0 && result.failed > 0) {
        logger.warn("Direct webhook delivery failed for all subscriptions", {
          locationId,
          eventType,
          ...result,
        });
        return NextResponse.json(
          { error: "Delivery failed", mode: "direct", ...result },
          { status: 502 },
        );
      }

      logger.info("Direct webhook delivered", {
        locationId,
        eventType,
        ...result,
      });
      return NextResponse.json({ success: true, mode: "direct", ...result });
    }

    // 3. Enqueue event
    await enqueueEvent(locationId, eventType, payload);
    logger.info("Webhook enqueued successfully", { locationId, eventType });

    return NextResponse.json({ success: true, mode: "queued" });
  } catch (error) {
    if (error instanceof WebhookError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    logger.error("Unexpected error processing webhook", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
