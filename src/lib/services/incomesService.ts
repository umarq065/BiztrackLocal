

/**
 * @fileoverview Service for managing income source data in MongoDB.
 */
import { z } from 'zod';
import { format } from 'date-fns';
import { ObjectId } from 'mongodb';
import { randomBytes } from 'crypto';

import clientPromise from '@/lib/mongodb';
import type { IncomeSource, Gig } from '@/lib/data/incomes-data';
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


async function getIncomesCollection() {
    const client = await clientPromise;
    const db = client.db("biztrack-pro");
    return db.collection<IncomeSource>('incomes');
}

async function getOrdersCollection() {
    const client = await clientPromise;
    const db = client.db("biztrack-pro");
    return db.collection('orders');
}

/**
 * Retrieves all income sources from the database.
 * @returns A promise that resolves to an array of all income sources.
 */
export async function getIncomeSources(): Promise<IncomeSource[]> {
    try {
        const incomesCollection = await getIncomesCollection();

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
        })),
    };

    const result = await incomesCollection.insertOne(newSource);
    if (!result.insertedId) {
        throw new Error('Failed to insert new income source.');
    }

    return newSource;
}

/**
 * Updates an income source name and cascades the change to all related orders.
 * @param sourceId The ID of the income source to update.
 * @param newName The new name for the income source.
 * @returns The updated income source object.
 */
export async function updateIncomeSource(sourceId: string, newName: string): Promise<IncomeSource | null> {
    const incomesCollection = await getIncomesCollection();
    const ordersCollection = await getOrdersCollection();
    const client = await clientPromise;
    const session = client.startSession();

    try {
        const source = await incomesCollection.findOne({ _id: new ObjectId(sourceId) });
        if (!source) {
            throw new Error("Income source not found.");
        }
        const oldName = source.name;

        // Check if new name already exists (case-insensitive) to prevent duplicates
        if (oldName.toLowerCase() !== newName.toLowerCase()) {
            const existingSource = await incomesCollection.findOne({ name: { $regex: `^${newName}$`, $options: 'i' } });
            if (existingSource) {
                throw new Error(`An income source with the name "${newName}" already exists.`);
            }
        }

        // Only proceed if the name has changed
        if (oldName !== newName) {
            // 1. Update all orders with the old source name
            await ordersCollection.updateMany(
                { source: oldName },
                { $set: { source: newName } }
            );

            // 2. Update the income source document itself
            await incomesCollection.updateOne(
                { _id: new ObjectId(sourceId) },
                { $set: { name: newName } }
            );
        }

        const result = await incomesCollection.findOne({ _id: new ObjectId(sourceId) });
        if (result) {
            return { ...result, id: result._id.toString() };
        }
        return null;
    } catch (error) {
        console.error("Error updating income source:", error);
        throw error;
    }
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
 * Updates an existing gig within an income source and cascades the name change to related orders.
 * @param sourceId The ID of the income source.
 * @param gigId The ID of the gig to update.
 * @param gigData The new data for the gig.
 * @returns The updated gig object.
 */
export async function updateGig(sourceId: string, gigId: string, gigData: EditGigFormValues): Promise<Gig | null> {
    const incomesCollection = await getIncomesCollection();
    const ordersCollection = await getOrdersCollection();
    const client = await clientPromise;
    const session = client.startSession();

    try {
        const source = await incomesCollection.findOne({ _id: new ObjectId(sourceId) });
        if (!source) {
            throw new Error("Income source not found.");
        }

        const oldGig = source.gigs.find(g => g.id === gigId);
        if (!oldGig) {
            throw new Error("Gig not found in the source.");
        }

        const oldGigName = oldGig.name;
        const newGigName = gigData.name;

        // Only proceed with order updates if the name has actually changed
        if (oldGigName !== newGigName) {
            await ordersCollection.updateMany(
                { source: source.name, gig: oldGigName },
                { $set: { gig: newGigName } }
            );
        }

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
            throw new Error("Failed to update gig in incomes collection.");
        }

        const updatedSource = await incomesCollection.findOne({ _id: new ObjectId(sourceId) });
        return updatedSource?.gigs.find(g => g.id === gigId) || null;

    } catch (error) {
        console.error("Error updating gig:", error);
        throw error;
    }
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
 * Merges multiple gigs into a main gig.
 * Updates all associated orders to point to the main gig and removes the merged gigs.
 * @param sourceId The ID of the income source.
 * @param mainGigId The ID of the gig to keep.
 * @param gigsToMergeIds The IDs of the gigs to merge into the main gig.
 * @returns A boolean indicating success.
 */
export async function mergeGigs(sourceId: string, mainGigId: string, gigsToMergeIds: string[]): Promise<boolean> {
    const incomesCollection = await getIncomesCollection();
    const ordersCollection = await getOrdersCollection();

    try {
        const source = await incomesCollection.findOne({ _id: new ObjectId(sourceId) });
        if (!source) {
            throw new Error("Income source not found.");
        }

        const mainGig = source.gigs.find(g => g.id === mainGigId);
        if (!mainGig) {
            throw new Error("Main gig not found.");
        }

        const gigsToMerge = source.gigs.filter(g => gigsToMergeIds.includes(g.id));
        if (gigsToMerge.length !== gigsToMergeIds.length) {
            throw new Error("One or more gigs to merge not found.");
        }

        const gigNamesToMerge = gigsToMerge.map(g => g.name);

        // 1. Update orders associated with the merged gigs
        await ordersCollection.updateMany(
            { source: source.name, gig: { $in: gigNamesToMerge } },
            { $set: { gig: mainGig.name } }
        );

        // 2. Remove the merged gigs from the income source
        await incomesCollection.updateOne(
            { _id: new ObjectId(sourceId) },
            { $pull: { gigs: { id: { $in: gigsToMergeIds } } } }
        );

        return true;
    } catch (error) {
        console.error("Error merging gigs:", error);
        throw error;
    }
}
