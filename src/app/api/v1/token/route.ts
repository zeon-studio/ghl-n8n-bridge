import { NextRequest, NextResponse } from 'next/server';
import { resolveBrokerToken } from '@/lib/token/broker';
import { AppError } from '@/lib/errors';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const bridgeKey = url.searchParams.get('bridge_key');
    const locationId = url.searchParams.get('location_id');

    if (!bridgeKey || !locationId) {
      return NextResponse.json(
        { error: 'Missing required parameters: bridge_key and location_id' },
        { status: 400 }
      );
    }

    const tokenResponse = await resolveBrokerToken(bridgeKey, locationId);

    return NextResponse.json(tokenResponse, {
      headers: {
        'Cache-Control': 'no-store', // Never cache tokens
      },
    });

  } catch (error) {
    if (error instanceof AppError) {
      logger.warn('Token broker error', { code: error.code, message: error.message });
      return NextResponse.json(
        { error: error.code, message: error.message },
        { status: error.statusCode }
      );
    }

    logger.error('Unexpected token broker error', error);
    return NextResponse.json(
      { error: 'INTERNAL_SERVER_ERROR', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
