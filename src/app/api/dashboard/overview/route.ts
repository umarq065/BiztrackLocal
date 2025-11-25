export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getDashboardOverview } from '@/lib/services/analyticsService';

const querySchema = z.object({
    from: z.string(),
    to: z.string(),
});

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const query = Object.fromEntries(searchParams.entries());
        const { from, to } = querySchema.parse(query);

        const overviewData = await getDashboardOverview(from, to);

        return NextResponse.json(overviewData);

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Invalid query parameters', details: error.errors }, { status: 400 });
        }
        console.error('API GET Error for dashboard overview:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
        return NextResponse.json({ error: 'Failed to fetch dashboard overview', details: errorMessage }, { status: 500 });
    }
}
