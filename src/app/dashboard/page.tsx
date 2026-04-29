import { CopyValueButton } from "@/components/copy-value-button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getSupabaseServiceRoleClient } from "@/lib/supabase/client";
import { getWebhookEventsByLocation } from "@/lib/supabase/queries";
import { KeyRound, ShieldAlert, Sparkles } from "lucide-react";
import { cookies } from "next/headers";
import { DashboardShell } from "./components/DashboardShell";

export const dynamic = "force-dynamic";

const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

type BridgeKey = {
  id: string;
  key_value: string;
  created_at: string;
  is_active: boolean;
};

type WebhookEvent = {
  id: string;
  event_type: string;
  status: string | null;
  attempts: number | null;
  max_attempts: number | null;
  created_at: string | null;
  processed_at: string | null;
  next_retry_at: string | null;
  error_message: string | null;
  idempotency_key: string | null;
};

function statusVariant(
  status: string | null,
): "default" | "secondary" | "destructive" | "outline" {
  if (!status) return "outline";
  if (status === "completed") return "default";
  if (status === "dlq") return "destructive";
  if (status === "failed") return "secondary";
  if (status === "processing") return "outline";
  return "secondary";
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{
    session?: string;
    locationId?: string;
    success?: string;
    key?: string;
    error?: string;
    error_description?: string;
  }>;
}) {
  const params = await searchParams;
  const cookieStore = await cookies();
  const locationId =
    params.locationId ?? cookieStore.get("ghl_location_id")?.value;
  const bridgeKey = params.key;
  const oauthError = params.error;
  const oauthErrorDescription = params.error_description;
  const isNewInstall = params.success === "1" && !!bridgeKey;

  // Fetch bridge keys
  const supabase = getSupabaseServiceRoleClient();
  let keys: BridgeKey[] = [];
  if (locationId) {
    const { data: locs } = await supabase
      .from("bridge_locations")
      .select(
        `bridge_key_id, bridge_keys ( id, key_value, created_at, is_active )`,
      )
      .eq("location_id", locationId);
    if (locs) {
      keys = (locs as any[])
        .map((l) => l.bridge_keys)
        .filter((k): k is BridgeKey => Boolean(k?.id));
    }
  }

  // Fetch webhook events
  let events: WebhookEvent[] = [];
  if (locationId) {
    events = (await getWebhookEventsByLocation(
      locationId,
      60,
    )) as WebhookEvent[];
  }

  const completed = events.filter((e) => e.status === "completed").length;
  const processing = events.filter((e) => e.status === "processing").length;
  const retrying = events.filter((e) => e.status === "failed").length;
  const dlq = events.filter((e) => e.status === "dlq").length;

  return (
    <DashboardShell
      title="Integration control center"
      description="Manage your bridge connection and continue setup from one place."
      locationId={locationId}
    >
      {/* ── OAuth error ── */}
      {oauthError && (
        <Alert variant="destructive">
          <ShieldAlert className="size-4" />
          <AlertTitle>OAuth setup failed: {oauthError}</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>{oauthErrorDescription || "Unable to finish authorization."}</p>
            {oauthError === "invalid_grant" && (
              <p>
                Use a freshly generated install flow from the GHL Marketplace
                and do not reuse a callback URL code.
              </p>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* ── Missing location ── */}
      {!locationId && (
        <Alert>
          <AlertTitle>Missing location context</AlertTitle>
          <AlertDescription>
            Access this dashboard from inside your GoHighLevel account so we can
            identify your location.
          </AlertDescription>
        </Alert>
      )}

      {/* ── Connection card: location ID + bridge keys merged ── */}
      {locationId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {isNewInstall ? (
                <>
                  <Sparkles className="size-4" />
                  App installed successfully
                </>
              ) : (
                "You are connected"
              )}
            </CardTitle>
            <CardDescription>
              {isNewInstall
                ? "Copy the bridge key below into your n8n GHL Bridge credential."
                : "Your location is detected. Copy your bridge key and location ID to configure n8n."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Location ID row */}
            <div>
              <p className="mb-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Location ID
              </p>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <code className="flex-1 rounded-md border bg-background px-3 py-2 font-mono text-sm break-all select-all">
                  {locationId}
                </code>
                <CopyValueButton value={locationId} label="Copy location ID" />
              </div>
            </div>

            <Separator />

            {/* Bridge keys */}
            <div>
              <p className="mb-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                <KeyRound className="size-3" />
                Bridge Keys
              </p>
              {isNewInstall && bridgeKey ? (
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <code className="flex-1 rounded-md border bg-background px-3 py-2 font-mono text-sm break-all select-all">
                    {bridgeKey}
                  </code>
                  <CopyValueButton value={bridgeKey} label="Copy key" />
                </div>
              ) : keys.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No bridge keys found. Reinstall the marketplace app to
                  provision a key.
                </p>
              ) : (
                <div className="space-y-3">
                  {keys.map((key) => (
                    <div key={key.id} className="space-y-2">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <code className="flex-1 rounded-md border bg-background px-3 py-2 font-mono text-sm break-all select-all">
                          {key.key_value}
                        </code>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={key.is_active ? "default" : "secondary"}
                          >
                            {key.is_active ? "Active" : "Inactive"}
                          </Badge>
                          <CopyValueButton
                            value={key.key_value}
                            label="Copy key"
                          />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Created {new Date(key.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Webhook status ── */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">Webhook Status</h2>
        {!locationId ? (
          <Alert>
            <AlertTitle>Missing location context</AlertTitle>
            <AlertDescription>
              Open this dashboard from your GoHighLevel account so webhook
              history can be scoped to your location.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-4">
              <Card className="hover:border-primary/50 transition-colors">
                <CardHeader>
                  <CardTitle className="text-base">Completed</CardTitle>
                  <CardDescription>Successfully delivered</CardDescription>
                </CardHeader>
                <CardContent className="text-3xl font-semibold">
                  {completed}
                </CardContent>
              </Card>
              <Card className="hover:border-primary/50 transition-colors">
                <CardHeader>
                  <CardTitle className="text-base">Processing</CardTitle>
                  <CardDescription>Currently dispatching</CardDescription>
                </CardHeader>
                <CardContent className="text-3xl font-semibold">
                  {processing}
                </CardContent>
              </Card>
              <Card className="hover:border-primary/50 transition-colors">
                <CardHeader>
                  <CardTitle className="text-base">Retrying</CardTitle>
                  <CardDescription>Failed, scheduled for retry</CardDescription>
                </CardHeader>
                <CardContent className="text-3xl font-semibold">
                  {retrying}
                </CardContent>
              </Card>
              <Card className="hover:border-primary/50 transition-colors">
                <CardHeader>
                  <CardTitle className="text-base">DLQ</CardTitle>
                  <CardDescription>Max retries exhausted</CardDescription>
                </CardHeader>
                <CardContent className="text-3xl font-semibold">
                  {dlq}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recent events</CardTitle>
                <CardDescription>
                  Latest 60 events for this location.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {events.length === 0 ? (
                  <Alert>
                    <AlertTitle>No webhook events yet</AlertTitle>
                    <AlertDescription>
                      Trigger an action in GoHighLevel and refresh this page to
                      see delivery logs.
                    </AlertDescription>
                  </Alert>
                ) : (
                  events.map((event) => (
                    <div
                      key={event.id}
                      className="rounded-xl border bg-background p-4"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">
                            {event.event_type}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Created{" "}
                            {event.created_at
                              ? new Date(event.created_at).toLocaleString()
                              : "-"}
                          </p>
                          {event.next_retry_at ? (
                            <p className="text-xs text-muted-foreground">
                              Next retry{" "}
                              {new Date(event.next_retry_at).toLocaleString()}
                            </p>
                          ) : null}
                          {event.error_message ? (
                            <p className="text-xs text-destructive">
                              {event.error_message}
                            </p>
                          ) : null}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className="font-mono text-[10px] uppercase"
                          >
                            {event.attempts ?? 0}/{event.max_attempts ?? 3}
                          </Badge>
                          <Badge variant={statusVariant(event.status)}>
                            {event.status || "unknown"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
