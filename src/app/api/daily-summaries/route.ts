export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getDailySummaries, addDailySummary } from '@/lib/services/dailySummaryService';
import { summaryFormSchema } from '@/lib/data/daily-summary-data';
import { z } from 'zod';

const postSchema = summaryFormSchema.extend({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
});

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
    const parsedData = postSchema.parse(json);

    const newSummary = await addDailySummary(parsedData);
    return NextResponse.json(newSummary, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input data', details: error.errors }, { status: 400 });
    }
    if (error instanceof Error && error.message.includes('already has a summary')) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    console.error('API POST Error creating summary:', error);
    return NextResponse.json({ error: 'Failed to create summary' }, { status: 500 });
  }
}

