"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  CheckCircle2,
  Download,
  MousePointer2,
  PlayCircle,
  Settings2,
  Terminal,
  X,
} from "lucide-react";
import { useRef, useState } from "react";

export function SetupGuide() {
  const [isOpen, setIsOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  function openModal() {
    setIsOpen(true);
  }

  function closeModal() {
    setIsOpen(false);
    if (videoRef.current) {
      videoRef.current.pause();
    }
  }

  const steps = [
    {
      title: "Copy the Workflow Template",
      description:
        "Click the 'Copy JSON' button on the template above. This contains all the pre-configured nodes for your GHL integration.",
      icon: <Download className="size-5 text-indigo-500" />,
    },
    {
      title: "Paste into n8n Workspace",
      description:
        "Open your n8n workflow editor and simply paste (Ctrl/Cmd + V) the copied JSON anywhere on the canvas.",
      icon: <MousePointer2 className="size-5 text-blue-500" />,
    },
    {
      title: "Install Missing Nodes",
      description:
        "If you see a 'Missing Node' error, double-click on it and click 'Install' to automatically add the GHL Bridge plugin to your n8n instance.",
      icon: <Terminal className="size-5 text-emerald-500" />,
    },
    {
      title: "Configure Credentials",
      description:
        "Double-click the GHL Bridge node, select 'Create New Credential', and paste your Bridge Key and Location ID from this dashboard.",
      icon: <Settings2 className="size-5 text-amber-500" />,
    },
  ];

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3 border-none bg-linear-to-br from-background via-muted/20 to-background shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <CheckCircle2 className="size-6 text-primary" />
              Quick Setup Guide
            </CardTitle>
            <CardDescription>
              Follow these simple steps to get your automation running in
              minutes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="relative space-y-8 before:absolute before:inset-0 before:left-4 before:h-full before:w-0.5 before:bg-linear-to-b before:from-primary/50 before:via-muted before:to-transparent">
              {steps.map((step, index) => (
                <div
                  key={index}
                  className="relative flex items-start gap-6 group"
                >
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-background border-2 border-muted group-hover:border-primary transition-colors z-10 shadow-sm">
                    {step.icon}
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-semibold text-foreground tracking-tight">
                      {index + 1}. {step.title}
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 overflow-hidden border-none bg-indigo-600/5 dark:bg-indigo-400/5 flex flex-col relative group min-h-100 shadow-lg">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent opacity-50" />
          <CardHeader className="relative z-10 pb-2">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <PlayCircle className="size-5 text-indigo-500" />
              Video Tutorial
            </CardTitle>
            <CardDescription>
              Watch our 2-minute masterclass to get started.
            </CardDescription>
          </CardHeader>
          <CardContent className="relative z-10 flex-1 p-4 pt-0 flex flex-col items-center justify-center text-center">
            {/* Clickable video thumbnail */}
            <button
              onClick={openModal}
              className="relative w-full overflow-hidden rounded-2xl border-2 border-white/20 dark:border-zinc-800/50 shadow-2xl group/thumb cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              aria-label="Play tutorial video"
            >
              <video
                src="/demo-video.mov#t=0.5"
                preload="metadata"
                className="w-full object-cover aspect-video pointer-events-none"
                muted
                playsInline
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover/thumb:bg-black/25 transition-colors duration-200">
                <div className="size-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-xl group-hover/thumb:scale-110 transition-transform duration-200">
                  <PlayCircle className="size-9 text-white drop-shadow-lg" />
                </div>
              </div>
            </button>

            <p className="mt-3 text-xs text-muted-foreground font-medium">
              Click to watch the 2-minute walkthrough
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Lightbox modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm"
          onClick={closeModal}
          role="dialog"
          aria-modal="true"
          aria-label="Video tutorial"
        >
          <div
            className="relative w-full max-w-4xl mx-4 animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeModal}
              className="absolute -top-10 right-0 flex items-center gap-1 text-white/80 hover:text-white transition-colors text-sm font-medium"
              aria-label="Close video"
            >
              <X className="size-5" />
              Close
            </button>
            <div className="aspect-video rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10">
              <video
                ref={videoRef}
                src="/demo-video.mov"
                controls
                autoPlay
                playsInline
                className="w-full h-full bg-black"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
