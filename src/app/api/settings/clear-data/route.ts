export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { z } from 'zod';

const validCollections = [
    'businessNotes',
    'clients',
    'competitors',
    'dailySummaries',
    'expenseCategories',
    'expenses',
    'incomes',
    'monthlyTargets',
    'orders',
];

const clearDataSchema = z.object({
  collections: z.array(z.string()).refine(
    (collections) => collections.every(c => validCollections.includes(c)),
    { message: 'Invalid collection name provided.' }
  ),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsedData = clearDataSchema.safeParse(json);

    if (!parsedData.success) {
      return NextResponse.json({ error: 'Invalid input data', details: parsedData.error.errors }, { status: 400 });
    }

    const { collections } = parsedData.data;

    if (collections.length === 0) {
        return NextResponse.json({ message: 'No collections selected to clear.' }, { status: 200 });
    }

    const client = await clientPromise;
    const db = client.db("biztrack-pro");

    const deletionPromises = collections.map(collectionName => 
        db.collection(collectionName).deleteMany({})
    );

    const results = await Promise.all(deletionPromises);
    
    const deletedCounts = results.map((res, index) => ({
        collection: collections[index],
        count: res.deletedCount
    }));

    return NextResponse.json({ message: 'Data cleared successfully.', details: deletedCounts }, { status: 200 });

  } catch (error) {
    console.error('API Error clearing data:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json({ error: 'Failed to clear data', details: errorMessage }, { status: 500 });
  }
}

