import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceRoleClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid Authorization header' }, { status: 401 });
    }

    const bridgeKey = authHeader.replace('Bearer ', '');
    const body = await req.json();

    const { webhook_url, event_types, secret } = body;

    if (!webhook_url || !Array.isArray(event_types)) {
      return NextResponse.json({ error: 'Invalid payload. Requires webhook_url and event_types array' }, { status: 400 });
    }

    const supabase = getSupabaseServiceRoleClient();

    // 1. Validate bridge key
    const { data: keyData, error: keyError } = await supabase
      .from('bridge_keys')
      .select('id, is_active')
      .eq('bridge_key', bridgeKey)
      .single();

    if (keyError || !keyData || !keyData.is_active) {
      return NextResponse.json({ error: 'Invalid or inactive bridge key' }, { status: 401 });
    }

    // 2. Get associated locations
    const { data: locations } = await supabase
      .from('bridge_locations')
      .select('location_id')
      .eq('bridge_key_id', keyData.id);

    if (!locations || locations.length === 0) {
      return NextResponse.json({ error: 'No locations associated with this bridge key' }, { status: 403 });
    }

    // For v1, we assume one location per bridge key for webhooks, or we register for all of them
    // Let's register for all locations attached to this key
    const subscriptions = locations.map(loc => ({
      location_id: loc.location_id,
      webhook_url,
      event_types,
      secret: secret || null,
      is_active: true
    }));

    const { data: createdSubs, error: subError } = await supabase
      .from('webhook_subscriptions')
      .insert(subscriptions)
      .select();

    if (subError) {
      logger.error('Failed to create webhook subscription', subError);
      return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 });
    }

    logger.info('Webhook registered successfully', { bridgeKeyId: keyData.id, webhookUrl: webhook_url });

    return NextResponse.json({
      success: true,
      subscriptions: createdSubs.map(s => ({
        id: s.id,
        location_id: s.location_id,
        webhook_url: s.webhook_url,
        event_types: s.event_types
      }))
    });

  } catch (error) {
    logger.error('Unexpected error registering webhook', error);
    return NextResponse.json(
      { error: 'INTERNAL_SERVER_ERROR', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
