export const dynamic = 'force-dynamic';


import { NextResponse } from 'next/server';
import { addCompetitorData } from '@/lib/services/competitorsService';
import { competitorDataFormSchema } from '@/lib/data/competitors-data';
import { z } from 'zod';
import { ObjectId } from 'mongodb';

export async function POST(request: Request, { params }: { params: { competitorId: string } }) {
  try {
    if (!ObjectId.isValid(params.competitorId)) {
        return NextResponse.json({ error: 'Invalid competitor ID' }, { status: 400 });
    }
    const json = await request.json();
    const parsedData = competitorDataFormSchema.parse(json);

    const updatedCompetitor = await addCompetitorData(params.competitorId, parsedData);
    if (!updatedCompetitor) {
        return NextResponse.json({ error: 'Competitor not found or update failed' }, { status: 404 });
    }
    
    return NextResponse.json(updatedCompetitor, { status: 200 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input data', details: error.errors }, { status: 400 });
    }
    console.error('API POST Error adding competitor data:', error);
    return NextResponse.json({ error: 'Failed to add competitor data' }, { status: 500 });
  }
}
