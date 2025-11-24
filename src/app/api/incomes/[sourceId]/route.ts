export const dynamic = 'force-dynamic';


import { NextResponse } from 'next/server';
import { getIncomeSources, deleteIncomeSource, updateIncomeSource } from '@/lib/services/incomesService';
import { ObjectId } from 'mongodb';
import { z } from 'zod';

const updateSchema = z.object({
  name: z.string().min(2, "Source name must be at least 2 characters."),
});

export async function GET(request: Request, { params }: { params: { sourceId: string } }) {
  try {
    const incomes = await getIncomeSources();
    const source = incomes.find(s => s.id === params.sourceId);

    if (!source) {
      return NextResponse.json({ error: 'Source not found' }, { status: 404 });
    }

    return NextResponse.json(source);
  } catch (error) {
    if (error instanceof Error && error.message.includes("Argument passed in must be a string of 12 bytes or a string of 24 hex characters")) {
        return NextResponse.json({ error: 'Invalid source ID format' }, { status: 400 });
    }
    console.error('API GET Error fetching income source:', error);
    return NextResponse.json({ error: 'Failed to fetch income source' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { sourceId: string } }) {
  try {
    const json = await request.json();
    const parsedData = updateSchema.parse(json);

    const updatedSource = await updateIncomeSource(params.sourceId, parsedData.name);
    
    return NextResponse.json(updatedSource, { status: 200 });
  } catch(error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input data', details: error.errors }, { status: 400 });
    }
    const errorMessage = (error instanceof Error) ? error.message : 'An unexpected error occurred';
    const statusCode = errorMessage.includes("already exists") ? 409 : 500;
    
    console.error('API PUT Error updating income source:', error);
    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}


export async function DELETE(request: Request, { params }: { params: { sourceId: string } }) {
  try {
    const success = await deleteIncomeSource(params.sourceId);

    if (!success) {
      return NextResponse.json({ error: 'Income source not found or failed to delete' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Income source deleted successfully' }, { status: 200 });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Argument passed in must be a string of 12 bytes or a string of 24 hex characters")) {
        return NextResponse.json({ error: 'Invalid source ID format' }, { status: 400 });
    }
    console.error('API DELETE Error deleting income source:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
