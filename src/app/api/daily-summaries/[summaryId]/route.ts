export const dynamic = 'force-dynamic';


import { NextResponse } from 'next/server';
import { updateDailySummary, deleteDailySummary } from '@/lib/services/dailySummaryService';
import { summaryFormSchema } from '@/lib/data/daily-summary-data';
import { z } from 'zod';
import { ObjectId } from 'mongodb';

const updateSchema = summaryFormSchema.extend({
    date: z.string().optional(), // Date is not updatable, but we can allow it in the payload and ignore
});

export async function PUT(request: Request, { params }: { params: { summaryId: string } }) {
  try {
    if (!ObjectId.isValid(params.summaryId)) {
        return NextResponse.json({ error: 'Invalid summary ID' }, { status: 400 });
    }
    const json = await request.json();
    const parsedData = updateSchema.parse(json);

    const updatedSummary = await updateDailySummary(params.summaryId, parsedData);

    if (!updatedSummary) {
        return NextResponse.json({ error: 'Summary not found or update failed' }, { status: 404 });
    }
    return NextResponse.json(updatedSummary, { status: 200 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input data', details: error.errors }, { status: 400 });
    }
    console.error('API PUT Error updating summary:', error);
    return NextResponse.json({ error: 'Failed to update summary' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { summaryId: string } }) {
  try {
    if (!ObjectId.isValid(params.summaryId)) {
      return NextResponse.json({ error: 'Invalid summary ID' }, { status: 400 });
    }
    const success = await deleteDailySummary(params.summaryId);
    if (!success) {
      return NextResponse.json({ error: 'Summary not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Summary deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('API DELETE Error deleting summary:', error);
    return NextResponse.json({ error: 'Failed to delete summary' }, { status: 500 });
  }
}
