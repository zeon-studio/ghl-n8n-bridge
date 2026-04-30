"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle2, Copy } from "lucide-react";
import { useState } from "react";

const BASIC_WORKFLOW = {
  meta: {
    templateCredsSetupCompleted: true,
  },
  nodes: [
    {
      parameters: {},
      id: "e1f1b2a3-c4d5-e6f7-a8b9-c0d1e2f3a4b5",
      name: 'When clicking "Execute Workflow"',
      type: "n8n-nodes-base.manualTrigger",
      typeVersion: 1,
      position: [380, 240],
    },
    {
      parameters: {
        resource: "contact",
        operation: "getAll",
        limit: 50,
      },
      id: "f2g3h4i5-j6k7-l8m9-n0o1-p2q3r4s5t6u7",
      name: "GHL Bridge",
      type: "n8n-nodes-ghl-bridge.ghlBridge",
      typeVersion: 1,
      position: [600, 240],
      credentials: {
        ghlBridgeApi: {
          id: "",
          name: "GHL Bridge API account",
        },
      },
    },
  ],
  connections: {
    'When clicking "Execute Workflow"': {
      main: [
        [
          {
            node: "GHL Bridge",
            type: "main",
            index: 0,
          },
        ],
      ],
    },
  },
};

export function WorkflowTemplates() {
  const [copied, setCopied] = useState(false);

  const copyTemplate = () => {
    navigator.clipboard.writeText(JSON.stringify(BASIC_WORKFLOW, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="relative overflow-hidden border-none bg-linear-to-br from-background via-muted/30 to-background shadow-xl">
      <div className="absolute top-0 left-0 w-full h-[2px] bg-linear-to-r from-primary via-indigo-500 to-primary opacity-90 shadow-[0_1px_10px_rgba(var(--primary),0.3)]" />
      <CardHeader>
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          <CheckCircle2 className="size-5 text-emerald-500" />
          1-Click n8n Templates
        </CardTitle>
        <CardDescription className="text-sm font-medium">
          Instantly start building by copying these pre-configured workflows.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="group relative flex flex-col sm:flex-row sm:items-center justify-between gap-6 p-6 rounded-2xl border-2 border-muted bg-background/40 hover:border-primary/20 transition-all duration-300">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="size-2 rounded-full bg-emerald-500" />
              <h4 className="font-bold text-base tracking-tight">
                Fetch Contacts (Basic)
              </h4>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
              A robust workflow that pulls up to 50 contacts from your GHL
              account. Perfect for testing your first integration.
            </p>
          </div>
          <Button
            onClick={copyTemplate}
            variant={copied ? "default" : "secondary"}
            size="lg"
            className="shrink-0 w-full sm:w-40 rounded-xl font-bold shadow-lg shadow-primary/5 transition-all active:scale-95"
          >
            {copied ? (
              <>
                <CheckCircle2 className="mr-2 size-5 text-emerald-400" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="mr-2 size-5" />
                Copy JSON
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
