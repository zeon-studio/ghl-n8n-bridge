import { Badge } from "@/components/ui/badge";
import { getPaginatedWebhookEvents } from "@/lib/admin/queries";
import { WebhookLogsTable } from "./components/WebhookLogsTable";

export const dynamic = "force-dynamic";

export default async function AdminWebhooksPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    status?: string;
    eventType?: string;
    locationId?: string;
    search?: string;
  }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);
  const status = params.status || "all";
  const eventType = params.eventType || "all";
  const search = params.search || "";
  const locationId = params.locationId || undefined;

  const { events, total, totalPages } = await getPaginatedWebhookEvents({
    page,
    limit: 25,
    status,
    eventType,
    locationId,
    search,
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Webhook Logs & DLQ
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time feed of ingested GoHighLevel events and push dispatches to
            n8n workflow listeners.
          </p>
        </div>

        <Badge
          variant="outline"
          className="text-xs font-mono self-start sm:self-auto px-3 py-1"
        >
          {total.toLocaleString()} matching events
        </Badge>
      </div>

      <WebhookLogsTable
        events={events}
        total={total}
        totalPages={totalPages}
        currentPage={page}
        currentStatus={status}
        currentSearch={search}
      />
    </div>
  );
}
