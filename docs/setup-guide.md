# End-to-End Setup Guide

Follow these steps to configure your credentials, database, and infrastructure to get the GoHighLevel (GHL) Token Broker and n8n integration fully operational.

---

## 1. Supabase (Database & Queue) Setup

Your backend relies on Supabase for persistent storage of tokens, installations, bridge keys, and the webhook queue.

1. **Create a Supabase Project**: Go to [Supabase](https://supabase.com) and create a new project.
2. **Run the Database Migration**:
   - Go to the **SQL Editor** in your Supabase dashboard.
   - Open `/supabase/migrations/001_initial_schema.sql` from your project.
   - Paste the entire SQL content into the editor and click **Run**.
   - *This will create all necessary tables, RLS policies, and the `try_acquire_refresh_lock` function.*
3. **Get Credentials**:
   - Go to **Project Settings -> API**.
   - Copy the **Project URL** and the **`service_role` secret**.

## 2. Upstash (Redis Rate Limiting) Setup - OPTIONAL

*You can completely skip this step if you don't want strict API rate limiting. The system is designed to gracefully disable rate limiting and work perfectly using just Supabase if you don't provide Redis credentials.*

If you do want to use Upstash for serverless Redis to handle rate-limiting (Tokens, Webhooks, Global Burst):

1. **Create a Redis Database**: Go to [Upstash](https://upstash.com), log in, and create a new Redis database.
2. **Get Credentials**:
   - Scroll down to the **REST API** section in the Upstash dashboard.
   - Copy the **UPSTASH_REDIS_REST_URL** and **UPSTASH_REDIS_REST_TOKEN**.

## 3. GoHighLevel Marketplace App Setup

You need to register your app in the GHL Marketplace to get your OAuth credentials.

1. **Create the App**: Go to the [GHL Marketplace Developer Portal](https://marketplace.gohighlevel.com/) and create an App.
2. **Configure OAuth**:
   - **Redirect URI**: Set this to `https://<YOUR_BACKEND_URL>/api/auth/callback` (For local testing, use a tunneling service like ngrok: `https://<ngrok-url>/api/auth/callback`).
   - **Scopes**: Add the required scopes that you defined in `src/lib/ghl/scopes.ts` (e.g., `contacts.readonly`, `contacts.write`, etc.).
3. **Configure Webhooks (Optional but recommended)**:
   - If you want GHL to push events directly to your broker, add a Webhook URL in the GHL App settings pointing to: `https://<YOUR_BACKEND_URL>/api/webhook`.
4. **Get Credentials**:
   - Copy the **Client ID** and **Client Secret**.
   - Copy the **Marketplace App ID** (24-character hex ID shown in app details/URL).

## 4. Backend Environment Variables

Create a `.env.local` file in the `root` directory and fill it out:

```env
# 1. GHL OAuth Credentials
NEXT_PUBLIC_GHL_CLIENT_ID="your-ghl-client-id"
GHL_CLIENT_SECRET="your-ghl-client-secret"
GHL_MARKETPLACE_APP_ID="your-24-char-hex-marketplace-app-id"
GHL_APP_VERSION_ID="2021-07-28" # Current GHL API Version

# 2. Supabase Settings
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# 3. Upstash Redis
UPSTASH_REDIS_REST_URL="https://your-upstash-url.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-upstash-token"

# 4. Security Keys
# Generate a random 32-byte hex string for encrypting refresh tokens in the DB
# You can generate this using: node -e "console.log(crypto.randomBytes(32).toString('hex'))"
TOKEN_ENCRYPTION_KEY="your-64-character-hex-string"

# Secret used to secure the cron job endpoint from unauthorized triggers
CRON_SECRET="generate-a-random-secret-string"

# Your deployed backend URL (used by n8n to connect)
NEXT_PUBLIC_APP_URL="http://localhost:3000" # Change for production
```

> [!CAUTION]
> **Keep your `TOKEN_ENCRYPTION_KEY` safe!** If you lose it, you won't be able to decrypt your refresh tokens and all users will need to re-authenticate.

## 5. Running the Backend & Cron Job

1. **Start the backend locally**:

   ```bash
   cd ghl-n8n-app
   npm install
   npm run dev
   ```

2. **Triggering Webhook Queues (Local Testing)**:
   - Since Vercel Cron won't run locally, you can manually dispatch queued webhooks by pinging the cron endpoint:
   - `curl -H "Authorization: Bearer <YOUR_CRON_SECRET>" http://localhost:3000/api/cron/dispatch-webhooks`

## 6. n8n Node Setup

1. **Build the Bridge Node**:

   ```bash
   cd n8n-nodes-ghl-bridge
   npm install
   npm run build
   ```

2. **Install in Local n8n**:
   - Link the package to your local n8n custom directory:

   ```bash
   npm link
   cd ~/.n8n/custom
   npm link n8n-nodes-ghl-bridge
   ```

3. **Using in n8n**:
   - Start n8n.
   - Go to **Credentials** -> Create new **GHL Bridge API**.
   - Set the **Base URL** to your backend URL (e.g., `http://localhost:3000`).
   - Set the **Bridge Key**. *You get this key when you install your App into a GHL Sub-Account (it redirects to your dashboard with `?key=brg_...`).*
   - You can now use the **GHL Bridge** action node and **GHL Bridge Trigger** node in your workflows!
