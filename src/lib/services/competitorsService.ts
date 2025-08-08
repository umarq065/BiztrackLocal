

import { z } from 'zod';
import { format, parseISO, toZonedTime } from 'date-fns';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import { type Competitor, type CompetitorFormValues, competitorFormSchema, type CompetitorDataFormValues } from '@/lib/data/competitors-data';

type CompetitorFromDb = Omit<Competitor, 'id' | 'workingSince'> & { workingSince?: string };

async function getCompetitorsCollection() {
  const client = await clientPromise;
  const db = client.db("biztrack-pro");
  return db.collection<Omit<CompetitorFromDb, '_id'>>('competitors');
}

export async function getCompetitors(): Promise<Competitor[]> {
    const collection = await getCompetitorsCollection();
    const competitors = await collection.find({}).toArray();
    return competitors.map(c => ({
        ...c,
        id: c._id.toString(),
        workingSince: c.workingSince ? new Date(c.workingSince) : undefined,
    } as Competitor));
}

export async function addCompetitor(data: CompetitorFormValues): Promise<Competitor> {
    const collection = await getCompetitorsCollection();
    
    const newCompetitor = {
      ...data,
      workingSince: data.workingSince ? format(data.workingSince, 'yyyy-MM-dd') : undefined,
      monthlyData: [],
    };
    
    const result = await collection.insertOne(newCompetitor as any);
    if (!result.insertedId) {
        throw new Error('Failed to insert new competitor.');
    }

    return {
        _id: result.insertedId,
        id: result.insertedId.toString(),
        ...newCompetitor,
        workingSince: newCompetitor.workingSince ? parseISO(newCompetitor.workingSince) : undefined,
    };
}


export async function updateCompetitor(id: string, data: CompetitorFormValues): Promise<Competitor | null> {
    const collection = await getCompetitorsCollection();
    const _id = new ObjectId(id);

    const updateData = {
        ...data,
        workingSince: data.workingSince ? format(data.workingSince, 'yyyy-MM-dd') : undefined,
    }
    
    const result = await collection.findOneAndUpdate(
        { _id },
        { $set: updateData },
        { returnDocument: 'after' }
    );
    
    if (!result) return null;

    const doc = result as unknown as CompetitorFromDb;

    return {
        ...doc,
        id: doc._id.toString(),
        workingSince: doc.workingSince ? parseISO(doc.workingSince) : undefined
    };
}

export async function deleteCompetitor(id: string): Promise<boolean> {
    const collection = await getCompetitorsCollection();
    const _id = new ObjectId(id);
    const result = await collection.deleteOne({ _id });
    return result.deletedCount === 1;
}

export async function addCompetitorData(id: string, data: CompetitorDataFormValues): Promise<Competitor | null> {
    const collection = await getCompetitorsCollection();
    const _id = new ObjectId(id);
    
    const newMonthlyData = {
        month: parseInt(data.month, 10),
        year: parseInt(data.year, 10),
        orders: data.orders,
        reviews: data.reviews,
    };

    const competitor = await collection.findOne({ _id });
    if (!competitor) return null;

    const existingDataIndex = (competitor.monthlyData || []).findIndex(
        d => d.month === newMonthlyData.month && d.year === newMonthlyData.year
    );

    let updateQuery;
    if (existingDataIndex > -1) {
      // Update existing monthly data
      const oldData = competitor.monthlyData![existingDataIndex];
      const reviewsDiff = newMonthlyData.reviews - oldData.reviews;
      const ordersDiff = newMonthlyData.orders - oldData.orders;
      
      updateQuery = {
          $set: { [`monthlyData.${existingDataIndex}`]: newMonthlyData },
          $inc: {
              reviewsCount: reviewsDiff,
              totalOrders: ordersDiff,
          }
      };
    } else {
      // Add new monthly data
      updateQuery = {
          $push: { monthlyData: newMonthlyData },
          $inc: {
              reviewsCount: newMonthlyData.reviews,
              totalOrders: newMonthlyData.orders,
          }
      };
    }
    
    const result = await collection.findOneAndUpdate(
        { _id },
        updateQuery,
        { returnDocument: 'after' }
    );

    if (!result) return null;
    
    const doc = result as unknown as CompetitorFromDb;

    return {
        ...doc,
        id: doc._id.toString(),
        workingSince: doc.workingSince ? parseISO(doc.workingSince) : undefined
    };
}
