import { Badge } from "@/components/ui/badge";
import { getSubscriptionsWithStats } from "@/lib/admin/queries";
import { SubscriptionsTable } from "./components/SubscriptionsTable";

export const dynamic = "force-dynamic";

export default async function AdminSubscriptionsPage() {
  const subscriptions = await getSubscriptionsWithStats();
  const activeCount = subscriptions.filter((s) => s.is_active).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            n8n Push Subscriptions
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Registered webhook trigger endpoints receiving real-time GHL event
            dispatches.
          </p>
        </div>

        <Badge
          variant="outline"
          className="text-xs font-mono self-start sm:self-auto px-3 py-1"
        >
          {activeCount} active / {subscriptions.length} registered
        </Badge>
      </div>

      <SubscriptionsTable subscriptions={subscriptions} />
    </div>
  );
}
