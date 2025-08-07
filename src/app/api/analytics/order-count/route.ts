
import { NextResponse } from 'next/server';
import { getOrderCountAnalytics } from '@/lib/services/analyticsService';
import { z } from 'zod';

const querySchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = Object.fromEntries(searchParams.entries());
    const { from, to } = querySchema.parse(query);

    if (!from || !to) {
        return NextResponse.json({ error: 'A "from" and "to" date range is required.' }, { status: 400 });
    }

    const orderCountData = await getOrderCountAnalytics(from, to);

    return NextResponse.json(orderCountData);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid query parameters', details: error.errors }, { status: 400 });
    }
    console.error('API GET Error fetching order count analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch order count analytics' }, { status: 500 });
  }
}
