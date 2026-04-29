import { NextRequest, NextResponse } from 'next/server';
import { dispatchPendingEvents } from '@/lib/webhook/queue';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  // Optional: protect with a CRON_SECRET matching Vercel's config
  const authHeader = req.headers.get('Authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const processedCount = await dispatchPendingEvents(50); // Process up to 50 per run
    
    if (processedCount > 0) {
      logger.info('Cron dispatched pending webhooks', { count: processedCount });
    }
    
    return NextResponse.json({ success: true, processedCount });
  } catch (error) {
    logger.error('Failed to dispatch webhooks via cron', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
