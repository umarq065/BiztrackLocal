export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getNotes, addNote } from '@/lib/services/businessNotesService';
import { noteFormSchema } from '@/lib/data/business-notes-data';
import { z } from 'zod';

export async function GET() {
  try {
    const notes = await getNotes();
    return NextResponse.json(notes);
  } catch (error) {
    console.error('API GET Error fetching notes:', error);
    return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsedData = noteFormSchema.parse({
        ...json,
        date: new Date(json.date),
    });

    const newNote = await addNote(parsedData);
    return NextResponse.json(newNote, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input data', details: error.errors }, { status: 400 });
    }
    console.error('API POST Error creating note:', error);
    return NextResponse.json({ error: 'Failed to create note' }, { status: 500 });
  }
}

