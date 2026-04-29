import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceRoleClient } from '@/lib/supabase/client';
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

    // 2. Get authorized locations
    const { data: locations } = await supabase
      .from('bridge_locations')
      .select('location_id')
      .eq('bridge_key_id', keyData.id);

    const locationIds = locations?.map(l => l.location_id) || [];

    if (locationIds.length === 0) {
      return NextResponse.json({ error: 'Not authorized for any locations' }, { status: 403 });
    }

    // 3. Delete subscription (ensure it belongs to authorized location)
    const { error: deleteError } = await supabase
      .from('webhook_subscriptions')
      .delete()
      .eq('id', subscriptionId)
      .in('location_id', locationIds);

    if (deleteError) {
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
