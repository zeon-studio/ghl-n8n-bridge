import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";

export const metadata = {
  title: "Terms of Service | n8n GHL Bridge",
};

export default function TermsPage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center overflow-hidden bg-background px-6 pb-16 pt-14 sm:px-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-linear-to-b from-primary/5 to-transparent" />

      <div className="z-10 flex w-full max-w-3xl flex-col gap-6">
        <Link
          href="/"
          className={buttonVariants({ variant: "outline", className: "w-fit" })}
        >
          Back to Home
        </Link>

        <h1 className="font-heading text-4xl tracking-tight sm:text-5xl">
          Terms of Service
        </h1>

        <div className="space-y-5 text-muted-foreground">
          <p className="font-medium text-foreground">
            Last updated: April 29, 2026
          </p>

          <h2 className="text-xl font-semibold text-foreground">
            1. Acceptance
          </h2>
          <p>
            By installing or using this app, you agree to these Terms. If you do
            not agree, do not install or use the service.
          </p>

          <h2 className="text-xl font-semibold text-foreground">
            2. Service Scope
          </h2>
          <p>
            This app brokers authentication and webhook workflows between
            GoHighLevel and n8n. The service is provided on an as-is basis
            without guaranteed uptime.
          </p>

          <h2 className="text-xl font-semibold text-foreground">
            3. Customer Responsibilities
          </h2>
          <p>
            You are responsible for your automation logic, compliance, and
            lawful usage of generated API calls and webhook workflows.
          </p>

          <h2 className="text-xl font-semibold text-foreground">
            4. Liability Limits
          </h2>
          <p>
            To the fullest extent permitted by law, we are not liable for
            indirect, incidental, or consequential damages related to use of
            this app.
          </p>

          <h2 className="text-xl font-semibold text-foreground">5. Changes</h2>
          <p>
            We may update these Terms as the product evolves. Material updates
            are published through this page.
          </p>
        </div>
      </div>
    </main>
  );
}
