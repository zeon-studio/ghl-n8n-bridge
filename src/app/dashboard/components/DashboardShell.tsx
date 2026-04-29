import { ModeToggle } from "@/components/mode-toggle";
import { Badge } from "@/components/ui/badge";
import { getLocationDisplayName } from "@/lib/supabase/queries";
import { Mail } from "lucide-react";
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
        <header className="sticky top-3 z-40 rounded-xl border bg-background/95 px-3 py-3 backdrop-blur supports-backdrop-filter:bg-background/60 sm:px-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Badge className="w-fit">Dashboard</Badge>
              {locationName ? (
                <Badge variant="outline">{locationName}</Badge>
              ) : null}
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                href="/support"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <Mail className="size-4" />
                <span className="hidden sm:inline">Support</span>
              </Link>
              <ModeToggle />
            </div>
          </div>
        </header>

        <div className="space-y-2">
          <h1 className="font-heading text-3xl tracking-tight sm:text-5xl">
            {title}
          </h1>
          <p className="text-muted-foreground">{description}</p>
        </div>

        {children}

        <footer className="mt-2 flex items-center justify-center gap-6 border-t pt-6 text-sm text-muted-foreground">
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
