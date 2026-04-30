"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface CredentialBoxProps {
  value: string;
  label: string;
  variant?: "primary" | "indigo";
}

export function CredentialBox({ value, label, variant = "primary" }: CredentialBoxProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isIndigo = variant === "indigo";

  return (
    <div 
      onClick={handleCopy}
      className={cn(
        "group relative flex items-center justify-between rounded-2xl border-2 border-muted bg-background/50 p-2 pl-4 transition-all hover:bg-muted/30 cursor-pointer",
        isIndigo ? "hover:border-indigo-500/50" : "hover:border-primary/50"
      )}
      title={`Click to copy ${label}`}
    >
      <code className="font-mono text-sm font-bold tracking-widest text-muted-foreground group-hover:text-foreground transition-colors py-2">
        ••••••••••••••••
      </code>
      <div className={cn(
        "size-10 flex items-center justify-center rounded-xl bg-muted transition-all",
        copied 
          ? "bg-emerald-500 text-white" 
          : isIndigo 
            ? "group-hover:bg-indigo-500 group-hover:text-white" 
            : "group-hover:bg-primary group-hover:text-primary-foreground"
      )}>
        {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
      </div>
    </div>
  );
}
