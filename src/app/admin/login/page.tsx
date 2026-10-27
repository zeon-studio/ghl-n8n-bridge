"use client";

import { ModeToggle } from "@/components/mode-toggle";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowRight,
  Cable,
  KeyRound,
  Loader2,
  Lock,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!password.trim()) {
      setError("Please enter the admin password.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Authentication failed");
        setLoading(false);
        return;
      }

      router.push("/admin/overview");
      router.refresh();
    } catch {
      setError("Network or server connection error.");
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen flex flex-col justify-between p-4 sm:p-8 overflow-hidden bg-background">
      {/* Background radial glow */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-160 h-160 bg-linear-to-b from-primary/10 via-primary/5 to-transparent rounded-full blur-3xl" />

      {/* Header */}
      <header className="relative z-10 flex w-full max-w-5xl mx-auto items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2.5 font-bold tracking-tight hover:opacity-80 transition-opacity"
        >
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Cable className="size-5" />
          </div>
          <span className="text-lg">n8n GHL Bridge</span>
        </Link>
        <div className="flex items-center gap-2">
          <ModeToggle />
        </div>
      </header>

      {/* Main card */}
      <div className="relative z-10 mx-auto w-full max-w-md my-auto py-6">
        <div className="relative group">
          <div className="absolute -inset-1 rounded-3xl bg-linear-to-r from-primary/30 via-indigo-500/20 to-primary/30 opacity-40 blur-xl group-hover:opacity-75 transition-opacity duration-500" />

          <div className="relative rounded-3xl border border-border/60 bg-card/90 p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-6">
            {/* Header */}
            <div className="space-y-3 text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-4 ring-primary/5">
                <Lock className="size-6" />
              </div>
              <div className="space-y-1">
                <h2 className="text-2xl font-extrabold tracking-tight text-foreground">
                  Admin Console
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground max-w-xs mx-auto">
                  Enter your master admin password to view system insights and
                  manage bridge operations.
                </p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert
                  variant="destructive"
                  className="py-2.5 px-3 text-xs rounded-xl animate-in fade-in duration-200"
                >
                  <AlertDescription className="font-medium text-destructive">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  Admin Master Password
                </Label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    autoFocus
                    className="pl-10 h-11 rounded-xl bg-muted/30 focus-visible:ring-primary font-mono text-sm"
                  />
                </div>
              </div>

              <Button
                type="submit"
                size="lg"
                disabled={loading}
                className="w-full h-11 rounded-xl font-semibold gap-2 shadow-md hover:shadow-primary/20 transition-all cursor-pointer mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    Sign In to Admin
                    <ArrowRight className="size-4" />
                  </>
                )}
              </Button>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground pt-1">
                <ShieldCheck className="size-3.5 text-emerald-500" />
                <span>Encrypted session with timing attack protection</span>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 text-center text-xs text-muted-foreground py-2">
        <p>© 2026 Zeon Studio • GoHighLevel Token Broker Backend</p>
      </footer>
    </div>
  );
}
