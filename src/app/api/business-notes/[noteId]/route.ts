
import { NextResponse } from 'next/server';
import { updateNote, deleteNote } from '@/lib/services/businessNotesService';
import { noteFormSchema } from '@/lib/data/business-notes-data';
import { z } from 'zod';
import { ObjectId } from 'mongodb';

const updateSchema = noteFormSchema.extend({
    date: z.date().optional(), 
});

export async function PUT(request: Request, { params }: { params: { noteId: string } }) {
  try {
    if (!ObjectId.isValid(params.noteId)) {
        return NextResponse.json({ error: 'Invalid note ID' }, { status: 400 });
    }
    const json = await request.json();
    const parsedData = updateSchema.parse({
        ...json,
        date: json.date ? new Date(json.date) : undefined,
    });

    const updatedNote = await updateNote(params.noteId, parsedData);

    if (!updatedNote) {
        return NextResponse.json({ error: 'Note not found or update failed' }, { status: 404 });
    }
    return NextResponse.json(updatedNote, { status: 200 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input data', details: error.errors }, { status: 400 });
    }
    console.error('API PUT Error updating note:', error);
    return NextResponse.json({ error: 'Failed to update note' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { noteId: string } }) {
  try {
    if (!ObjectId.isValid(params.noteId)) {
      return NextResponse.json({ error: 'Invalid note ID' }, { status: 400 });
    }
    const success = await deleteNote(params.noteId);
    if (!success) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Note deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('API DELETE Error deleting note:', error);
    return NextResponse.json({ error: 'Failed to delete note' }, { status: 500 });
  }
}
