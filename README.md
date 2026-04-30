# ghl-n8n-app (GHL Token Broker)

This is the **GoHighLevel (GHL) Token Broker Backend**, designed to integrate securely with the `n8n-nodes-ghl-bridge` community node.

Built and maintained by **[Zeon Studio](https://zeon.studio)**.

## Why this exists?

When building a public Marketplace App for GoHighLevel, you must use OAuth 2.0. Managing these rapid-expiring OAuth tokens directly inside n8n leads to race conditions and invalid tokens.

This Next.js backend serves as a highly-available middleware that:

1. Handles the OAuth 2.0 handshake (`/api/v1/oauth/callback`).
2. Stores and encrypts tokens in Supabase.
3. Provides an API endpoint for the n8n Action node to seamlessly retrieve short-lived access tokens via `pg_try_advisory_xact_lock` to prevent race conditions during refresh.
4. Provides a secure webhook receiver (`/api/v1/webhooks/trigger`) that validates GHL HMAC signatures and queues events in Supabase for n8n to retrieve securely.

## Tech Stack

- Next.js 16 (App Router)
- Supabase (PostgreSQL + RLS)
- Upstash Redis (Optional - for Rate Limiting)
- Vercel (Recommended Deployment)

## Quick Start

1. Set up a Supabase project and run the provided SQL migration script (found in `setup-guide.md`).
2. Copy `.env.example` to `.env.local` and fill in your GHL App credentials and Supabase keys.
3. Run the development server:

```bash
npm install
npm run dev
```

1. Set up a cron job (via Vercel Cron or similar) to hit `GET /api/cron/dispatch-webhooks` every minute.

## License

[MIT License](LICENSE) © 2026 Zeon Studio
