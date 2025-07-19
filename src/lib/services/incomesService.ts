
/**
 * @fileoverview Service for managing income source data in MongoDB.
 */
import { z } from 'zod';
import { format } from 'date-fns';
import { ObjectId } from 'mongodb';
import { randomBytes } from 'crypto';

import clientPromise from '@/lib/mongodb';
import type { IncomeSource, Gig, SourceDataPoint } from '@/lib/data/incomes-data';
import { initialIncomeSources, formSchema } from '@/lib/data/incomes-data';

const addGigFormSchema = z.object({
    name: z.string().min(2, { message: "Gig name must be at least 2 characters." }),
    date: z.date({ required_error: "A date for the gig is required." }),
});
type AddGigFormValues = z.infer<typeof addGigFormSchema>;

const editGigFormSchema = z.object({
    name: z.string().min(2, { message: "Gig name must be at least 2 characters." }),
    date: z.date({ required_error: "A date for the gig is required." }),
});
type EditGigFormValues = z.infer<typeof editGigFormSchema>;

const addGigDataFormSchema = z.object({
    date: z.date({ required_error: "A date is required." }),
    impressions: z.coerce.number().int().min(0),
    clicks: z.coerce.number().int().min(0),
});
type AddGigDataFormValues = z.infer<typeof addGigDataFormSchema>;

const addSourceDataFormSchema = z.object({
    date: z.date({ required_error: "A date is required." }),
    messages: z.coerce.number().int().min(0, { message: "Number of messages must be a non-negative number." }),
});
type AddSourceDataFormValues = z.infer<typeof addSourceDataFormSchema>;


async function getIncomesCollection() {
  const client = await clientPromise;
  const db = client.db("biztrack-pro");
  return db.collection<IncomeSource>('incomes');
}


/**
 * Retrieves all income sources from the database.
 * @returns A promise that resolves to an array of all income sources.
 */
export async function getIncomeSources(): Promise<IncomeSource[]> {
  try {
    const incomesCollection = await getIncomesCollection();
    // Clear existing data as requested
    if (process.env.NODE_ENV === 'development' && !process.env.DATA_CLEARED_INCOMES_V3) {
        console.log("Clearing 'incomes' collection...");
        await incomesCollection.deleteMany({});
        process.env.DATA_CLEARED_INCOMES_V3 = 'true';
    }
    const sources = await incomesCollection.find({}).sort({ _id: -1 }).toArray();
    
    return sources.map(source => ({
      ...source,
      id: source._id.toString(),
    }));
  } catch (error) {
    console.error('Error fetching income sources from DB:', error);
    return [];
  }
}

/**
 * Adds a new income source to the database.
 * @param sourceData - The data for the new income source, validated against the form schema.
 * @returns The newly created income source object.
 */
export async function addIncomeSource(sourceData: z.infer<typeof formSchema>): Promise<IncomeSource> {
  const incomesCollection = await getIncomesCollection();
  const _id = new ObjectId();
  
  const newSource: IncomeSource = {
    _id,
    id: _id.toString(),
    name: sourceData.sourceName,
    gigs: sourceData.gigs.map((gig) => ({
      id: randomBytes(8).toString('hex'), // Unique ID for the gig
      name: gig.name,
      date: format(new Date(gig.date), 'yyyy-MM-dd'),
      analytics: [],
    })),
    dataPoints: [],
  };

  const result = await incomesCollection.insertOne(newSource);
  if (!result.insertedId) {
      throw new Error('Failed to insert new income source.');
  }

  return newSource;
}

/**
 * Adds a new gig to a specific income source.
 * @param sourceId The ID of the income source to update.
 * @param gigData The data for the new gig.
 * @returns The newly created gig object.
 */
export async function addGigToSource(sourceId: string, gigData: AddGigFormValues): Promise<Gig> {
    const incomesCollection = await getIncomesCollection();

    const newGig: Gig = {
        id: randomBytes(8).toString('hex'),
        name: gigData.name,
        date: format(gigData.date, "yyyy-MM-dd"),
        analytics: [],
    };

    const result = await incomesCollection.updateOne(
        { _id: new ObjectId(sourceId) },
        { $push: { gigs: { $each: [newGig], $sort: { date: -1 } } } }
    );

    if (result.modifiedCount === 0) {
        throw new Error('Income source not found or failed to add gig.');
    }

    return newGig;
}

/**
 * Updates an existing gig within an income source.
 * @param sourceId The ID of the income source.
 * @param gigId The ID of the gig to update.
 * @param gigData The new data for the gig.
 * @returns The updated gig object.
 */
