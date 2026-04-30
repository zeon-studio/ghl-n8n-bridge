import { ModeToggle } from "@/components/mode-toggle";
import { Badge } from "@/components/ui/badge";
import { getLocationDisplayName } from "@/lib/supabase/queries";
import { Cable, Mail } from "lucide-react";
import Link from "next/link";
import { ReactNode } from "react";

export async function DashboardShell({
  title,
  description,
  locationId,
  children,
}: {
  title: string;
  description: string;
  locationId?: string;
  children: ReactNode;
}) {
  const locationName = locationId
    ? ((await getLocationDisplayName(locationId)) ?? "Location")
    : null;

  return (
    <div className="min-h-screen px-4 py-8 sm:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <header className="flex w-full items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 font-bold tracking-tight hover:opacity-80 transition-opacity"
          >
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Cable className="size-5" />
            </div>
            <span className="text-lg">n8n GHL Bridge</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            {locationName && (
              <Badge
                variant="outline"
                className="hidden sm:flex gap-1.5 px-3 py-1 bg-muted/50 font-mono text-[10px] uppercase tracking-wider"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                {locationName}
              </Badge>
            )}
            <Link
              href="/support"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <Mail className="size-4" />
              <span className="hidden sm:inline">Support</span>
            </Link>
            <ModeToggle />
          </div>
        </header>

        <div className="space-y-2 mt-4 sm:mt-8">
          <h1 className="font-heading text-3xl tracking-tight sm:text-5xl">
            {title}
          </h1>
          <p className="text-muted-foreground">{description}</p>
        </div>

        {children}

        <footer className="mt-8 flex items-center justify-center gap-6 border-t pt-6 text-sm text-muted-foreground">
          <Link
            href="/privacy"
            className="transition-colors hover:text-foreground"
          >
            Privacy Policy
          </Link>
          <Link
            href="/terms"
            className="transition-colors hover:text-foreground"
          >
            Terms of Service
          </Link>
          <Link
            href="/support"
            className="transition-colors hover:text-foreground"
          >
            Support
          </Link>
        </footer>
      </div>
    </div>
  );
}
