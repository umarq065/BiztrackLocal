
import { NextResponse } from 'next/server';
import { addIncomeSource, getIncomeSources, formSchema } from '@/lib/services/incomesService';
import { z } from 'zod';

/**
 * @fileoverview API route for handling income sources.
 *
 * - GET: Retrieves all income sources.
 * - POST: Creates a new income source.
 */

export async function GET() {
  try {
    const sources = await getIncomeSources();
    return NextResponse.json(sources);
  } catch (error) {
    console.error('API GET Error fetching incomes:', error);
    return NextResponse.json({ error: 'Failed to fetch income sources' }, { status: 500 });
  }
}


export async function POST(request: Request) {
  try {
    const json = await request.json();
    // Dates come in as strings, so we need to parse them.
    const parsedGigs = json.gigs.map((gig: any) => ({ ...gig, date: new Date(gig.date) }));
    const parsedData = formSchema.parse({ ...json, gigs: parsedGigs });

    const newSource = await addIncomeSource(parsedData);

    return NextResponse.json(
      { message: 'Income source added successfully', source: newSource },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input data', details: error.errors }, { status: 400 });
    }
    console.error('API Error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
