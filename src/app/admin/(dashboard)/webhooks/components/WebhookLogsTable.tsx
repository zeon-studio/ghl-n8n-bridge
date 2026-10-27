"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  retryAllDlqEventsAction,
  retryWebhookEventAction,
} from "@/lib/admin/actions";
import { WebhookEventRow } from "@/lib/admin/queries";
import {
  AlertTriangle,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Eye,
  Loader2,
  RotateCcw,
  Search,
  X,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

function getStatusBadge(status: string) {
  switch (status) {
    case "completed":
      return (
        <Badge
          variant="default"
          className="bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
        >
          ● Completed
        </Badge>
      );
    case "dlq":
      return (
        <Badge variant="destructive" className="font-bold">
          ● Dead Letter (DLQ)
        </Badge>
      );
    case "failed":
      return (
        <Badge
          variant="secondary"
          className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
        >
          ● Retrying
        </Badge>
      );
    case "processing":
      return (
        <Badge
          variant="outline"
          className="bg-blue-500/10 text-blue-600 border-blue-500/20"
        >
          ● Processing
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export function WebhookLogsTable({
  events,
  total,
  totalPages,
  currentPage,
  currentStatus,
  currentSearch,
}: {
  events: WebhookEventRow[];
  total: number;
  totalPages: number;
  currentPage: number;
  currentStatus: string;
  currentSearch: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [searchInput, setSearchInput] = useState(currentSearch);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [isRetryingAll, setIsRetryingAll] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<WebhookEventRow | null>(
    null,
  );
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [copied, setCopied] = useState(false);

  function updateQuery(newParams: Record<string, string | null>) {
    const next = new URLSearchParams(searchParams.toString());
    Object.entries(newParams).forEach(([k, v]) => {
      if (v === null || v === "") {
        next.delete(k);
      } else {
        next.set(k, v);
      }
    });
    router.push(`/admin/webhooks?${next.toString()}`);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    updateQuery({ search: searchInput.trim() || null, page: "1" });
  }

  async function handleRetrySingle(id: string) {
    setRetryingId(id);
    try {
      await retryWebhookEventAction(id);
      router.refresh();
      if (selectedEvent?.id === id) {
        setSelectedEvent({ ...selectedEvent, status: "completed" });
      }
    } catch (e) {
      console.error("Retry single failed", e);
    } finally {
      setRetryingId(null);
    }
  }

  async function handleRetryAll() {
    setIsRetryingAll(true);
    try {
      await retryAllDlqEventsAction();
      router.refresh();
    } catch (e) {
      console.error("Retry all DLQ failed", e);
    } finally {
      setIsRetryingAll(false);
    }
  }

  async function openDetail(event: WebhookEventRow) {
    setSelectedEvent(event);
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/admin/webhooks/${event.id}`);
      if (res.ok) {
        const full = await res.json();
        setSelectedEvent(full);
      }
    } catch (e) {
      console.error("Failed to load payload", e);
    } finally {
      setLoadingDetail(false);
    }
  }

  function handleCopyJson() {
    if (selectedEvent?.payload) {
      navigator.clipboard.writeText(
        JSON.stringify(selectedEvent.payload, null, 2),
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const STATUS_TABS = [
    { label: "All Events", value: "all" },
    { label: "Completed", value: "completed" },
    { label: "Retrying", value: "failed" },
    { label: "Dead Letter (DLQ)", value: "dlq" },
    { label: "Processing", value: "processing" },
  ];

  return (
    <div className="space-y-4">
      {/* Search & Status Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => updateQuery({ status: tab.value, page: "1" })}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                currentStatus === tab.value
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search form */}
        <form
          onSubmit={handleSearch}
          className="flex items-center gap-2 max-w-sm w-full"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              placeholder="Search location, event, error..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-8.5 h-9 text-xs bg-muted/30"
            />
          </div>
          <Button
            type="submit"
            size="sm"
            variant="secondary"
            className="h-9 px-3 text-xs"
          >
            Search
          </Button>
        </form>
      </div>

      {/* Main Table Card */}
      <Card className="border-border/60 bg-card/60 backdrop-blur-sm overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between py-3.5 px-4 border-b border-border/40">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-bold">Event Feed</CardTitle>
            <Badge variant="outline" className="text-[10px] font-mono">
              {total.toLocaleString()} total
            </Badge>
          </div>

          {currentStatus === "dlq" && (
            <Button
              size="sm"
              variant="destructive"
              onClick={handleRetryAll}
              disabled={isRetryingAll || events.length === 0}
              className="h-8 gap-1.5 text-xs font-semibold"
            >
              {isRetryingAll ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <RotateCcw className="size-3" />
              )}
              Retry All DLQ
            </Button>
          )}
        </CardHeader>

        <CardContent className="p-0">
          {events.length === 0 ? (
            <div className="py-16 text-center text-xs text-muted-foreground space-y-2">
              <p>No webhook events match your current filter criteria.</p>
              {(currentStatus !== "all" || currentSearch) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    updateQuery({ status: "all", search: null, page: "1" })
                  }
                  className="text-xs"
                >
                  Reset filters
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border/40 bg-muted/20 text-muted-foreground font-semibold">
                    <th className="py-3 px-4">Event Type</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Location ID</th>
                    <th className="py-3 px-4">Attempts</th>
                    <th className="py-3 px-4">Time</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {events.map((event) => (
                    <tr
                      key={event.id}
                      className="hover:bg-muted/40 transition-colors group"
                    >
                      <td className="py-3 px-4 font-semibold text-foreground">
                        <div className="flex items-center gap-2">
                          <span className="truncate max-w-45">
                            {event.event_type}
                          </span>
                          {event.error_message && (
                            <span
                              className="size-1.5 rounded-full bg-destructive shrink-0"
                              title={event.error_message}
                            />
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        {getStatusBadge(event.status)}
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px] text-muted-foreground">
                        <span className="truncate inline-block max-w-35">
                          {event.location_id}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px] whitespace-nowrap">
                        <span
                          className={
                            event.attempts >= event.max_attempts
                              ? "text-destructive font-bold"
                              : "text-muted-foreground"
                          }
                        >
                          {event.attempts} / {event.max_attempts}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-[11px] text-muted-foreground whitespace-nowrap">
                        {event.created_at
                          ? new Date(event.created_at).toLocaleString()
                          : "-"}
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap space-x-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDetail(event)}
                          className="h-7 px-2 text-[11px] font-medium gap-1 text-muted-foreground hover:text-foreground"
                        >
                          <Eye className="size-3" />
                          <span>Inspect</span>
                        </Button>

                        {(event.status === "dlq" ||
                          event.status === "failed") && (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={retryingId === event.id}
                            onClick={() => handleRetrySingle(event.id)}
                            className="h-7 px-2 text-[11px] font-semibold gap-1 text-primary hover:bg-primary hover:text-primary-foreground"
                          >
                            {retryingId === event.id ? (
                              <Loader2 className="size-3 animate-spin" />
                            ) : (
                              <RotateCcw className="size-3" />
                            )}
                            <span>Replay</span>
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border/40 text-xs text-muted-foreground bg-muted/10">
            <div>
              Page{" "}
              <span className="font-semibold text-foreground">
                {currentPage}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-foreground">
                {totalPages}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => updateQuery({ page: String(currentPage - 1) })}
                className="h-7 px-2 text-xs gap-1"
              >
                <ChevronLeft className="size-3.5" />
                <span>Prev</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => updateQuery({ page: String(currentPage + 1) })}
                className="h-7 px-2 text-xs gap-1"
              >
                <span>Next</span>
                <ChevronRight className="size-3.5" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Modal / Slide-Over: Event Inspector */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="fixed inset-0"
            onClick={() => setSelectedEvent(null)}
          />

          <div className="relative z-10 w-full max-w-3xl max-h-[85vh] flex flex-col rounded-2xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200 space-y-4">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-border/60">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-foreground">
                    {selectedEvent.event_type}
                  </h3>
                  {getStatusBadge(selectedEvent.status)}
                </div>
                <p className="text-xs font-mono text-muted-foreground">
                  ID: {selectedEvent.id}
                </p>
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="size-8 rounded-lg"
                onClick={() => setSelectedEvent(null)}
              >
                <X className="size-4" />
              </Button>
            </div>

            {/* Error banner if failed */}
            {selectedEvent.error_message && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-destructive flex items-start gap-2">
                <AlertTriangle className="size-4 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold">Dispatch Error:</span>
                  <p className="font-mono">{selectedEvent.error_message}</p>
                </div>
              </div>
            )}

            {/* Details Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-muted/30 p-3 rounded-xl border border-border/40">
              <div>
                <span className="text-muted-foreground block text-[10px] uppercase font-bold">
                  Location ID
                </span>
                <span className="font-mono text-foreground truncate block">
                  {selectedEvent.location_id}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px] uppercase font-bold">
                  Attempts
                </span>
                <span className="font-mono text-foreground">
                  {selectedEvent.attempts} of {selectedEvent.max_attempts}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px] uppercase font-bold">
                  Created At
                </span>
                <span className="text-foreground">
                  {selectedEvent.created_at
                    ? new Date(selectedEvent.created_at).toLocaleTimeString()
                    : "-"}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px] uppercase font-bold">
                  Processed At
                </span>
                <span className="text-foreground">
                  {selectedEvent.processed_at
                    ? new Date(selectedEvent.processed_at).toLocaleTimeString()
                    : "Pending"}
                </span>
              </div>
            </div>

            {/* Payload JSON Inspector */}
            <div className="flex-1 flex flex-col min-h-0 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Payload JSON
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyJson}
                  className="h-7 px-2.5 text-xs gap-1"
                >
                  {copied ? (
                    <Check className="size-3 text-emerald-500" />
                  ) : (
                    <Copy className="size-3" />
                  )}
                  <span>{copied ? "Copied" : "Copy JSON"}</span>
                </Button>
              </div>

              <div className="flex-1 overflow-auto rounded-xl bg-muted/60 p-3 font-mono text-[11px] border border-border/50 max-h-60">
                {loadingDetail ? (
                  <div className="flex items-center justify-center py-8 text-muted-foreground gap-2">
                    <Loader2 className="size-4 animate-spin" />
                    <span>Loading payload data...</span>
                  </div>
                ) : selectedEvent.payload ? (
                  <pre className="whitespace-pre-wrap wrap-break-word text-foreground">
                    {JSON.stringify(selectedEvent.payload, null, 2)}
                  </pre>
                ) : (
                  <span className="text-muted-foreground">
                    No payload stored.
                  </span>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-border/40">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedEvent(null)}
                className="text-xs"
              >
                Close
              </Button>

              {(selectedEvent.status === "dlq" ||
                selectedEvent.status === "failed") && (
                <Button
                  size="sm"
                  disabled={retryingId === selectedEvent.id}
                  onClick={() => handleRetrySingle(selectedEvent.id)}
                  className="gap-1.5 text-xs font-semibold"
                >
                  {retryingId === selectedEvent.id ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <RotateCcw className="size-3.5" />
                  )}
                  Replay Event Now
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
