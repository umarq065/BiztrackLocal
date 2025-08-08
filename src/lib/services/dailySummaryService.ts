

import { z } from 'zod';
import { format, parseISO } from 'date-fns';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import { type DailySummary, summaryFormSchema } from '@/lib/data/daily-summary-data';

type DailySummaryFromDb = {
    _id: ObjectId;
    date: string;
    content: string;
}

async function getSummariesCollection() {
  const client = await clientPromise;
  const db = client.db("biztrack-pro");
  return db.collection<Omit<DailySummaryFromDb, '_id'>>('dailySummaries');
}

export async function getDailySummaries(): Promise<DailySummary[]> {
    const collection = await getSummariesCollection();
    const summaries = await collection.find({}).sort({ date: -1 }).toArray();

    return summaries.map(s => ({
        ...s,
        id: s._id.toString(),
        date: parseISO(s.date),
    } as unknown as DailySummary));
}

export async function addDailySummary(summaryData: z.infer<typeof summaryFormSchema> & { date: string }): Promise<DailySummary> {
    const collection = await getSummariesCollection();
    const { date, content } = summaryData;

    const existingSummary = await collection.findOne({ date });
    if (existingSummary) {
        throw new Error(`The date ${date} already has a summary. Please edit the existing one.`);
    }

    const newSummary = {
        date,
        content,
    };
    
    const result = await collection.insertOne(newSummary as any);
    if (!result.insertedId) {
        throw new Error('Failed to insert new summary.');
    }

    return {
        _id: result.insertedId,
        id: result.insertedId.toString(),
        date: parseISO(date),
        content,
    };
}

export async function updateDailySummary(id: string, summaryData: { content: string }): Promise<DailySummary | null> {
    const collection = await getSummariesCollection();
    const _id = new ObjectId(id);
    
    const result = await collection.findOneAndUpdate(
        { _id },
        { $set: { content: summaryData.content } },
        { returnDocument: 'after' }
    );
    
    if (!result) {
        return null;
    }

    return {
        _id: result._id,
        id: result._id.toString(),
        date: parseISO(result.date),
        content: result.content,
    };
}


export async function deleteDailySummary(id: string): Promise<boolean> {
    const collection = await getSummariesCollection();
    const _id = new ObjectId(id);

    const result = await collection.deleteOne({ _id });
    return result.deletedCount === 1;
}
