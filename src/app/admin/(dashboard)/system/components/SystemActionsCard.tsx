"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  triggerManualDispatchAction,
  triggerManualPruneAction,
} from "@/lib/admin/actions";
import { CheckCircle2, Loader2, Play, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function SystemActionsCard({
  retentionDays,
}: {
  retentionDays: number;
}) {
  const router = useRouter();
  const [dispatchLoading, setDispatchLoading] = useState(false);
  const [pruneLoading, setPruneLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  async function handleDispatch() {
    setDispatchLoading(true);
    setFeedback(null);
    try {
      const res = await triggerManualDispatchAction();
      setFeedback(`Dispatched ${res.processed} pending webhook event(s).`);
      router.refresh();
    } catch (e: any) {
      setFeedback(`Dispatch failed: ${e.message || "Error"}`);
    } finally {
      setDispatchLoading(false);
    }
  }

  async function handlePrune() {
    setPruneLoading(true);
    setFeedback(null);
    try {
      const res = await triggerManualPruneAction();
      setFeedback(
        `Pruned ${res.pruned} completed webhook event(s) older than ${retentionDays} days.`,
      );
      router.refresh();
    } catch (e: any) {
      setFeedback(`Pruning failed: ${e.message || "Error"}`);
    } finally {
      setPruneLoading(false);
    }
  }

  return (
    <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-bold">
          Maintenance Controls
        </CardTitle>
        <CardDescription className="text-xs">
          Manually invoke background queue processing and event retention
          cleanup
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {feedback && (
          <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-xs text-primary font-medium flex items-center gap-1.5 animate-in fade-in">
            <CheckCircle2 className="size-3.5 text-primary shrink-0" />
            <span>{feedback}</span>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          {/* Dispatch worker trigger */}
          <div className="p-3.5 rounded-xl border border-border/40 bg-muted/20 space-y-2">
            <div className="flex items-center gap-2">
              <Play className="size-4 text-primary" />
              <span className="text-xs font-bold text-foreground">
                Trigger Dispatch Worker
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Immediately sweeps up to 50 pending or retry-ready webhook events
              and pushes them to n8n endpoints.
            </p>
            <Button
              size="sm"
              onClick={handleDispatch}
              disabled={dispatchLoading}
              className="w-full text-xs font-semibold gap-1.5 h-8 mt-1"
            >
              {dispatchLoading ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <Play className="size-3" />
              )}
              Run Dispatch Now
            </Button>
          </div>

          {/* Prune old events trigger */}
          <div className="p-3.5 rounded-xl border border-border/40 bg-muted/20 space-y-2">
            <div className="flex items-center gap-2">
              <Trash2 className="size-4 text-amber-500" />
              <span className="text-xs font-bold text-foreground">
                Prune Delivered Events
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Removes delivered events older than {retentionDays} days to keep
              database storage well within Neon/Supabase quotas.
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={handlePrune}
              disabled={pruneLoading}
              className="w-full text-xs font-semibold gap-1.5 h-8 mt-1 border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
            >
              {pruneLoading ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <Trash2 className="size-3" />
              )}
              Run Cleanup Now
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
