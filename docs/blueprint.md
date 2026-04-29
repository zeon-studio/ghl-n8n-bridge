# Objective

Build a **production-ready GoHighLevel (GHL) Marketplace App + n8n integration** using a **Token Broker Architecture (NO request proxying)**.

The system must:

* Allow 1-click install from GHL Marketplace
* Provide a **Bridge Access Key**
* Let n8n call GHL APIs **directly using short-lived tokens**
* Ensure scalability to 100k+ users

---

# Architecture (CRITICAL)

## Model: Token Broker (NOT Proxy)

DO NOT build a request proxy.

Instead:

* Backend = OAuth + Token Broker only
* n8n = executes API calls directly to GHL

### Flow

1. User installs app in GHL Marketplace
2. OAuth completes → tokens stored in DB
3. User receives `bridgeAccessKey`
4. n8n node:

   * calls `/api/token`
   * gets short-lived `access_token`
   * calls GHL API directly

---

# System Components

## 1. Backend (Next.js + Supabase)

* Next.js 16 (App Router)
* Supabase (Postgres)
* Deploy on Vercel

Responsibilities:

* OAuth handling
* Token storage
* Token refresh
* Token issuing (short-lived)

---

## 2. Token Broker API

### Endpoint

GET `/api/token`

### Input

* `bridge_key`
* `location_id`

### Output

```json
{
  "access_token": "...",
  "expires_in": 300
}
```

### Logic

1. Validate `bridge_key`
2. Resolve `location_id`
3. Fetch token from DB
4. If expiring → refresh (with lock)
5. Return short-lived token

---

## 3. n8n Community Node

### Credential

Name: `ghlBridgeApi`

Fields:

* `bridgeAccessKey`
* optional: `locationId`

### Execution Flow

1. Call `/api/token`
2. Receive `access_token`
3. Use HTTP Request node internally:

   * Auth: Bearer Token
   * Call GHL API directly

---

# OAuth Implementation (CRITICAL)

* Endpoint: `/api/auth/callback`
* Exchange:

  * `code → access_token + refresh_token`
* MUST include:

  * `user_type=Company` or `Location`
* Handle:

  * `isBulkInstallation=true`

### Bulk Install

* Call `/oauth/installedLocations`
* Store tokens per `location_id`

---

## REQUIRED FIX

Append:

```
&version_id=APP_VERSION_ID
```

Without this → `noAppVersionIdFound` error

---

# Database Schema

### ghl_installations

* id (uuid)
* company_id
* location_id
* access_token
* refresh_token (encrypted)
* expires_at
* bridge_key

### bridge_locations

* bridge_key
* location_id

---

# Token Strategy (CRITICAL)

* NEVER expose:

  * refresh_token
  * long-lived access_token

* ALWAYS:

  * issue short-lived tokens (5–10 min)

---

# Token Refresh System

* Auto-refresh before expiry
* Use distributed locking:

  * Postgres advisory lock OR Redis lock
* Prevent concurrent refresh per location

---

# Webhook System

Flow:

GHL → `/api/webhook` → queue → n8n webhook

Requirements:

* Verify `X-GHL-Signature` (Ed25519)
* Async processing (queue-based)
* Retry + DLQ
* Idempotent handling

---

# Required OAuth Scopes

contacts.readonly contacts.write
opportunities.readonly opportunities.write
conversations.readonly conversations.write
conversations/message.readonly conversations/message.write
calendars.readonly calendars.write
calendars/events.readonly calendars/events.write
forms.readonly forms.write
workflows.readonly
locations.readonly
locations/customFields.write
locations/customValues.write
users.readonly

---

# Security Requirements

* Encrypt refresh tokens
* Rate limit per bridge_key
* HTTPS only
* Tenant isolation
* No token leakage to client

---

# Performance & Scaling

* Stateless API
* Horizontal scaling
* Cache token lookups (optional)
* Avoid cold start latency
* Minimize DB queries

---

# Reliability

* Retry with exponential backoff
* Circuit breaker for GHL API failures
* Dead-letter queue for failed jobs

---

# Observability

* Structured logs (per tenant)
* Error tracking
* Request tracing

---

# Additional Requirements

* Handle uninstall → delete tokens
* Auto-register/unregister webhooks
* API versioning: `/api/v1/...`
* Dashboard UI:

  * show bridge key
  * test connection

---

# Deliverables

## Backend

* Full Next.js project
* API routes:

  * `/api/auth/callback`
  * `/api/token`
  * `/api/webhook`
* Supabase schema + queries
* Token refresh system

## n8n Node

* Full community node (TypeScript)
* Credential + actions + trigger
* Uses Bearer auth with token broker

## Docs

* Setup guide
* Env variables
* GHL Marketplace config
* Deployment (Vercel + Supabase)

---

# Constraints

* Production-ready only
* No pseudo-code
* TypeScript only
* Proper error handling
* Clean modular structure

---

# Success Criteria

1. Install app from GHL Marketplace
2. OAuth completes
3. Bridge key generated
4. n8n uses key
5. n8n calls GHL directly
6. Webhooks received + processed
