export const dynamic = 'force-dynamic';


import { NextResponse } from 'next/server';
import { updateCompetitor, deleteCompetitor } from '@/lib/services/competitorsService';
import { competitorFormSchema } from '@/lib/data/competitors-data';
import { z } from 'zod';
import { ObjectId } from 'mongodb';

export async function PUT(request: Request, { params }: { params: { competitorId: string } }) {
  try {
    if (!ObjectId.isValid(params.competitorId)) {
        return NextResponse.json({ error: 'Invalid competitor ID' }, { status: 400 });
    }
    const json = await request.json();
    const parsedData = competitorFormSchema.parse({
        ...json,
        workingSince: json.workingSince ? new Date(json.workingSince) : undefined,
    });

    const updatedCompetitor = await updateCompetitor(params.competitorId, parsedData);

    if (!updatedCompetitor) {
        return NextResponse.json({ error: 'Competitor not found or update failed' }, { status: 404 });
    }
    return NextResponse.json(updatedCompetitor, { status: 200 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input data', details: error.errors }, { status: 400 });
    }
    console.error('API PUT Error updating competitor:', error);
    return NextResponse.json({ error: 'Failed to update competitor' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { competitorId: string } }) {
  try {
    if (!ObjectId.isValid(params.competitorId)) {
      return NextResponse.json({ error: 'Invalid competitor ID' }, { status: 400 });
    }
    const success = await deleteCompetitor(params.competitorId);
    if (!success) {
      return NextResponse.json({ error: 'Competitor not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Competitor deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('API DELETE Error deleting competitor:', error);
    return NextResponse.json({ error: 'Failed to delete competitor' }, { status: 500 });
  }
}
