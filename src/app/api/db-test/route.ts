
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

async function getClientsCollection() {
  const client = await clientPromise;
  const db = client.db('biztrack-pro');
  return db.collection('clients');
}

export async function GET() {
  try {
    const clientsCollection = await getClientsCollection();
    const count = await clientsCollection.countDocuments();
    return NextResponse.json({ status: 'Success', count });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'Failed',
        error: error.message || 'An unknown error occurred.'
      },
      { status: 500 }
    );
  }
}
