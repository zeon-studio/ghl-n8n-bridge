"use client";

import { Button } from "@/components/ui/button";
import { retryAllDlqEventsAction } from "@/lib/admin/actions";
import { AlertTriangle, CheckCircle2, Loader2, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export function DlqAlertBanner({ dlqCount }: { dlqCount: number }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (dlqCount <= 0 && !message) {
    return null;
  }

  async function handleRetryAll() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await retryAllDlqEventsAction();
      setMessage(
        `Successfully re-queued ${res.count} events for immediate dispatch.`,
      );
    } catch (e: any) {
      setMessage(`Failed to replay DLQ: ${e.message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="size-9 rounded-xl bg-destructive/15 text-destructive flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
            <AlertTriangle className="size-5" />
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-bold text-destructive">
                Dead-Letter Queue Attention Required
              </span>
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-destructive text-white shadow-xs">
                {dlqCount} events
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {message ? (
                <span className="text-foreground font-medium flex items-center gap-1.5 mt-0.5">
                  <CheckCircle2 className="size-3.5 text-emerald-500" />
                  {message}
                </span>
              ) : (
                "Events have exceeded max push retry attempts to n8n endpoints. Inspect payloads or replay to retry."
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
          <Link
            href="/admin/webhooks?status=dlq"
            className="text-xs underline text-destructive font-medium hover:text-destructive/80 transition-colors"
          >
            View in Logs
          </Link>
          <Button
            size="sm"
            variant="destructive"
            onClick={handleRetryAll}
            disabled={loading || dlqCount === 0}
            className="h-8 gap-1.5 text-xs font-semibold cursor-pointer shadow-sm text-white"
          >
            {loading ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                Replaying...
              </>
            ) : (
              <>
                <RotateCcw className="size-3.5" />
                Retry All DLQ
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
