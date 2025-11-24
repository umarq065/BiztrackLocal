export const dynamic = 'force-dynamic';


import { NextResponse } from 'next/server';
import { getSourceAnalytics } from '@/lib/services/analyticsService';
import { z } from 'zod';

const querySchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
});

export async function GET(request: Request, { params }: { params: { sourceId: string } }) {
  try {
    const { searchParams } = new URL(request.url);
    const query = Object.fromEntries(searchParams.entries());
    const { from, to } = querySchema.parse(query);

    const analyticsData = await getSourceAnalytics(params.sourceId, from, to);

    if (!analyticsData) {
      return NextResponse.json({ error: 'Source not found or no analytics available' }, { status: 404 });
    }

    return NextResponse.json(analyticsData);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid query parameters', details: error.errors }, { status: 400 });
    }
    console.error('API GET Error fetching source analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch source analytics' }, { status: 500 });
  }
}
