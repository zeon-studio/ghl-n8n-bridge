import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getSupabaseServiceRoleClient } from "@/lib/supabase/client";
import { getWebhookEventsByLocation } from "@/lib/supabase/queries";
import { Cable, CheckCircle2, Copy, KeyRound, ShieldAlert } from "lucide-react";
import { cookies } from "next/headers";
import Link from "next/link";
import { CredentialBox } from "./components/CredentialBox";
import { DashboardShell } from "./components/DashboardShell";
import { SetupGuide } from "./components/SetupGuide";
import { SuccessBanner } from "./components/SuccessBanner";
import { TestConnection } from "./components/TestConnection";
import { WorkflowTemplates } from "./components/WorkflowTemplates";

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

  // GHL often uses location_id (snake_case) in query params
  const rawLocationId =
    (params as any).locationId || (params as any).location_id;
  const locationId =
    rawLocationId ??
    cookieStore.get("ghl_location_id")?.value ??
    cookieStore.get("location_id")?.value;

  const bridgeKey = params.key;
  const oauthError = params.error;
  const oauthErrorDescription = params.error_description;
  const isNewInstall = params.success === "1" && !!bridgeKey;

  // Fetch bridge keys
  const supabase = getSupabaseServiceRoleClient();
  let keys: BridgeKey[] = [];

  if (locationId) {
    // Primary join via bridge_locations - location_id is here
    const { data: locs } = await supabase
      .from("bridge_locations")
      .select(`bridge_keys ( id, bridge_key, created_at, is_active )`)
      .eq("location_id", locationId);

    if (locs && locs.length > 0) {
      keys = locs
        .flatMap((l: any) => l.bridge_keys)
        .filter((k: any) => Boolean(k?.id))
        .map((k: any) => ({
          id: k.id,
          key_value: k.bridge_key,
          created_at: k.created_at,
          is_active: !!k.is_active,
        }));
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
      title="Bridge Control Center"
      description="Manage your bridge connection and continue setup from one place."
      locationId={locationId}
    >
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-6 grid w-full grid-cols-2 max-w-[400px]">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="webhooks">Webhook Logs</TabsTrigger>
        </TabsList>

        <TabsContent
          value="overview"
          className="space-y-10 mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500"
        >
          {oauthError && (
            <Alert
              variant="destructive"
              className="border-destructive/20 bg-destructive/5 backdrop-blur-sm"
            >
              <ShieldAlert className="size-5" />
              <div className="ml-2">
                <AlertTitle className="text-lg font-bold">
                  Connection Failed
                </AlertTitle>
                <AlertDescription className="mt-1 opacity-90">
                  <p>
                    {oauthErrorDescription || "Unable to finish authorization."}
                  </p>
                  {oauthError === "invalid_grant" && (
                    <p className="mt-2 text-xs font-medium">
                      Tip: Use a freshly generated install flow from the GHL
                      Marketplace and do not reuse a callback URL code.
                    </p>
                  )}
                </AlertDescription>
              </div>
            </Alert>
          )}

          {!locationId && (
            <Alert className="bg-amber-500/5 border-amber-500/20 backdrop-blur-sm">
              <ShieldAlert className="size-5 text-amber-500" />
              <div className="ml-2">
                <AlertTitle className="text-lg font-bold text-amber-600 dark:text-amber-400">
                  Location Context Missing
                </AlertTitle>
                <AlertDescription className="mt-1 opacity-90">
                  Please access this dashboard from inside your GoHighLevel
                  account sidebar to correctly identify your location.
                </AlertDescription>
              </div>
            </Alert>
          )}

          {locationId && (
            <div className="space-y-6">
              {/* 1. Success Message - Dismissible version */}
              <SuccessBanner isNewInstall={isNewInstall} />

              {/* 2. Credentials Card */}
              <div className="grid gap-6 md:grid-cols-2">
                <Card className="border-none bg-linear-to-br from-background via-muted/50 to-background shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Cable className="size-5" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-bold">
                          Location ID
                        </CardTitle>
                        <CardDescription>
                          Required for n8n credentials
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CredentialBox 
                      value={locationId || ""} 
                      label="Location ID" 
                      variant="primary" 
                    />
                  </CardContent>
                </Card>

                <Card className="border-none bg-linear-to-br from-background via-muted/50 to-background shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500">
                        <KeyRound className="size-5" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-bold">
                          Bridge Key
                        </CardTitle>
                        <CardDescription>
                          Secret API key for n8n
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {bridgeKey ? (
                      <div className="space-y-4">
                        <CredentialBox 
                          value={bridgeKey} 
                          label="Bridge Key" 
                          variant="indigo" 
                        />
                        <TestConnection
                          bridgeKey={bridgeKey}
                          locationId={locationId}
                          baseUrl={appBaseUrl}
                        />
                      </div>
                    ) : keys.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-4 text-center space-y-3">
                        <p className="text-sm text-muted-foreground font-medium">
                          No active bridge keys found.
                        </p>
                        <Link
                          href="/api/auth/ghl"
                          className="inline-flex items-center rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-sm hover:scale-105 transition-transform"
                        >
                          Generate New Key
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {keys.slice(0, 1).map((key) => (
                          <div key={key.id} className="space-y-4">
                            <CredentialBox 
                              value={key.key_value} 
                              label="Bridge Key" 
                              variant="indigo" 
                            />
                            <div className="flex items-center justify-between">
                              <Badge
                                variant={
                                  key.is_active ? "default" : "secondary"
                                }
                                className="rounded-full px-3"
                              >
                                {key.is_active ? "● Active" : "Inactive"}
                              </Badge>
                              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                                Created{" "}
                                {new Date(key.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <TestConnection
                              bridgeKey={key.key_value}
                              locationId={locationId}
                              baseUrl={appBaseUrl}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="relative group">
                <div className="absolute -inset-1 rounded-3xl bg-linear-to-r from-primary/20 via-indigo-500/20 to-primary/20 opacity-0 blur-xl group-hover:opacity-100 transition-opacity duration-500" />
                <WorkflowTemplates />
              </div>

              <SetupGuide />
            </div>
          )}
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-6 mt-0">
          <div>
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
                      <CardDescription>
                        Failed, scheduled for retry
                      </CardDescription>
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
                          Trigger an action in GoHighLevel and refresh this page
                          to see delivery logs.
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
                                  {new Date(
                                    event.next_retry_at,
                                  ).toLocaleString()}
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
        </TabsContent>
      </Tabs>
    </DashboardShell>
  );
}
