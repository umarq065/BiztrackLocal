export const dynamic = 'force-dynamic';


import { NextResponse } from 'next/server';
import { updateGig, deleteGig } from '@/lib/services/incomesService';
import { z } from 'zod';

const editGigFormSchema = z.object({
    name: z.string().min(2, { message: "Gig name must be at least 2 characters." }),
    date: z.date({ required_error: "A date for the gig is required." }),
});

export async function PUT(request: Request, { params }: { params: { sourceId: string; gigId: string } }) {
  try {
    const json = await request.json();
    // The date comes in as a string, so we need to parse it.
    const parsedJson = { ...json, date: new Date(json.date) };
    const parsedData = editGigFormSchema.parse(parsedJson);

    const updatedGig = await updateGig(params.sourceId, params.gigId, parsedData);

    if (!updatedGig) {
      return NextResponse.json({ error: 'Gig not found or failed to update' }, { status: 404 });
    }

    return NextResponse.json(
      { message: 'Gig updated successfully', gig: updatedGig },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input data', details: error.errors }, { status: 400 });
    }
    console.error('API Error updating gig:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { sourceId: string; gigId: string } }) {
    try {
        const success = await deleteGig(params.sourceId, params.gigId);

        if (!success) {
            return NextResponse.json({ error: 'Gig not found or failed to delete' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Gig deleted successfully' }, { status: 200 });
    } catch (error) {
        console.error('API Error deleting gig:', error);
        return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
    }
}
