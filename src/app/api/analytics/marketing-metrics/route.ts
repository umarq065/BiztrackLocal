export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getMarketingMetrics } from '@/lib/services/analyticsService';

const querySchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  sources: z.string().optional(),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = Object.fromEntries(searchParams.entries());
    const { from, to, sources } = querySchema.parse(query);

    if (!from || !to) {
        return NextResponse.json({ error: 'A "from" and "to" date range is required.' }, { status: 400 });
    }

    const sourceList = sources ? sources.split(',') : undefined;
    if (!sourceList || sourceList.length === 0) {
        return NextResponse.json({ error: 'At least one income source must be selected.' }, { status: 400 });
    }

    const marketingData = await getMarketingMetrics(from, to, sourceList);

    return NextResponse.json(marketingData);

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid query parameters', details: error.errors }, { status: 400 });
    }
    console.error('API GET Error for marketing metrics route:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json({ error: 'Failed to fetch marketing metrics', details: errorMessage }, { status: 500 });
  }
}

