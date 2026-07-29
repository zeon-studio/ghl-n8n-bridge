"use client";

import { ModeToggle } from "@/components/mode-toggle";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Cable, Mail, PlayCircle, ShieldCheck, X, Zap } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";

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
    desc: "We refresh OAuth tokens securely in the background, so expiring credentials stay out of your workflows.",
  },
  {
    n: 3,
    icon: Zap,
    title: "AI Agent Ready",
    desc: "Empower your AI agents to interact with GoHighLevel natively through standard n8n workflows.",
  },
];

export default function Home() {
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const bannerVideoRef = useRef<HTMLVideoElement>(null);

  function openBannerVideo() {
    setIsVideoOpen(true);
  }

  function closeBannerVideo() {
    setIsVideoOpen(false);
    if (bannerVideoRef.current) {
      bannerVideoRef.current.pause();
    }
  }

  return (
    <>
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
              automate workflows and integrate AI agents—without managing
              complex API tokens.
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

          {/* ── Hero video ── */}
          <div className="mx-auto w-full max-w-2xl pt-3">
            <button
              onClick={openBannerVideo}
              className="relative cursor-pointer w-full overflow-hidden rounded-2xl border border-primary/20 shadow-2xl ring-1 ring-primary/10 group/thumb focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label="Play product walkthrough"
            >
              <video
                src="/demo-video.mov#t=0.5"
                preload="metadata"
                muted
                playsInline
                className="aspect-video w-full object-cover pointer-events-none"
              />
              <div className="absolute inset-0 bg-black/35 group-hover/thumb:bg-black/20 transition-colors duration-200 flex items-center justify-center">
                <div className="flex items-center gap-2 rounded-full bg-white/20 px-5 py-3 text-white backdrop-blur-sm shadow-xl group-hover/thumb:scale-105 transition-transform duration-200">
                  <PlayCircle className="size-6" />
                  <span className="text-sm font-semibold tracking-wide">
                    Watch 2-min Demo
                  </span>
                </div>
              </div>
            </button>
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

      {isVideoOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm"
          onClick={closeBannerVideo}
          role="dialog"
          aria-modal="true"
          aria-label="Product walkthrough video"
        >
          <div
            className="relative mx-4 w-full max-w-5xl animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeBannerVideo}
              className="absolute -top-10 right-0 flex items-center gap-1 text-sm font-medium text-white/80 transition-colors hover:text-white"
              aria-label="Close video"
            >
              <X className="size-5" />
              Close
            </button>
            <div className="aspect-video overflow-hidden rounded-2xl bg-black shadow-2xl ring-1 ring-white/10">
              <video
                ref={bannerVideoRef}
                src="/demo-video.mov"
                controls
                autoPlay
                playsInline
                className="h-full w-full"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
