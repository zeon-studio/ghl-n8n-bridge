import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
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

    // 1. Validate bridge key
    const { rows: keyRows } = await db.query(
      'SELECT id, is_active FROM bridge_keys WHERE bridge_key = $1',
      [bridgeKey],
    );
    const keyData = keyRows[0];

    if (!keyData || !keyData.is_active) {
      return NextResponse.json({ error: 'Invalid or inactive bridge key' }, { status: 401 });
    }

    // 2. Get associated locations
    const { rows: locations } = await db.query(
      'SELECT location_id FROM bridge_locations WHERE bridge_key_id = $1',
      [keyData.id],
    );

    if (!locations || locations.length === 0) {
      return NextResponse.json({ error: 'No locations associated with this bridge key' }, { status: 403 });
    }

    // For v1, we assume one location per bridge key for webhooks, or we register for all of them
    // Let's register for all locations attached to this key
    let createdSubs;
    try {
      createdSubs = await Promise.all(
        locations.map(async (loc) => {
          const { rows } = await db.query(
            `INSERT INTO webhook_subscriptions (location_id, webhook_url, event_types, secret, is_active)
             VALUES ($1, $2, $3, $4, true)
             RETURNING *`,
            [loc.location_id, webhook_url, event_types, secret || null],
          );
          return rows[0];
        }),
      );
    } catch (subError) {
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
