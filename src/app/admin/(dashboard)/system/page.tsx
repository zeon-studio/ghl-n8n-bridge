import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getSystemDiagnostics } from "@/lib/admin/queries";
import { Database, HardDrive, Zap } from "lucide-react";
import { SystemActionsCard } from "./components/SystemActionsCard";

export const dynamic = "force-dynamic";

export default async function AdminSystemPage() {
  const diag = await getSystemDiagnostics();

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          System & Storage Health
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Postgres database sizing, queue health, retention policy, and
          background jobs.
        </p>
      </div>

      {/* Database Table Sizing Grid */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Database className="size-4 text-primary" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Database Table Counts
          </h3>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs font-semibold">
                webhook_events
              </CardDescription>
              <CardTitle className="text-2xl font-bold font-mono text-primary">
                {diag.tableCounts.webhookEvents.toLocaleString()}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 text-[11px] text-muted-foreground">
              Ingested event logs and queue buffer
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs font-semibold">
                ghl_location_tokens
              </CardDescription>
              <CardTitle className="text-2xl font-bold font-mono">
                {diag.tableCounts.locations.toLocaleString()}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 text-[11px] text-muted-foreground">
              Active sub-account location access tokens
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs font-semibold">
                bridge_keys
              </CardDescription>
              <CardTitle className="text-2xl font-bold font-mono">
                {diag.tableCounts.bridgeKeys.toLocaleString()}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 text-[11px] text-muted-foreground">
              Master secret API keys for n8n credentials
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs font-semibold">
                ghl_installations
              </CardDescription>
              <CardTitle className="text-2xl font-bold font-mono">
                {diag.tableCounts.installations.toLocaleString()}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 text-[11px] text-muted-foreground">
              Marketplace OAuth organization records
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs font-semibold">
                bridge_locations
              </CardDescription>
              <CardTitle className="text-2xl font-bold font-mono">
                {diag.tableCounts.bridgeLocations.toLocaleString()}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 text-[11px] text-muted-foreground">
              Key-to-location authorization mappings
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs font-semibold">
                webhook_subscriptions
              </CardDescription>
              <CardTitle className="text-2xl font-bold font-mono">
                {diag.tableCounts.webhookSubscriptions.toLocaleString()}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 text-[11px] text-muted-foreground">
              Active n8n push webhook listeners
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Diagnostics & Retention Policy */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Queue Backlog */}
        <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <HardDrive className="size-4 text-primary" />
              <CardTitle className="text-base font-bold">
                Queue Backlog
              </CardTitle>
            </div>
            <CardDescription className="text-xs">
              State of asynchronous webhook dispatch queue
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/30">
              <span className="text-muted-foreground">Pending Events:</span>
              <span className="font-mono font-bold text-foreground">
                {diag.pendingQueueCount}
              </span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/30">
              <span className="text-muted-foreground">Oldest Pending Age:</span>
              <span className="font-mono font-semibold text-foreground">
                {diag.oldestPendingAgeSeconds !== null
                  ? `${Math.round(diag.oldestPendingAgeSeconds)}s ago`
                  : "Queue empty"}
              </span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/30">
              <span className="text-muted-foreground">Retention Policy:</span>
              <Badge variant="outline" className="font-mono text-[10px]">
                {diag.retentionDays} days retention
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Rate Limiting & Edge Shield */}
        <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Zap className="size-4 text-indigo-500" />
              <CardTitle className="text-base font-bold">
                Rate Limiting & Protection
              </CardTitle>
            </div>
            <CardDescription className="text-xs">
              Burst protection and per-bridge key request throttling
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/30">
              <span className="text-muted-foreground">
                Upstash Redis Status:
              </span>
              <Badge
                variant={diag.isRedisConfigured ? "default" : "secondary"}
                className="text-[10px] uppercase font-mono"
              >
                {diag.isRedisConfigured ? "● Connected" : "Disabled / Bypass"}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/30">
              <span className="text-muted-foreground">Token API Limit:</span>
              <span className="font-mono font-semibold text-foreground">
                60 req/min
              </span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/30">
              <span className="text-muted-foreground">Global Burst Limit:</span>
              <span className="font-mono font-semibold text-foreground">
                10 req/sec
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Manual Maintenance Controls */}
      <SystemActionsCard retentionDays={diag.retentionDays} />
    </div>
  );
}
