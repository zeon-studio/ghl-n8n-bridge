"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toggleSubscriptionAction } from "@/lib/admin/actions";
import { WebhookSubscriptionRow } from "@/lib/admin/queries";
import { Loader2, Send, Shield } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function SubscriptionsTable({
  subscriptions,
}: {
  subscriptions: WebhookSubscriptionRow[];
}) {
  const router = useRouter();
  const [togglingId, setTogglingId] = useState<string | null>(null);

  async function handleToggle(id: string, currentStatus: boolean) {
    setTogglingId(id);
    try {
      await toggleSubscriptionAction(id, !currentStatus);
      router.refresh();
    } catch (e) {
      console.error("Toggle subscription failed", e);
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <Card className="border-border/60 bg-card/60 backdrop-blur-sm overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between py-3.5 px-4 border-b border-border/40">
        <div className="flex items-center gap-2">
          <Send className="size-4 text-primary" />
          <CardTitle className="text-sm font-bold">
            n8n Push Endpoints
          </CardTitle>
        </div>
        <Badge variant="outline" className="text-xs font-mono">
          {subscriptions.length} endpoints
        </Badge>
      </CardHeader>

      <CardContent className="p-0">
        {subscriptions.length === 0 ? (
          <div className="py-16 text-center text-xs text-muted-foreground">
            No n8n webhook listeners registered yet. Use the GHL Bridge Trigger
            node in n8n to subscribe.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border/40 bg-muted/20 text-muted-foreground font-semibold">
                  <th className="py-3 px-4">Target Webhook URL</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Location ID</th>
                  <th className="py-3 px-4">Subscribed Events</th>
                  <th className="py-3 px-4">HMAC Signed</th>
                  <th className="py-3 px-4">Registered</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {subscriptions.map((sub) => (
                  <tr
                    key={sub.id}
                    className="hover:bg-muted/40 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-medium max-w-70">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="truncate" title={sub.webhook_url}>
                          {sub.webhook_url}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <Badge
                        variant={sub.is_active ? "default" : "secondary"}
                        className={`text-[10px] uppercase font-mono ${
                          sub.is_active
                            ? "bg-emerald-600/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                            : "text-muted-foreground"
                        }`}
                      >
                        {sub.is_active ? "● Active" : "Paused"}
                      </Badge>
                    </td>

                    <td className="py-3 px-4 font-mono text-[11px] text-muted-foreground">
                      <span className="truncate inline-block max-w-35">
                        {sub.location_id}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1 max-w-50">
                        {sub.event_types.includes("*") ? (
                          <Badge
                            variant="outline"
                            className="text-[10px] font-mono bg-primary/5"
                          >
                            ★ All Events (*)
                          </Badge>
                        ) : (
                          sub.event_types.map((type) => (
                            <Badge
                              key={type}
                              variant="outline"
                              className="text-[10px] font-mono truncate max-w-30"
                            >
                              {type}
                            </Badge>
                          ))
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      {sub.has_secret ? (
                        <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                          <Shield className="size-3" />
                          <span>Yes (SHA256)</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-[11px]">
                          No secret
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">
                      {sub.created_at
                        ? new Date(sub.created_at).toLocaleDateString()
                        : "-"}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <Button
                        variant={sub.is_active ? "outline" : "default"}
                        size="sm"
                        disabled={togglingId === sub.id}
                        onClick={() => handleToggle(sub.id, sub.is_active)}
                        className="h-7 px-2.5 text-[11px] font-semibold"
                      >
                        {togglingId === sub.id ? (
                          <Loader2 className="size-3 animate-spin" />
                        ) : sub.is_active ? (
                          "Pause"
                        ) : (
                          "Resume"
                        )}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
