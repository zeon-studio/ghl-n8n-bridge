"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Activity,
  Building2,
  Cable,
  ExternalLink,
  KeyRound,
  Layers,
  LayoutDashboard,
  LogOut,
  Send,
  ServerCog,
  Shield,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const NAV_ITEMS = [
  {
    name: "Overview",
    href: "/admin/overview",
    icon: LayoutDashboard,
    badge: null,
  },
  {
    name: "Webhooks & DLQ",
    href: "/admin/webhooks",
    icon: Activity,
    badge: null,
  },
  {
    name: "Tenants & Locations",
    href: "/admin/tenants",
    icon: Building2,
    badge: null,
  },
  {
    name: "Bridge Keys",
    href: "/admin/keys",
    icon: KeyRound,
    badge: null,
  },
  {
    name: "Subscriptions",
    href: "/admin/subscriptions",
    icon: Send,
    badge: null,
  },
  {
    name: "System & Storage",
    href: "/admin/system",
    icon: ServerCog,
    badge: null,
  },
];

export function AdminSidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    try {
      await fetch("/api/admin/auth/logout", { method: "POST" });
      router.push("/admin/login");
      router.refresh();
    } catch (e) {
      console.error("Logout failed", e);
    }
  }

  return (
    <aside
      className={cn(
        "flex flex-col h-full bg-card/60 backdrop-blur-xl border-r border-border/60 w-64 shrink-0 p-4 justify-between",
        className,
      )}
    >
      <div className="space-y-6">
        {/* Brand */}
        <div className="px-2">
          <Link
            href="/admin/overview"
            className="flex items-center gap-2.5 font-bold tracking-tight hover:opacity-90 transition-opacity"
          >
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
              <Cable className="size-5" />
            </div>
            <div>
              <div className="text-base font-bold leading-tight flex items-center gap-1.5">
                <span>GHL Bridge</span>
                <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-primary text-primary-foreground">
                  Admin
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground font-medium">
                Control Center
              </p>
            </div>
          </Link>
        </div>

        {/* Navigation list */}
        <nav className="space-y-1">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">
            Insights & Operations
          </div>
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/admin/overview" &&
                pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20 font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={cn(
                      "size-4 shrink-0 transition-transform group-hover:scale-110",
                      isActive
                        ? "text-primary-foreground"
                        : "text-muted-foreground group-hover:text-foreground",
                    )}
                  />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <Badge
                    variant={isActive ? "secondary" : "outline"}
                    className="text-[10px] px-1.5 py-0 h-4"
                  >
                    {item.badge}
                  </Badge>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Quick Links */}
        <div className="pt-2 border-t border-border/40 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">
            Navigation
          </div>
          <Link
            href="/dashboard"
            className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Layers className="size-3.5" />
              <span>Location Dashboard</span>
            </div>
            <ExternalLink className="size-3 opacity-60" />
          </Link>
          <Link
            href="/"
            className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Cable className="size-3.5" />
              <span>Landing Page</span>
            </div>
            <ExternalLink className="size-3 opacity-60" />
          </Link>
        </div>
      </div>

      {/* Bottom user / session / logout */}
      <div className="pt-4 border-t border-border/40 space-y-3">
        <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl bg-muted/40">
          <div className="size-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
            <Shield className="size-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold leading-tight truncate">
              Master Admin
            </p>
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Session Active</span>
            </div>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          className="w-full justify-start text-xs text-muted-foreground hover:text-destructive hover:border-destructive/30 gap-2 cursor-pointer h-9 rounded-xl"
        >
          <LogOut className="size-3.5" />
          <span>Sign Out</span>
        </Button>
      </div>
    </aside>
  );
}
