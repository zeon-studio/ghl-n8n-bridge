"use client";

import { Button } from "@/components/ui/button";
import { Check, Copy } from "lucide-react";
import { useState } from "react";

export function CopyValueButton({
  value,
  label = "Copy",
  className,
  iconOnly = false,
}: {
  value: string;
  label?: string;
  className?: string;
  iconOnly?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  };

  return (
    <Button
      type="button"
      variant={iconOnly ? "ghost" : "outline"}
      size={iconOnly ? "icon" : "xs"}
      onClick={onCopy}
      className={className}
      aria-label={`${label} value`}
      title={iconOnly ? label : undefined}
    >
      {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
      {!iconOnly && (copied ? "Copied" : label)}
    </Button>
  );
}
