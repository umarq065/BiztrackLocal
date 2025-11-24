export const dynamic = 'force-dynamic';


import { NextResponse } from 'next/server';
import { getYearlyStats } from '@/lib/services/analyticsService';
import { type SingleYearData } from '@/lib/data/yearly-stats-data';
import { format } from 'date-fns';

export async function GET(request: Request, { params }: { params: { year: string } }) {
  try {
    const year = parseInt(params.year, 10);
    if (isNaN(year)) {
      return NextResponse.json({ error: 'Invalid year provided' }, { status: 400 });
    }

    const yearlyData = await getYearlyStats(year);
    
    return NextResponse.json(yearlyData);
  } catch (error) {
    console.error(`API GET Error fetching yearly stats for ${params.year}:`, error);
    return NextResponse.json({ error: 'Failed to fetch yearly stats' }, { status: 500 });
  }
}
