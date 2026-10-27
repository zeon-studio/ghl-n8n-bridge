"use client";

import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Activity,
  Building2,
  Cable,
  KeyRound,
  Layers,
  LayoutDashboard,
  LogOut,
  Menu,
  Send,
  ServerCog,
  Shield,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const NAV_ITEMS = [
  { name: "Overview", href: "/admin/overview", icon: LayoutDashboard },
  { name: "Webhooks & DLQ", href: "/admin/webhooks", icon: Activity },
  { name: "Tenants & Locations", href: "/admin/tenants", icon: Building2 },
  { name: "Bridge Keys", href: "/admin/keys", icon: KeyRound },
  { name: "Subscriptions", href: "/admin/subscriptions", icon: Send },
  { name: "System & Storage", href: "/admin/system", icon: ServerCog },
];

export function AdminHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const currentItem = NAV_ITEMS.find(
    (item) =>
      pathname === item.href ||
      (item.href !== "/admin/overview" && pathname.startsWith(item.href)),
  ) || { name: "Dashboard" };

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
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/60 bg-background/80 px-4 sm:px-8 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          {/* Mobile hamburger */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden size-9 rounded-xl"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation menu"
          >
            <Menu className="size-5" />
          </Button>

          {/* Breadcrumb / Title */}
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium text-muted-foreground hidden sm:inline">
              Admin
            </span>
            <span className="text-muted-foreground/50 hidden sm:inline">/</span>
            <h1 className="font-semibold text-foreground tracking-tight">
              {currentItem.name}
            </h1>
          </div>
        </div>

        {/* Right side controls - only lightmode toggle with top/bottom padding */}
        <div className="flex items-center py-2 sm:py-3">
          <ModeToggle />
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative flex flex-col w-72 max-w-[80vw] bg-card p-5 h-full z-10 border-r border-border shadow-2xl justify-between animate-in slide-in-from-left duration-200">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-border/60">
                <div className="flex items-center gap-2 font-bold">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Cable className="size-4" />
                  </div>
                  <span className="text-sm">Admin Console</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  onClick={() => setMobileOpen(false)}
                >
                  <X className="size-4" />
                </Button>
              </div>

              <nav className="space-y-1">
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
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground font-semibold"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
                      )}
                    >
                      <Icon className="size-4 shrink-0" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>

              <div className="pt-3 border-t border-border/40 space-y-1 text-xs">
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 px-3 py-2 text-muted-foreground hover:text-foreground"
                >
                  <Layers className="size-4" />
                  <span>Tenant Dashboard</span>
                </Link>
                <Link
                  href="/"
                  className="flex items-center gap-2 px-3 py-2 text-muted-foreground hover:text-foreground"
                >
                  <Cable className="size-4" />
                  <span>Landing Page</span>
                </Link>
              </div>
            </div>

            <div className="pt-4 border-t border-border/60 space-y-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground px-2">
                <Shield className="size-4 text-emerald-500" />
                <span>Admin Authenticated</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="w-full justify-start text-xs text-muted-foreground hover:text-destructive gap-2 h-9 rounded-xl"
              >
                <LogOut className="size-4" />
                <span>Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
