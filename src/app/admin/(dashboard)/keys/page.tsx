import { Badge } from "@/components/ui/badge";
import { getBridgeKeysWithStats } from "@/lib/admin/queries";
import { BridgeKeysTable } from "./components/BridgeKeysTable";

export const dynamic = "force-dynamic";

export default async function AdminKeysPage() {
  const keys = await getBridgeKeysWithStats();
  const activeCount = keys.filter((k) => k.is_active).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Bridge API Keys
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Authentication tokens configured in n8n workflows to access
            short-lived GHL credentials.
          </p>
        </div>

        <Badge
          variant="outline"
          className="text-xs font-mono self-start sm:self-auto px-3 py-1"
        >
          {activeCount} active / {keys.length} total
        </Badge>
      </div>

      <BridgeKeysTable keys={keys} />
    </div>
  );
}
