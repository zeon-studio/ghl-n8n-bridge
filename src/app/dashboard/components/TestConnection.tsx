"use client";

import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { useState } from "react";

export function TestConnection({
  bridgeKey,
  locationId,
  baseUrl,
}: {
  bridgeKey: string;
  locationId: string;
  baseUrl: string;
}) {
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");

  const testConnection = async () => {
    setStatus("loading");
    setMessage("");
    try {
      const res = await fetch(
        `${baseUrl}/api/v1/token?bridge_key=${bridgeKey}&location_id=${locationId}`,
      );

      if (!res.ok) {
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const error = await res.json();
          throw new Error(error.error || "Failed to fetch token");
        }
        throw new Error(`Connection failed (HTTP ${res.status})`);
      }

      const data = await res.json();
      if (data.access_token) {
        setStatus("success");
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err: any) {
      setStatus("error");
      setMessage(err.message || "An error occurred while connecting");
    }
  };

  return (
    <div className="flex flex-col gap-2 pt-2">
      <div className="flex items-center gap-3">
        <Button
          onClick={testConnection}
          disabled={status === "loading" || !bridgeKey || !locationId}
          variant="outline"
          size="sm"
          className="h-8 shadow-sm"
        >
          {status === "loading" && (
            <Loader2 className="mr-2 size-3.5 animate-spin" />
          )}
          Test Connection
        </Button>
        {status === "success" && (
          <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="size-3.5" />
            Active
          </span>
        )}
        {status === "error" && (
          <span className="flex items-center gap-1.5 text-xs font-medium text-destructive">
            <XCircle className="size-3.5" />
            Failed
          </span>
        )}
      </div>
      {status === "error" && (
        <p className="text-xs text-destructive font-medium">{message}</p>
      )}
      {status === "success" && (
        <p className="text-xs text-muted-foreground">{message}</p>
      )}
    </div>
  );
}
