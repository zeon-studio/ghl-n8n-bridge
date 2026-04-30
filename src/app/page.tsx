import { ModeToggle } from "@/components/mode-toggle";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Cable, Mail, ShieldCheck, Zap } from "lucide-react";
import Link from "next/link";

const FEATURES = [
  {
    n: 1,
    icon: Cable,
    title: "One-Click Setup",
    desc: "Connect instantly via OAuth. Generate a single bridge key and your n8n workflows are ready to go.",
  },
  {
    n: 2,
    icon: ShieldCheck,
    title: "Token Broker Architecture",
    desc: "We handle OAuth token refreshes securely in the background so your automations never break.",
  },
  {
    n: 3,
    icon: Zap,
    title: "AI Agent Ready",
    desc: "Empower your AI agents to interact with GoHighLevel natively through standard n8n workflows.",
  },
];

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-12 sm:px-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-linear-to-b from-primary/5 to-transparent" />

      <div className="relative mx-auto flex w-full max-w-5xl flex-col items-center gap-8 text-center">
        {/* ── Top bar ── */}
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
        <div className="space-y-4 pt-20">
          <h1 className="font-heading text-4xl font-extrabold tracking-tight sm:text-5xl">
            The Missing Link Between <br className="hidden sm:block" />
            <span className="text-primary">GoHighLevel & n8n</span>
          </h1>
          <p className="mx-auto max-w-lg text-lg text-muted-foreground">
            Connect sub-accounts in one click. Use our custom n8n nodes to
            automate workflows and integrate AI agents—without managing complex
            API tokens.
          </p>
        </div>

        {/* ── CTAs ── */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          <a
            href="/api/auth/ghl"
            className={buttonVariants({
              size: "lg",
              className: "px-8 font-semibold",
            })}
          >
            Connect GoHighLevel
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
