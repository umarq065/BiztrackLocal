export const dynamic = 'force-dynamic';


import { NextResponse } from 'next/server';
import { getGigAnalytics } from '@/lib/services/analyticsService';
import { z } from 'zod';

const querySchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
});

export async function GET(request: Request, { params }: { params: { gigId: string } }) {
  try {
    const { searchParams } = new URL(request.url);
    const query = Object.fromEntries(searchParams.entries());
    const { from, to } = querySchema.parse(query);

    const analyticsData = await getGigAnalytics(params.gigId, from, to);

    if (!analyticsData) {
      return NextResponse.json({ error: 'Gig not found or no analytics available' }, { status: 404 });
    }

    return NextResponse.json(analyticsData);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid query parameters', details: error.errors }, { status: 400 });
    }
    console.error('API GET Error fetching gig analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch gig analytics' }, { status: 500 });
  }
}
