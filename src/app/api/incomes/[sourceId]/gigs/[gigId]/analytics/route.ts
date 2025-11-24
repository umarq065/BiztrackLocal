export const dynamic = 'force-dynamic';


import { NextResponse } from 'next/server';
import { addAnalyticsToGig } from '@/lib/services/incomesService';
import { z } from 'zod';

const addGigDataFormSchema = z.object({
    date: z.date({ required_error: "A date is required." }),
    impressions: z.coerce.number().int().min(0),
    clicks: z.coerce.number().int().min(0),
});

export async function POST(request: Request, { params }: { params: { sourceId: string; gigId: string } }) {
  try {
    const json = await request.json();
    const parsedJson = { ...json, date: new Date(json.date) };
    const parsedData = addGigDataFormSchema.parse(parsedJson);

    const updatedGig = await addAnalyticsToGig(params.sourceId, params.gigId, parsedData);

    if (!updatedGig) {
      return NextResponse.json({ error: 'Gig not found or failed to add analytics' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Analytics added successfully', gig: updatedGig }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input data', details: error.errors }, { status: 400 });
    }
    console.error('API Error adding analytics:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
