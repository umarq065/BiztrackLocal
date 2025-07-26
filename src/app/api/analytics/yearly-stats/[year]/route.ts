
import { NextResponse } from 'next/server';
import { getYearlyStats } from '@/lib/services/analyticsService';
import { z } from 'zod';
import type { SingleYearData } from '@/lib/data/yearly-stats-data';

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
    const fetchedData = await getYearlyStats(year);
    
    // Create a default structure to ensure all keys are present
    const defaultData: SingleYearData = {
        year: year,
        myTotalYearlyOrders: 0,
        monthlyOrders: Array(12).fill(0),
        competitors: [],
        monthlyFinancials: Array(12).fill(0).map((_, i) => ({
            month: new Date(year, i, 1).toLocaleString('default', { month: 'short' }),
            revenue: 0,
            expenses: 0,
            profit: 0
        })),
        monthlyTargetRevenue: Array(12).fill(0),
    };

    // Merge fetched data into the default structure, ensuring nested arrays are also defaulted
    const yearlyStatsData: SingleYearData = {
        ...defaultData,
        ...fetchedData,
        monthlyFinancials: fetchedData.monthlyFinancials || defaultData.monthlyFinancials,
        monthlyTargetRevenue: fetchedData.monthlyTargetRevenue || defaultData.monthlyTargetRevenue,
        competitors: fetchedData.competitors || [],
    };
    
    return NextResponse.json(yearlyStatsData);

  } catch (error) {
    console.error(`API GET Error fetching yearly stats for year ${params.year}:`, error);
    return NextResponse.json({ error: `Failed to fetch yearly stats for ${params.year}` }, { status: 500 });
  }
}
