import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EventTypeStat } from "@/lib/admin/queries";
import { ArrowUpRight, Zap } from "lucide-react";
import Link from "next/link";

const PALETTE = [
  "bg-primary",
  "bg-indigo-500",
  "bg-purple-500",
  "bg-blue-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
];

export function EventTypeDistribution({ stats }: { stats: EventTypeStat[] }) {
  return (
    <Card className="p-5 border-border/60 bg-card/60 backdrop-blur-sm">
      <CardHeader className="p-0 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Zap className="size-4" />
            </div>
            <CardTitle className="text-base font-bold">
              Top Event Types
            </CardTitle>
          </div>
          <Link
            href="/admin/webhooks"
            className="text-xs text-primary hover:underline inline-flex items-center gap-0.5 font-medium"
          >
            <span>All Logs</span>
            <ArrowUpRight className="size-3" />
          </Link>
        </div>
        <CardDescription className="text-xs">
          Frequency of incoming GoHighLevel events
        </CardDescription>
      </CardHeader>

      <CardContent className="p-0 pt-2 space-y-3.5">
        {stats.length === 0 ? (
          <p className="text-xs text-muted-foreground py-6 text-center">
            No events registered yet.
          </p>
        ) : (
          stats.map((item, index) => {
            const barColor = PALETTE[index % PALETTE.length];
            return (
              <div key={item.eventType} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <Link
                    href={`/admin/webhooks?eventType=${encodeURIComponent(item.eventType)}`}
                    className="font-medium hover:text-primary transition-colors truncate max-w-50"
                  >
                    {item.eventType}
                  </Link>
                  <div className="flex items-center gap-2 text-muted-foreground font-mono">
                    <span className="font-semibold text-foreground">
                      {item.count.toLocaleString()}
                    </span>
                    <span className="text-[10px]">({item.percentage}%)</span>
                  </div>
                </div>

                <div className="h-2 w-full rounded-full bg-muted/60 overflow-hidden">
                  <div
                    style={{ width: `${item.percentage}%` }}
                    className={`h-full rounded-full ${barColor} transition-all duration-500`}
                  />
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
