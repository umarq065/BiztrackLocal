
import { NextResponse } from 'next/server';
import { getYearlyStats } from '@/lib/services/analyticsService';
import { z } from 'zod';

const paramsSchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
});

export async function GET(request: Request, { params }: { params: { year: string } }) {
  try {
    const validatedParams = paramsSchema.safeParse(params);
    if (!validatedParams.success) {
      return NextResponse.json({ error: 'Invalid year format', details: validatedParams.error.errors }, { status: 400 });
    }

    const { year } = validatedParams.data;
    const yearlyStatsData = await getYearlyStats(year);
    
    return NextResponse.json(yearlyStatsData);

  } catch (error) {
    console.error(`API GET Error fetching yearly stats for year ${params.year}:`, error);
    return NextResponse.json({ error: `Failed to fetch yearly stats for ${params.year}` }, { status: 500 });
  }
}
