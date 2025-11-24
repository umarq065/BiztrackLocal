export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getCompetitors, addCompetitor } from '@/lib/services/competitorsService';
import { competitorFormSchema } from '@/lib/data/competitors-data';
import { z } from 'zod';

export async function GET() {
  try {
    const competitors = await getCompetitors();
    return NextResponse.json(competitors);
  } catch (error) {
    console.error('API GET Error fetching competitors:', error);
    return NextResponse.json({ error: 'Failed to fetch competitors' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsedData = competitorFormSchema.parse({
        ...json,
        workingSince: json.workingSince ? new Date(json.workingSince) : undefined,
    });

    const newCompetitor = await addCompetitor(parsedData);
    return NextResponse.json(newCompetitor, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input data', details: error.errors }, { status: 400 });
    }
    console.error('API POST Error creating competitor:', error);
    return NextResponse.json({ error: 'Failed to create competitor' }, { status: 500 });
  }
}

