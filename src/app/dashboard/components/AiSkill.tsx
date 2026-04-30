"use client";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Brain,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Sparkles,
} from "lucide-react";
import { useState } from "react";

interface AiSkillProps {
  skillContent: string;
}

export function AiSkill({ skillContent }: AiSkillProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(skillContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="border-none bg-linear-to-br from-indigo-500/10 via-background to-purple-500/10 shadow-lg overflow-hidden transition-all duration-300">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-indigo-500 text-white shadow-indigo-500/20 shadow-lg animate-pulse">
              <Brain className="size-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                AI Integration Skill
                <Sparkles className="size-4 text-amber-500" />
              </CardTitle>
              <CardDescription>
                Provide this to your AI agent to build workflows
              </CardDescription>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={copyToClipboard}
            className="rounded-full gap-2 border-indigo-200 hover:bg-indigo-50"
          >
            {copied ? (
              <>
                <Check className="size-4 text-green-600" />
                <span className="text-green-600">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="size-4" />
                <span>Copy Skill</span>
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <div className="relative">
            <div
              className={`text-sm font-mono p-4 rounded-lg bg-muted/50 border border-muted transition-all duration-500 ${!isOpen ? "max-h-32 overflow-hidden mask-fade-bottom" : ""}`}
            >
              <pre className="whitespace-pre-wrap text-xs text-muted-foreground">
                {skillContent}
              </pre>
            </div>

            <div
              className={`absolute bottom-0 left-0 right-0 h-12 bg-linear-to-t from-background to-transparent transition-opacity duration-300 ${isOpen ? "opacity-0 pointer-events-none" : "opacity-100"}`}
            />
          </div>

          <CollapsibleTrigger
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "w-full mt-2 gap-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50",
            )}
          >
              {isOpen ? (
                <>
                  <ChevronUp className="size-4" />
                  Show Less
                </>
              ) : (
                <>
                  <ChevronDown className="size-4" />
                  Preview Skill
                </>
              )}
          </CollapsibleTrigger>

          <CollapsibleContent className="mt-4">
            <div className="text-xs space-y-4 text-muted-foreground border-t pt-4">
              <p>
                <strong>Pro-Tip:</strong> You can paste this content directly
                into ChatGPT, Claude, or any AI assistant's system instructions
                to give them instant mastery over your GHL-n8n bridge.
              </p>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>

      <style jsx global>{`
        .mask-fade-bottom {
          mask-image: linear-gradient(to bottom, black 60%, transparent 100%);
        }
      `}</style>
    </Card>
  );
}
