
import { NextResponse } from 'next/server';
import { addGigToSource } from '@/lib/services/incomesService';
import { z } from 'zod';

const addGigFormSchema = z.object({
    name: z.string().min(2, { message: "Gig name must be at least 2 characters." }),
    date: z.date({ required_error: "A date for the gig is required." }),
});

export async function POST(request: Request, { params }: { params: { sourceId: string } }) {
  try {
    const json = await request.json();
    // The date comes in as a string, so we need to parse it.
    const parsedJson = { ...json, date: new Date(json.date) };
    const parsedData = addGigFormSchema.parse(parsedJson);

    const newGig = await addGigToSource(params.sourceId, parsedData);

    return NextResponse.json(
      { message: 'Gig added successfully', gig: newGig },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input data', details: error.errors }, { status: 400 });
    }
    console.error('API Error adding gig:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