export async function updateGig(sourceId: string, gigId: string, gigData: EditGigFormValues): Promise<Gig | null> {
    const incomesCollection = await getIncomesCollection();

    const updatedGigFields: Partial<Gig> = {
        name: gigData.name,
        date: format(gigData.date, "yyyy-MM-dd"),
    };

    const updateQuery: Record<string, any> = {};
    for (const [key, value] of Object.entries(updatedGigFields)) {
        updateQuery[`gigs.$.${key}`] = value;
    }

    const result = await incomesCollection.updateOne(
        { _id: new ObjectId(sourceId), "gigs.id": gigId },
        { $set: updateQuery }
    );

    if (result.modifiedCount === 0) {
        return null;
    }

    const updatedSource = await incomesCollection.findOne({ _id: new ObjectId(sourceId) });
    return updatedSource?.gigs.find(g => g.id === gigId) || null;
}

/**
 * Deletes a gig from an income source.
 * @param sourceId The ID of the income source.
 * @param gigId The ID of the gig to delete.
 * @returns A boolean indicating success.
 */
export async function deleteGig(sourceId: string, gigId: string): Promise<boolean> {
    const incomesCollection = await getIncomesCollection();

    const result = await incomesCollection.updateOne(
        { _id: new ObjectId(sourceId) },
        { $pull: { gigs: { id: gigId } } }
    );

    return result.modifiedCount > 0;
}

/**
 * Deletes an entire income source.
 * @param sourceId The ID of the income source to delete.
 * @returns A boolean indicating success.
 */
export async function deleteIncomeSource(sourceId: string): Promise<boolean> {
    const incomesCollection = await getIncomesCollection();

    const result = await incomesCollection.deleteOne({ _id: new ObjectId(sourceId) });

    return result.deletedCount > 0;
}

/**
 * Adds or updates an analytics data point for a specific gig on a specific date.
 * @param sourceId The ID of the income source.
 * @param gigId The ID of the gig to update.
 * @param analyticsData The new analytics data point.
 * @returns The updated gig object.
 */
export async function addAnalyticsToGig(sourceId: string, gigId: string, analyticsData: AddGigDataFormValues): Promise<Gig | null> {
    const incomesCollection = await getIncomesCollection();
    const dateString = format(analyticsData.date, "yyyy-MM-dd");

    // First, try to update an existing entry for this date
    const updateResult = await incomesCollection.updateOne(
        { _id: new ObjectId(sourceId), "gigs.id": gigId, "gigs.analytics.date": dateString },
        { $set: { 
            "gigs.$[gig].analytics.$[analytic].impressions": analyticsData.impressions,
            "gigs.$[gig].analytics.$[analytic].clicks": analyticsData.clicks,
        } },
        { arrayFilters: [{ "gig.id": gigId }, { "analytic.date": dateString }] }
    );

    // If no document was updated, it means no entry for this date exists, so we add it
    if (updateResult.matchedCount === 0) {
        const newAnalyticPoint = { ...analyticsData, date: dateString };
        await incomesCollection.updateOne(
            { _id: new ObjectId(sourceId), "gigs.id": gigId },
            { $push: { "gigs.$.analytics": newAnalyticPoint } }
        );
    }

    const updatedSource = await incomesCollection.findOne({ _id: new ObjectId(sourceId) });
    return updatedSource?.gigs.find(g => g.id === gigId) || null;
}

/**
 * Adds or updates a general data point for an income source on a specific date.
 * @param sourceId The ID of the income source.
 * @param dataPoint The data point (date and messages).
 * @returns The updated income source.
 */
export async function addDataToSource(sourceId: string, dataPoint: AddSourceDataFormValues): Promise<IncomeSource | null> {
    const incomesCollection = await getIncomesCollection();
    const _id = new ObjectId(sourceId);
    const dateString = format(dataPoint.date, "yyyy-MM-dd");

    const newDataPoint = {
        date: dateString,
        messages: dataPoint.messages,
    };
    
    // First, try to update an existing entry for this date
    const updateResult = await incomesCollection.updateOne(
        { _id, "dataPoints.date": dateString },
        { $set: { "dataPoints.$.messages": dataPoint.messages } }
    );
    
    // If no document was updated, it means no entry for this date exists, so we add it
    if (updateResult.matchedCount === 0) {
        await incomesCollection.updateOne(
            { _id },
            { $push: { dataPoints: newDataPoint } }
        );
    }

    const updatedSource = await incomesCollection.findOne({ _id });
    
    if (!updatedSource) {
        return null;
    }
    
    return {
        ...updatedSource,
        id: updatedSource._id.toString(),
    } as IncomeSource;
}
