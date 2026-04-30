"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, CheckCircle2 } from "lucide-react";
import { useState } from "react";

const BASIC_WORKFLOW = {
  "meta": {
    "templateCredsSetupCompleted": true
  },
  "nodes": [
    {
      "parameters": {},
      "id": "e1f1b2a3-c4d5-e6f7-a8b9-c0d1e2f3a4b5",
      "name": "When clicking \"Execute Workflow\"",
      "type": "n8n-nodes-base.manualTrigger",
      "typeVersion": 1,
      "position": [ 380, 240 ]
    },
    {
      "parameters": {
        "resource": "contact",
        "operation": "getAll",
        "limit": 50
      },
      "id": "f2g3h4i5-j6k7-l8m9-n0o1-p2q3r4s5t6u7",
      "name": "GHL Bridge",
      "type": "n8n-nodes-ghl-bridge.ghlBridge",
      "typeVersion": 1,
      "position": [ 600, 240 ],
      "credentials": {
        "ghlBridgeApi": {
          "id": "",
          "name": "GHL Bridge API account"
        }
      }
    }
  ],
  "connections": {
    "When clicking \"Execute Workflow\"": {
      "main": [
        [
          {
            "node": "GHL Bridge",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  }
};

export function WorkflowTemplates() {
  const [copied, setCopied] = useState(false);

  const copyTemplate = () => {
    navigator.clipboard.writeText(JSON.stringify(BASIC_WORKFLOW, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="hover:border-primary/50 transition-colors">
      <CardHeader>
        <CardTitle className="text-base">1-Click n8n Templates</CardTitle>
        <CardDescription>Copy a pre-built workflow JSON to instantly start building in n8n.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg border bg-muted/30">
          <div>
            <h4 className="font-medium text-sm">Fetch Contacts (Basic)</h4>
            <p className="text-xs text-muted-foreground mt-1">A simple manual trigger that fetches up to 50 contacts from your GoHighLevel location.</p>
          </div>
          <Button onClick={copyTemplate} variant="secondary" size="sm" className="shrink-0 w-32 shadow-sm">
            {copied ? (
              <>
                <CheckCircle2 className="mr-2 size-4 text-emerald-500" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="mr-2 size-4" />
                Copy JSON
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
