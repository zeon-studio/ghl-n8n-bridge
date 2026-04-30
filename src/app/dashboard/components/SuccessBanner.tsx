"use client";

import { CheckCircle2, X } from "lucide-react";
import { useState } from "react";

interface SuccessBannerProps {
  isNewInstall: boolean;
}

export function SuccessBanner({ isNewInstall }: SuccessBannerProps) {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="group relative flex items-center justify-between gap-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 backdrop-blur-sm animate-in fade-in slide-in-from-top-2 duration-700">
      <div className="flex items-center gap-4">
        <div className="flex size-10 items-center justify-center rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/20">
          <CheckCircle2 className="size-6 text-white" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-foreground tracking-tight">
            {isNewInstall ? "Connection Successful!" : "Bridge is Active"}
          </h2>
          <p className="text-xs text-muted-foreground font-medium">
            {isNewInstall
              ? "Your account is linked. Follow the guide below to start."
              : "Your GHL account is securely connected to the n8n bridge."}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
          <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
          System Online
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="size-8 cursor-pointer flex items-center justify-center rounded-full hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 transition-colors"
          aria-label="Dismiss"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
