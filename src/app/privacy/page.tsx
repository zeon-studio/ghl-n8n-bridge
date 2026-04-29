import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";

export const metadata = {
  title: "Privacy Policy | GHL n8n Bridge",
};

export default function PrivacyPage() {
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
          Privacy Policy
        </h1>

        <div className="space-y-5 text-muted-foreground">
          <p className="font-medium text-foreground">
            Last updated: April 29, 2026
          </p>

          <h2 className="text-xl font-semibold text-foreground">
            1. Information We Process
          </h2>
          <p>
            We process installation and integration data required to run this
            marketplace app, including GoHighLevel account identifiers, location
            identifiers, OAuth token metadata, webhook delivery metadata, and
            bridge key relationships.
          </p>

          <h2 className="text-xl font-semibold text-foreground">
            2. Why We Process It
          </h2>
          <p>
            Data is used only to authenticate installs, issue short-lived access
            tokens for n8n, and securely deliver webhook events. We do not sell
            or rent your data.
          </p>

          <h2 className="text-xl font-semibold text-foreground">
            3. Security and Retention
          </h2>
          <p>
            Sensitive credentials such as refresh tokens are encrypted at rest.
            Data is retained only as long as needed to operate the integration
            or meet legal obligations.
          </p>

          <h2 className="text-xl font-semibold text-foreground">
            4. Your Controls
          </h2>
          <p>
            You can uninstall the app in GoHighLevel at any time. You may also
            request account-level data assistance through our support channel.
          </p>

          <h2 className="text-xl font-semibold text-foreground">5. Contact</h2>
          <p>
            Privacy requests and questions can be sent to{" "}
            <a
              href="mailto:zeonstudiohg@gmail.com"
              className="text-foreground underline underline-offset-4"
            >
              zeonstudiohg@gmail.com
            </a>
            .
          </p>
        </div>
      </div>
    </main>
  );
}
