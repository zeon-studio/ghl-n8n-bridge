import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getTenantsWithLocations } from "@/lib/admin/queries";
import { Building2, Cable } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

function getTokenExpiryBadge(expiresAtStr: string) {
  const expiresAt = new Date(expiresAtStr).getTime();
  const now = Date.now();
  const diffHours = (expiresAt - now) / (1000 * 60 * 60);

  if (diffHours <= 0) {
    return (
      <Badge variant="destructive" className="font-mono text-[10px]">
        Expired
      </Badge>
    );
  } else if (diffHours < 24) {
    return (
      <Badge
        variant="secondary"
        className="bg-amber-500/10 text-amber-600 border-amber-500/20 font-mono text-[10px]"
      >
        Expiring in {Math.round(diffHours)}h
      </Badge>
    );
  } else {
    return (
      <Badge
        variant="outline"
        className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-mono text-[10px]"
      >
        Active ({Math.round(diffHours / 24)}d left)
      </Badge>
    );
  }
}

export default async function AdminTenantsPage() {
  const { installations, locations } = await getTenantsWithLocations();

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          Tenants & Locations
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Installed GHL marketplace organizations and connected sub-account
          locations.
        </p>
      </div>

      {/* Installations Card */}
      <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/40">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Building2 className="size-4" />
            </div>
            <div>
              <CardTitle className="text-base font-bold">
                Marketplace Installations
              </CardTitle>
              <CardDescription className="text-xs">
                Company-level and location-level app installs
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="font-mono text-xs">
            {installations.length} total
          </Badge>
        </CardHeader>

        <CardContent className="p-0">
          {installations.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground">
              No installations recorded in database yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border/40 bg-muted/20 text-muted-foreground font-semibold">
                    <th className="py-3 px-4">Company ID</th>
                    <th className="py-3 px-4">User Type</th>
                    <th className="py-3 px-4">Locations Linked</th>
                    <th className="py-3 px-4">Bridge Keys</th>
                    <th className="py-3 px-4">Scopes Granted</th>
                    <th className="py-3 px-4">Installed At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {installations.map((inst) => (
                    <tr
                      key={inst.id}
                      className="hover:bg-muted/40 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono font-semibold">
                        {inst.company_id}
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant="outline"
                          className="text-[10px] font-mono"
                        >
                          {inst.user_type}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 font-semibold text-primary">
                        {inst.locationsCount} sub-accounts
                      </td>
                      <td className="py-3 px-4">{inst.keysCount} keys</td>
                      <td className="py-3 px-4 max-w-50">
                        <span
                          className="text-[11px] text-muted-foreground truncate block"
                          title={inst.scopes?.join(", ")}
                        >
                          {inst.scopes
                            ? `${inst.scopes.length} scopes (${inst.scopes.slice(0, 3).join(", ")}...)`
                            : "None"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {inst.created_at
                          ? new Date(inst.created_at).toLocaleDateString()
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sub-Accounts & Locations Card */}
      <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/40">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
              <Cable className="size-4" />
            </div>
            <div>
              <CardTitle className="text-base font-bold">
                Sub-Account Location Tokens
              </CardTitle>
              <CardDescription className="text-xs">
                Tokens used by the broker to issue short-lived credentials to
                n8n
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="font-mono text-xs">
            {locations.length} locations
          </Badge>
        </CardHeader>

        <CardContent className="p-0">
          {locations.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground">
              No location tokens stored yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border/40 bg-muted/20 text-muted-foreground font-semibold">
                    <th className="py-3 px-4">Location ID</th>
                    <th className="py-3 px-4">Token Status</th>
                    <th className="py-3 px-4">Associated Keys</th>
                    <th className="py-3 px-4">Webhooks Ingested</th>
                    <th className="py-3 px-4">Connected At</th>
                    <th className="py-3 px-4 text-right">Quick Links</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {locations.map((loc) => (
                    <tr
                      key={loc.id}
                      className="hover:bg-muted/40 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono font-semibold text-foreground">
                        {loc.location_id}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {getTokenExpiryBadge(loc.expires_at)}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-muted-foreground">
                        {loc.bridgeKeys.length > 0 ? (
                          <span
                            className="truncate block max-w-40"
                            title={loc.bridgeKeys.join(", ")}
                          >
                            {loc.bridgeKeys[0].slice(0, 12)}...
                          </span>
                        ) : (
                          <span className="text-muted-foreground italic">
                            No key linked
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant="outline"
                          className="font-mono text-[10px]"
                        >
                          {loc.webhookCount.toLocaleString()} events
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {loc.created_at
                          ? new Date(loc.created_at).toLocaleDateString()
                          : "-"}
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <Link
                          href={`/admin/webhooks?locationId=${encodeURIComponent(loc.location_id)}`}
                          className="text-primary hover:underline font-medium text-[11px]"
                        >
                          View Logs
                        </Link>
                        <Link
                          href={`/dashboard?locationId=${encodeURIComponent(loc.location_id)}`}
                          target="_blank"
                          className="text-muted-foreground hover:text-foreground font-medium text-[11px]"
                        >
                          Tenant View ↗
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
