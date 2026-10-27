import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminOverviewStats } from "@/lib/admin/queries";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Building2,
  Cable,
  CheckCircle2,
  KeyRound,
} from "lucide-react";
import Link from "next/link";

export function AdminKpiCards({ stats }: { stats: AdminOverviewStats }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {/* 1. Installations */}
      <Card className="p-5 border-border/60 bg-card/60 backdrop-blur-sm hover:border-primary/40 transition-all hover:shadow-md">
        <CardHeader className="p-0 flex flex-row items-center justify-between pb-1">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Total Installations
          </CardTitle>
          <div className="size-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Building2 className="size-4" />
          </div>
        </CardHeader>
        <CardContent className="p-0 pt-2 space-y-1.5">
          <div className="text-3xl font-extrabold tracking-tight">
            {stats.totalInstallations.toLocaleString()}
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>GHL Marketplace installs</span>
            <Link
              href="/admin/tenants"
              className="inline-flex items-center gap-0.5 text-primary hover:underline font-medium"
            >
              <span>View</span>
              <ArrowUpRight className="size-3" />
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* 2. Connected Locations */}
      <Card className="p-5 border-border/60 bg-card/60 backdrop-blur-sm hover:border-primary/40 transition-all hover:shadow-md">
        <CardHeader className="p-0 flex flex-row items-center justify-between pb-1">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Connected Locations
          </CardTitle>
          <div className="size-8 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
            <Cable className="size-4" />
          </div>
        </CardHeader>
        <CardContent className="p-0 pt-2 space-y-1.5">
          <div className="text-3xl font-extrabold tracking-tight text-indigo-600 dark:text-indigo-400">
            {stats.totalLocations.toLocaleString()}
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Sub-accounts with active tokens</span>
            <Link
              href="/admin/tenants"
              className="inline-flex items-center gap-0.5 text-primary hover:underline font-medium"
            >
              <span>Manage</span>
              <ArrowUpRight className="size-3" />
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* 3. Bridge Keys */}
      <Card className="p-5 border-border/60 bg-card/60 backdrop-blur-sm hover:border-primary/40 transition-all hover:shadow-md">
        <CardHeader className="p-0 flex flex-row items-center justify-between pb-1">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Active Bridge Keys
          </CardTitle>
          <div className="size-8 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500">
            <KeyRound className="size-4" />
          </div>
        </CardHeader>
        <CardContent className="p-0 pt-2 space-y-1.5">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight">
              {stats.activeBridgeKeys.toLocaleString()}
            </span>
            <span className="text-xs text-muted-foreground">
              / {stats.totalBridgeKeys.toLocaleString()} total
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
              ● {stats.keysUsed24h} active in last 24h
            </span>
            <Link
              href="/admin/keys"
              className="inline-flex items-center gap-0.5 text-primary hover:underline font-medium"
            >
              <span>Keys</span>
              <ArrowUpRight className="size-3" />
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* 4. 24h Webhook Volume */}
      <Card className="p-5 border-border/60 bg-card/60 backdrop-blur-sm hover:border-primary/40 transition-all hover:shadow-md">
        <CardHeader className="p-0 flex flex-row items-center justify-between pb-1">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            24h Webhook Ingestion
          </CardTitle>
          <div className="size-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
            <Activity className="size-4" />
          </div>
        </CardHeader>
        <CardContent className="p-0 pt-2 space-y-1.5">
          <div className="text-3xl font-extrabold tracking-tight text-blue-600 dark:text-blue-400">
            {stats.webhooks24h.toLocaleString()}
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{stats.webhooks7d.toLocaleString()} past 7 days</span>
            <Link
              href="/admin/webhooks"
              className="inline-flex items-center gap-0.5 text-primary hover:underline font-medium"
            >
              <span>Logs</span>
              <ArrowUpRight className="size-3" />
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* 5. Success Rate */}
      <Card className="p-5 border-border/60 bg-card/60 backdrop-blur-sm hover:border-primary/40 transition-all hover:shadow-md">
        <CardHeader className="p-0 flex flex-row items-center justify-between pb-1">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Delivery Success Rate
          </CardTitle>
          <div className="size-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
            <CheckCircle2 className="size-4" />
          </div>
        </CardHeader>
        <CardContent className="p-0 pt-2 space-y-1.5">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400">
              {stats.successRate}%
            </span>
            <Badge
              variant={stats.successRate >= 98 ? "default" : "secondary"}
              className="text-[10px] uppercase font-mono px-1.5"
            >
              {stats.successRate >= 98 ? "Optimal" : "Degraded"}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            {stats.completedWebhooks.toLocaleString()} completed pushes
          </p>
        </CardContent>
      </Card>

      {/* 6. DLQ & Failure Counter */}
      <Card
        className={`p-5 border-border/60 bg-card/60 backdrop-blur-sm transition-all hover:shadow-md ${
          stats.dlqWebhooks > 0
            ? "border-destructive/40 bg-destructive/5"
            : "hover:border-primary/40"
        }`}
      >
        <CardHeader className="p-0 flex flex-row items-center justify-between pb-1">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Dead-Letter Queue (DLQ)
          </CardTitle>
          <div
            className={`size-8 rounded-xl flex items-center justify-center ${
              stats.dlqWebhooks > 0
                ? "bg-destructive/15 text-destructive"
                : "bg-muted text-muted-foreground"
            }`}
          >
            <AlertTriangle className="size-4" />
          </div>
        </CardHeader>
        <CardContent className="p-0 pt-2 space-y-1.5">
          <div
            className={`text-3xl font-extrabold tracking-tight ${
              stats.dlqWebhooks > 0
                ? "text-destructive"
                : "text-muted-foreground"
            }`}
          >
            {stats.dlqWebhooks.toLocaleString()}
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {stats.failedWebhooks > 0
                ? `${stats.failedWebhooks} retrying currently`
                : "0 retrying events"}
            </span>
            {stats.dlqWebhooks > 0 && (
              <Link
                href="/admin/webhooks?status=dlq"
                className="inline-flex items-center gap-0.5 text-destructive hover:underline font-semibold"
              >
                <span>Inspect</span>
                <ArrowUpRight className="size-3" />
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
