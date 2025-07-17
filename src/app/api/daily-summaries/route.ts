
import { NextResponse } from 'next/server';
import { getDailySummaries, addDailySummary } from '@/lib/services/dailySummaryService';
import { summaryFormSchema } from '@/lib/data/daily-summary-data';
import { z } from 'zod';

export async function GET() {
  try {
    const summaries = await getDailySummaries();
    return NextResponse.json(summaries);
  } catch (error) {
    console.error('API GET Error fetching summaries:', error);
    return NextResponse.json({ error: 'Failed to fetch summaries' }, { status: 500 });
  }
}

export async function POST(request: Request) {
    try {
        const json = await request.json();
        const parsedData = summaryFormSchema.parse({
            ...json,
            date: new Date(json.date),
        });
        const newSummary = await addDailySummary(parsedData);
        return NextResponse.json(newSummary, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Invalid input data', details: error.errors }, { status: 400 });
        }
        console.error('API POST Error creating summary:', error);
        return NextResponse.json({ error: 'Failed to create summary' }, { status: 500 });
    }
}
