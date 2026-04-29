import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LifeBuoy, Mail, ShieldCheck } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Support | GHL n8n Bridge",
};

const supportEmail = "zeonstudiohg@gmail.com";
const marketplaceHref =
  process.env.NEXT_PUBLIC_GHL_MARKETPLACE_INSTALL_URL ||
  (process.env.GHL_MARKETPLACE_APP_ID
    ? `https://marketplace.gohighlevel.com/integration/${process.env.GHL_MARKETPLACE_APP_ID}`
    : "https://marketplace.gohighlevel.com/");

export default function SupportPage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center overflow-hidden bg-background px-6 pb-16 pt-14 sm:px-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-linear-to-b from-primary/5 to-transparent" />

      <div className="z-10 flex w-full max-w-4xl flex-col gap-6">
        <div className="space-y-3">
          <Badge className="w-fit">Support</Badge>
          <h1 className="font-heading text-4xl tracking-tight sm:text-5xl">
            Need help with your integration?
          </h1>
          <p className="max-w-2xl text-muted-foreground">
            Reach us for installation help, OAuth troubleshooting, key rotation,
            and webhook delivery questions.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="hover:border-primary/50 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Mail className="size-4" />
                Contact Support
              </CardTitle>
              <CardDescription>
                Email support for account-specific issues.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <a
                href={`mailto:${supportEmail}`}
                className={buttonVariants({
                  variant: "default",
                  className: "w-full font-semibold",
                })}
              >
                {supportEmail}
              </a>
            </CardContent>
          </Card>

          <Card className="hover:border-primary/50 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <LifeBuoy className="size-4" />
                Install Link
              </CardTitle>
              <CardDescription>
                Install this app directly from the marketplace listing.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <a
                href={marketplaceHref}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonVariants({
                  variant: "outline",
                  className: "w-full font-semibold",
                })}
              >
                Open Marketplace
              </a>
            </CardContent>
          </Card>

          <Card className="hover:border-primary/50 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldCheck className="size-4" />
                Legal
              </CardTitle>
              <CardDescription>
                Review privacy and terms for marketplace submission.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link
                href="/privacy"
                className={buttonVariants({
                  variant: "outline",
                  className: "w-full",
                })}
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className={buttonVariants({
                  variant: "outline",
                  className: "w-full",
                })}
              >
                Terms of Service
              </Link>
            </CardContent>
          </Card>
        </div>

        <Link
          href="/"
          className={buttonVariants({ variant: "ghost", className: "w-fit" })}
        >
          Back to Home
        </Link>
      </div>
    </main>
  );
}
