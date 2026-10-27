import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getAdminOverviewStats,
  getEventTypeDistribution,
  getRecentDlqAlerts,
  getWebhookThroughputTimeSeries,
} from "@/lib/admin/queries";
import { ArrowUpRight, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { AdminKpiCards } from "./components/AdminKpiCards";
import { DlqAlertBanner } from "./components/DlqAlertBanner";
import { EventTypeDistribution } from "./components/EventTypeDistribution";
import { ThroughputChart } from "./components/ThroughputChart";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const [stats, throughputData, eventStats, recentAlerts] = await Promise.all([
    getAdminOverviewStats(),
    getWebhookThroughputTimeSeries("7d"),
    getEventTypeDistribution(7),
    getRecentDlqAlerts(5),
  ]);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Banner / Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Platform Insights
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time telemetry across GHL OAuth installations, bridge keys, and
            n8n webhook pipelines.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs px-3 py-1 font-mono">
            {stats.webhooksTotal.toLocaleString()} total webhooks ingested
          </Badge>
        </div>
      </div>

      {/* Dead-Letter Queue Alert Banner */}
      <DlqAlertBanner dlqCount={stats.dlqWebhooks} />

      {/* Key KPI Metrics Grid */}
      <AdminKpiCards stats={stats} />

      {/* Visualization Grid */}
      <div className="grid gap-6 lg:grid-cols-[1fr,360px] items-start">
        <ThroughputChart initialData={throughputData} timeframe="7d" />
        <EventTypeDistribution stats={eventStats} />
      </div>

      {/* Recent Failing / DLQ Events & System Pipeline */}
      {recentAlerts.length > 0 && (
        <Card className="p-5 border-border/60 bg-card/60 backdrop-blur-sm">
          <CardHeader className="p-0 flex flex-row items-center justify-between pb-3">
            <div className="flex items-center gap-2">
              <div className="size-7 rounded-lg bg-destructive/10 flex items-center justify-center text-destructive">
                <ShieldAlert className="size-4" />
              </div>
              <div>
                <CardTitle className="text-base font-bold">
                  Recent Pipeline Failures
                </CardTitle>
                <CardDescription className="text-xs">
                  Latest webhook events requiring investigation
                </CardDescription>
              </div>
            </div>
            <Link
              href="/admin/webhooks?status=dlq"
              className="text-xs text-primary hover:underline font-medium inline-flex items-center gap-0.5"
            >
              <span>View all failures</span>
              <ArrowUpRight className="size-3" />
            </Link>
          </CardHeader>
          <CardContent className="p-0 pt-3 space-y-2.5">
            {recentAlerts.map((alert) => (
              <div
                key={alert.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl border border-border/50 bg-background/50 hover:border-destructive/30 transition-colors gap-2"
              >
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs truncate">
                      {alert.event_type}
                    </span>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      Location: {alert.location_id.slice(0, 10)}...
                    </Badge>
                    <Badge
                      variant={
                        alert.status === "dlq" ? "destructive" : "secondary"
                      }
                      className="text-[10px] uppercase font-mono"
                    >
                      {alert.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate font-mono">
                    {alert.error_message || "Push destination failed"}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0 text-xs text-muted-foreground">
                  <span className="text-[11px]">
                    Attempts: {alert.attempts}/{alert.max_attempts}
                  </span>
                  <span className="text-[11px]">
                    {alert.created_at
                      ? new Date(alert.created_at).toLocaleTimeString()
                      : "-"}
                  </span>
                  <Link
                    href={`/admin/webhooks?search=${encodeURIComponent(alert.id)}`}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    Inspect
                  </Link>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
