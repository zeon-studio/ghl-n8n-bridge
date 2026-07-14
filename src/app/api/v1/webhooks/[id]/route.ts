import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid Authorization header' }, { status: 401 });
    }

    const bridgeKey = authHeader.replace('Bearer ', '');
    const { id: subscriptionId } = await params;

    if (!subscriptionId) {
      return NextResponse.json({ error: 'Subscription ID is required' }, { status: 400 });
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

    // 2. Get authorized locations
    const { rows: locations } = await db.query(
      'SELECT location_id FROM bridge_locations WHERE bridge_key_id = $1',
      [keyData.id],
    );

    const locationIds = locations?.map(l => l.location_id) || [];

    if (locationIds.length === 0) {
      return NextResponse.json({ error: 'Not authorized for any locations' }, { status: 403 });
    }

    // 3. Delete subscription (ensure it belongs to authorized location)
    try {
      await db.query(
        'DELETE FROM webhook_subscriptions WHERE id = $1 AND location_id = ANY($2::text[])',
        [subscriptionId, locationIds],
      );
    } catch (deleteError) {
      logger.error('Failed to delete webhook subscription', deleteError);
      return NextResponse.json({ error: 'Failed to delete subscription' }, { status: 500 });
    }

    logger.info('Webhook subscription deleted', { subscriptionId, bridgeKeyId: keyData.id });

    return NextResponse.json({ success: true });

  } catch (error) {
    logger.error('Unexpected error deleting webhook', error);
    return NextResponse.json(
      { error: 'INTERNAL_SERVER_ERROR', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
