
import { z } from 'zod';
import { format, parseISO } from 'date-fns';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import { type BusinessNote, noteFormSchema, initialNotesData } from '@/lib/data/business-notes-data';

type NoteFromDb = Omit<BusinessNote, 'id' | 'date'> & { date: string };

async function getNotesCollection() {
  const client = await clientPromise;
  const db = client.db("biztrack-pro");
  return db.collection<Omit<NoteFromDb, '_id'>>('businessNotes');
}

async function seedNotes() {
    const notesCollection = await getNotesCollection();
    const count = await notesCollection.countDocuments();
    if (count === 0) {
        console.log("Seeding 'businessNotes' collection...");
        await notesCollection.insertMany(initialNotesData as any[]);
    }
}

export async function getNotes(): Promise<BusinessNote[]> {
    const collection = await getNotesCollection();
    await seedNotes();
    const notes = await collection.find({}).sort({ date: -1 }).toArray();

    return notes.map(s => ({
        ...s,
        id: s._id.toString(),
        date: parseISO(s.date),
    } as unknown as BusinessNote));
}

export async function addNote(noteData: z.infer<typeof noteFormSchema>): Promise<BusinessNote> {
    const collection = await getNotesCollection();
    
    const newNote = {
        date: format(noteData.date, 'yyyy-MM-dd'),
        title: noteData.title,
        content: noteData.content,
    };
    
    const result = await collection.insertOne(newNote as any);
    if (!result.insertedId) {
        throw new Error('Failed to insert new note.');
    }

    return {
        _id: result.insertedId,
        id: result.insertedId.toString(),
        date: noteData.date,
        title: noteData.title,
        content: noteData.content,
    };
}

export async function updateNote(id: string, noteData: Partial<z.infer<typeof noteFormSchema>>): Promise<BusinessNote | null> {
    const collection = await getNotesCollection();
    const _id = new ObjectId(id);
    
    const updateData: any = {};
    if (noteData.title) updateData.title = noteData.title;
    if (noteData.content) updateData.content = noteData.content;
    if (noteData.date) updateData.date = format(noteData.date, 'yyyy-MM-dd');

    const result = await collection.findOneAndUpdate(
        { _id },
        { $set: updateData },
        { returnDocument: 'after' }
    );
    
    if (!result) {
        return null;
    }

    const doc = result as unknown as NoteFromDb;

    return {
        _id: doc._id,
        id: doc._id.toString(),
        date: parseISO(doc.date),
        title: doc.title,
        content: doc.content,
    };
}

export async function deleteNote(id: string): Promise<boolean> {
    const collection = await getNotesCollection();
    const _id = new ObjectId(id);

    const result = await collection.deleteOne({ _id });
    return result.deletedCount === 1;
}
