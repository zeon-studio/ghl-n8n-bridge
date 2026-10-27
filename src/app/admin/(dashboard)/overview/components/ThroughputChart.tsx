"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TimeSeriesPoint } from "@/lib/admin/queries";
import { useState } from "react";

export function ThroughputChart({
  initialData,
  timeframe: initialTimeframe,
}: {
  initialData: TimeSeriesPoint[];
  timeframe?: "24h" | "7d" | "30d";
}) {
  const [hoveredPoint, setHoveredPoint] = useState<TimeSeriesPoint | null>(
    null,
  );
  const data = initialData || [];

  const maxTotal = Math.max(...data.map((d) => d.total), 10);
  const totalVolume = data.reduce((sum, d) => sum + d.total, 0);
  const totalCompleted = data.reduce((sum, d) => sum + d.completed, 0);
  const totalFailed = data.reduce((sum, d) => sum + d.failed + d.dlq, 0);

  return (
    <Card className="p-5 border-border/60 bg-card/60 backdrop-blur-sm">
      <CardHeader className="p-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg font-bold">
              Webhook Throughput
            </CardTitle>
            <Badge
              variant="outline"
              className="text-[10px] font-mono uppercase"
            >
              {data.length} intervals
            </Badge>
          </div>
          <CardDescription className="text-xs mt-0.5">
            Ingestion and push distribution to n8n workflow nodes
          </CardDescription>
        </div>

        {/* Legend / Metrics */}
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-primary" />
            <span className="text-muted-foreground">Completed:</span>
            <span className="font-semibold">
              {totalCompleted.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-destructive" />
            <span className="text-muted-foreground">Failed/DLQ:</span>
            <span className="font-semibold">
              {totalFailed.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center gap-1.5 border-l border-border/60 pl-3">
            <span className="text-muted-foreground">Total:</span>
            <span className="font-bold">{totalVolume.toLocaleString()}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 pt-2 space-y-4">
        {data.length === 0 ? (
          <div className="flex h-56 items-center justify-center rounded-xl border border-dashed border-border/60 text-xs text-muted-foreground">
            No webhook traffic recorded in this timeframe.
          </div>
        ) : (
          <div className="space-y-3">
            {/* Chart SVG View */}
            <div className="relative h-56 w-full flex items-end gap-1 sm:gap-2 pt-6 px-1 border-b border-border/40">
              {data.map((point, index) => {
                const heightPercent = Math.max(
                  6,
                  Math.min(100, (point.total / maxTotal) * 100),
                );
                const completedPercent =
                  point.total > 0 ? (point.completed / point.total) * 100 : 0;
                const failedPercent = 100 - completedPercent;

                const isHovered = hoveredPoint?.bucket === point.bucket;

                return (
                  <div
                    key={index}
                    className="relative flex-1 flex flex-col justify-end h-full group cursor-pointer"
                    onMouseEnter={() => setHoveredPoint(point)}
                    onMouseLeave={() => setHoveredPoint(null)}
                  >
                    {/* Tooltip */}
                    {isHovered && (
                      <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-20 pointer-events-none rounded-lg bg-popover px-2.5 py-1.5 shadow-lg border border-border text-[11px] whitespace-nowrap animate-in fade-in zoom-in-95">
                        <div className="font-bold">{point.bucket}</div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <span className="text-primary font-semibold">
                            ✓ {point.completed}
                          </span>
                          {(point.failed > 0 || point.dlq > 0) && (
                            <span className="text-destructive font-semibold">
                              ✗ {point.failed + point.dlq}
                            </span>
                          )}
                          <span>Total: {point.total}</span>
                        </div>
                      </div>
                    )}

                    {/* Bar Stack */}
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full rounded-t-md overflow-hidden flex flex-col justify-end transition-all duration-200 ${
                        isHovered
                          ? "ring-2 ring-primary ring-offset-1 brightness-110"
                          : ""
                      }`}
                    >
                      {/* Failed section (top of bar) */}
                      {failedPercent > 0 && (
                        <div
                          style={{ height: `${failedPercent}%` }}
                          className="w-full bg-destructive/80 transition-colors"
                        />
                      )}
                      {/* Completed section */}
                      <div
                        style={{ height: `${completedPercent}%` }}
                        className="w-full bg-primary/80 group-hover:bg-primary transition-colors"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* X-axis labels */}
            <div className="flex items-center justify-between text-[10px] text-muted-foreground px-1 font-mono">
              <span>{data[0]?.bucket}</span>
              {data.length > 2 && (
                <span>{data[Math.floor(data.length / 2)]?.bucket}</span>
              )}
              <span>{data[data.length - 1]?.bucket}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
