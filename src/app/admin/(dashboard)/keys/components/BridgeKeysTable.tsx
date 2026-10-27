"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toggleBridgeKeyAction } from "@/lib/admin/actions";
import { BridgeKeyRow } from "@/lib/admin/queries";
import {
  Check,
  Copy,
  KeyRound,
  Loader2,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function BridgeKeysTable({ keys }: { keys: BridgeKeyRow[] }) {
  const router = useRouter();
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  async function handleToggle(keyId: string, currentStatus: boolean) {
    setTogglingId(keyId);
    try {
      await toggleBridgeKeyAction(keyId, !currentStatus);
      router.refresh();
    } catch (e) {
      console.error("Toggle key failed", e);
    } finally {
      setTogglingId(null);
    }
  }

  function handleCopy(keyVal: string) {
    navigator.clipboard.writeText(keyVal);
    setCopiedKey(keyVal);
    setTimeout(() => setCopiedKey(null), 2000);
  }

  return (
    <Card className="border-border/60 bg-card/60 backdrop-blur-sm overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between py-3.5 px-4 border-b border-border/40">
        <div className="flex items-center gap-2">
          <KeyRound className="size-4 text-primary" />
          <CardTitle className="text-sm font-bold">API Key Inventory</CardTitle>
        </div>
        <Badge variant="outline" className="text-xs font-mono">
          {keys.length} keys total
        </Badge>
      </CardHeader>

      <CardContent className="p-0">
        {keys.length === 0 ? (
          <div className="py-16 text-center text-xs text-muted-foreground">
            No bridge keys created yet. Keys are generated automatically during
            GoHighLevel OAuth.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border/40 bg-muted/20 text-muted-foreground font-semibold">
                  <th className="py-3 px-4">Bridge Key</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Company ID</th>
                  <th className="py-3 px-4">Mapped Locations</th>
                  <th className="py-3 px-4">Last Used</th>
                  <th className="py-3 px-4">Created</th>
                  <th className="py-3 px-4 text-right">Access Control</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {keys.map((key) => {
                  const isRecent =
                    key.last_used_at &&
                    Date.now() - new Date(key.last_used_at).getTime() <
                      24 * 60 * 60 * 1000;

                  return (
                    <tr
                      key={key.id}
                      className="hover:bg-muted/40 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono font-semibold">
                        <div className="flex items-center gap-2">
                          <span>{key.bridge_key.slice(0, 16)}••••</span>
                          <button
                            onClick={() => handleCopy(key.bridge_key)}
                            className="text-muted-foreground hover:text-foreground transition-colors p-1"
                            title="Copy full key"
                          >
                            {copiedKey === key.bridge_key ? (
                              <Check className="size-3 text-emerald-500" />
                            ) : (
                              <Copy className="size-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <Badge
                          variant={key.is_active ? "default" : "secondary"}
                          className={`text-[10px] uppercase font-mono ${
                            key.is_active
                              ? "bg-emerald-600/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                              : "text-muted-foreground"
                          }`}
                        >
                          {key.is_active ? "● Active" : "Revoked"}
                        </Badge>
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px] text-muted-foreground">
                        {key.company_id}
                      </td>

                      <td className="py-3 px-4 font-semibold text-primary">
                        {key.locationsCount} locations
                      </td>

                      <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">
                        {key.last_used_at ? (
                          <div className="flex items-center gap-1.5">
                            {isRecent && (
                              <span className="size-1.5 rounded-full bg-emerald-500" />
                            )}
                            <span>
                              {new Date(key.last_used_at).toLocaleString()}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground/60 italic">
                            Never used
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">
                        {key.created_at
                          ? new Date(key.created_at).toLocaleDateString()
                          : "-"}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <Button
                          variant={key.is_active ? "outline" : "default"}
                          size="sm"
                          disabled={togglingId === key.id}
                          onClick={() => handleToggle(key.id, key.is_active)}
                          className="h-7 px-2.5 text-[11px] font-semibold gap-1"
                        >
                          {togglingId === key.id ? (
                            <Loader2 className="size-3 animate-spin" />
                          ) : key.is_active ? (
                            <>
                              <ShieldAlert className="size-3 text-destructive" />
                              <span>Revoke</span>
                            </>
                          ) : (
                            <>
                              <ShieldCheck className="size-3 text-emerald-500" />
                              <span>Activate</span>
                            </>
                          )}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
