import { z } from 'zod';
import { format } from 'date-fns';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import { type DailySummary, type SummaryFormValues } from '@/lib/data/daily-summary-data';

async function getSummariesCollection() {
  const client = await clientPromise;
  const db = client.db("biztrack-pro");
  return db.collection<Omit<DailySummary, 'id'>>('dailySummaries');
}

export async function getDailySummaries(): Promise<DailySummary[]> {
  const summariesCollection = await getSummariesCollection();
  const summaries = await summariesCollection.find({}).sort({ date: -1 }).toArray();
  return summaries.map(summary => ({
     ...summary, 
     id: summary._id.toString(),
     date: summary.date,
    }));
}

export async function addDailySummary(summaryData: SummaryFormValues): Promise<DailySummary> {
  const summariesCollection = await getSummariesCollection();
  const dateStr = format(summaryData.date, 'yyyy-MM-dd');

  const newSummary = {
    _id: new ObjectId(),
    date: dateStr,
    content: summaryData.content,
  };

  const result = await summariesCollection.insertOne(newSummary);
  if (!result.insertedId) {
    throw new Error('Failed to insert new summary.');
  }

  return {
    ...newSummary,
    id: result.insertedId.toString(),
  };
}

export async function updateDailySummary(summaryId: string, summaryData: SummaryFormValues): Promise<DailySummary | null> {
  const summariesCollection = await getSummariesCollection();
  const _id = new ObjectId(summaryId);
  
  const updateData = {
    content: summaryData.content,
  };

  const result = await summariesCollection.findOneAndUpdate(
    { _id },
    { $set: updateData },
    { returnDocument: 'after' }
  );

  if (!result) return null;
  return { ...result, id: result._id.toString() } as DailySummary;
}

export async function deleteDailySummary(summaryId: string): Promise<boolean> {
  const summariesCollection = await getSummariesCollection();
  const _id = new ObjectId(summaryId);
  const result = await summariesCollection.deleteOne({ _id });
  return result.deletedCount === 1;
}
