import { ModeToggle } from "@/components/mode-toggle";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Cable, Mail, ShieldCheck, Zap } from "lucide-react";
import Link from "next/link";

const marketplaceHref =
  process.env.NEXT_PUBLIC_GHL_MARKETPLACE_INSTALL_URL ||
  (process.env.GHL_MARKETPLACE_APP_ID
    ? `https://marketplace.gohighlevel.com/integration/${process.env.GHL_MARKETPLACE_APP_ID}`
    : "https://marketplace.gohighlevel.com/");

const FEATURES = [
  {
    n: 1,
    icon: Cable,
    title: "Fast Connection",
    desc: "One install flow, one bridge key, and your workflows are ready.",
  },
  {
    n: 2,
    icon: ShieldCheck,
    title: "Secure by Default",
    desc: "Requests are signed and validated before your automations run.",
  },
  {
    n: 3,
    icon: Zap,
    title: "Production Ready",
    desc: "Built for webhook scale with retry, dispatch, and clean key management.",
  },
];

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-12 sm:px-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-linear-to-b from-primary/5 to-transparent" />

      <div className="relative mx-auto flex w-full max-w-2xl flex-col items-center gap-8 text-center">
        {/* ── Top bar ── */}
        <header className="flex w-full items-center justify-between">
          <Badge
            variant="secondary"
            className="gap-2 px-3 py-1 text-sm font-medium"
          >
            GoHighLevel Marketplace App
          </Badge>
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
        </header>

        {/* ── Hero ── */}
        <div className="space-y-4">
          <h1 className="font-heading text-4xl font-extrabold tracking-tight sm:text-5xl">
            Connect GHL to n8n <span className="text-primary">in seconds</span>
          </h1>
          <p className="mx-auto max-w-lg text-lg text-muted-foreground">
            Install from the GoHighLevel Marketplace, grab your bridge key, and
            route events into n8n without brittle custom middleware.
          </p>
        </div>

        {/* ── CTAs ── */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          <a
            href={marketplaceHref}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({
              size: "lg",
              className: "px-8 font-semibold",
            })}
          >
            Open GHL Marketplace
          </a>
          <Link
            href="/dashboard"
            className={buttonVariants({
              variant: "outline",
              size: "lg",
              className: "px-8 font-semibold",
            })}
          >
            Open Dashboard
          </Link>
        </div>

        {/* ── Feature cards ── */}
        <div className="grid w-full gap-4 sm:grid-cols-3">
          {FEATURES.map(({ n, icon: Icon, title, desc }) => (
            <Card
              key={n}
              className="text-left hover:border-primary/50 transition-colors"
            >
              <CardHeader className="p-5">
                <div className="mb-2 flex items-center gap-3">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon className="size-4" />
                  </div>
                  <CardTitle className="text-base font-semibold">
                    {title}
                  </CardTitle>
                </div>
                <CardDescription className="text-sm">{desc}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>

        {/* ── Footer ── */}
        <footer className="mt-8 flex w-full items-center justify-center gap-6 border-t pt-6 text-sm text-muted-foreground">
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
    </main>
  );
}
