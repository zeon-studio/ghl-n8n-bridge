-- Core tables
CREATE TABLE ghl_installations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id      TEXT NOT NULL,
    user_type       TEXT NOT NULL CHECK (user_type IN ('Company', 'Location')),
    access_token    TEXT NOT NULL,
    refresh_token   TEXT NOT NULL,          -- AES-256-GCM encrypted
    token_type      TEXT DEFAULT 'Bearer',
    expires_at      TIMESTAMPTZ NOT NULL,
    scopes          TEXT[],
    raw_data        JSONB,                  -- Full OAuth response for debugging
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now(),
    UNIQUE(company_id)
);

CREATE TABLE ghl_location_tokens (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    installation_id UUID REFERENCES ghl_installations(id) ON DELETE CASCADE,
    location_id     TEXT NOT NULL,
    access_token    TEXT NOT NULL,
    refresh_token   TEXT NOT NULL,          -- AES-256-GCM encrypted
    expires_at      TIMESTAMPTZ NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now(),
    UNIQUE(location_id)
);

CREATE TABLE bridge_keys (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bridge_key      TEXT NOT NULL UNIQUE,
    installation_id UUID REFERENCES ghl_installations(id) ON DELETE CASCADE,
    company_id      TEXT NOT NULL,
    label           TEXT,                   -- User-friendly label
    is_active       BOOLEAN DEFAULT true,
    last_used_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE bridge_locations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bridge_key_id   UUID REFERENCES bridge_keys(id) ON DELETE CASCADE,
    location_id     TEXT NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT now(),
    UNIQUE(bridge_key_id, location_id)
);

-- Webhook event queue
CREATE TABLE webhook_events (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_id     TEXT NOT NULL,
    event_type      TEXT NOT NULL,
    payload         JSONB NOT NULL,
    status          TEXT DEFAULT 'pending' CHECK (status IN ('pending','processing','completed','failed','dlq')),
    attempts        INT DEFAULT 0,
    max_attempts    INT DEFAULT 3,
    next_retry_at   TIMESTAMPTZ,
    error_message   TEXT,
    idempotency_key TEXT UNIQUE,            -- Prevent duplicate processing
    created_at      TIMESTAMPTZ DEFAULT now(),
    processed_at    TIMESTAMPTZ
);

-- Webhook subscriptions (for n8n push model)
CREATE TABLE webhook_subscriptions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_id     TEXT NOT NULL,
    webhook_url     TEXT NOT NULL,
    event_types     TEXT[] NOT NULL,        -- e.g., ['ContactCreate', 'OpportunityUpdate'] or ['*']
    secret          TEXT,                   -- HMAC secret for signing pushes
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_location_tokens_location ON ghl_location_tokens(location_id);
CREATE INDEX idx_bridge_keys_key ON bridge_keys(bridge_key) WHERE is_active = true;
CREATE INDEX idx_bridge_locations_key ON bridge_locations(bridge_key_id);
CREATE INDEX idx_webhook_events_pending ON webhook_events(status, next_retry_at) 
    WHERE status IN ('pending', 'failed');
CREATE INDEX idx_webhook_events_location ON webhook_events(location_id, status);
CREATE INDEX idx_webhook_subscriptions_location ON webhook_subscriptions(location_id) WHERE is_active = true;

-- Advisory lock RPC for token refresh
CREATE OR REPLACE FUNCTION try_acquire_refresh_lock(lock_key TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql AS $$
BEGIN
    RETURN pg_try_advisory_xact_lock(hashtext(lock_key));
END;
$$;

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_installations_updated
    BEFORE UPDATE ON ghl_installations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_location_tokens_updated
    BEFORE UPDATE ON ghl_location_tokens
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    
CREATE TRIGGER trg_webhook_subscriptions_updated
    BEFORE UPDATE ON webhook_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Row Level Security
ALTER TABLE ghl_installations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ghl_location_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE bridge_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE bridge_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_subscriptions ENABLE ROW LEVEL SECURITY;

-- Service role bypass (our backend uses service_role key)
CREATE POLICY "Service role full access" ON ghl_installations
    FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access" ON ghl_location_tokens
    FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access" ON bridge_keys
    FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access" ON bridge_locations
    FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access" ON webhook_events
    FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access" ON webhook_subscriptions
    FOR ALL USING (auth.role() = 'service_role');
