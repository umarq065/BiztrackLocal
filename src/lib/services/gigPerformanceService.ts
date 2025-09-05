

import { z } from 'zod';
import { format } from 'date-fns';
import { ObjectId } from 'mongodb';

import clientPromise from '@/lib/mongodb';
import type { GigPerformance } from '@/lib/data/gig-performance-data';
import { addGigPerformanceSchema } from '@/lib/data/gig-performance-data';

type PerformanceFormValues = z.infer<typeof addGigPerformanceSchema>;

async function getGigPerformancesCollection() {
  const client = await clientPromise;
  const db = client.db("biztrack-pro");
  return db.collection<Omit<GigPerformance, 'id'>>('gigPerformances');
}

export async function addOrUpdateGigPerformance(data: PerformanceFormValues): Promise<GigPerformance> {
    const collection = await getGigPerformancesCollection();
    const dateString = format(data.date, "yyyy-MM-dd");

    const result = await collection.findOneAndUpdate(
        { sourceId: data.sourceId, gigId: data.gigId, date: dateString },
        { $set: { 
            impressions: data.impressions,
            clicks: data.clicks
        } },
        { upsert: true, returnDocument: 'after' }
    );
    
    if (!result) {
        // This should theoretically not be hit due to upsert: true, but as a fallback
        const newDoc = await collection.findOne({ sourceId: data.sourceId, gigId: data.gigId, date: dateString });
        if (!newDoc) throw new Error("Failed to create or update gig performance data.");
        return { ...newDoc, id: newDoc._id.toString() };
    }

    return {
        ...result,
        id: result._id.toString(),
    };
}
