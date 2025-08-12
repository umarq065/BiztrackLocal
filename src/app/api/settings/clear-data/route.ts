
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { z } from 'zod';

const VALID_COLLECTIONS = [
    "businessNotes",
    "clients",
    "competitors",
    "dailySummaries",
    "expenseCategories",
    "expenses",
    "incomes",
    "monthlyTargets",
    "orders",
];

const clearDataSchema = z.object({
  collections: z.array(z.string()).refine(
      (items) => items.every((item) => VALID_COLLECTIONS.includes(item)),
      { message: "Invalid collection name provided." }
  ).min(1, "At least one collection must be selected."),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsedData = clearDataSchema.safeParse(json);

    if (!parsedData.success) {
      return NextResponse.json({ error: 'Invalid input data', details: parsedData.error.errors }, { status: 400 });
    }

    const { collections } = parsedData.data;
    const client = await clientPromise;
    const db = client.db("biztrack-pro");

    const deletionPromises = collections.map(collectionName => {
        console.log(`Clearing collection: ${collectionName}`);
        const collection = db.collection(collectionName);
        return collection.deleteMany({});
    });
    
    await Promise.all(deletionPromises);

    return NextResponse.json({ message: `${collections.length} collection(s) cleared successfully.` }, { status: 200 });
  } catch (error) {
    console.error('API Clear Data Error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred while clearing data.' }, { status: 500 });
  }
}
