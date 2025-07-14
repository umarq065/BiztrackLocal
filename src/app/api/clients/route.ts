import { NextResponse } from 'next/server';
import { getClients } from '@/lib/services/clientsService';

/**
 * @fileoverview API route for fetching clients.
 * - GET: Retrieves a list of all clients from the database.
 */

export async function GET() {
  try {
    const clients = await getClients();
    return NextResponse.json(clients);
  } catch (error) {
    console.error('API GET Error fetching clients:', error);
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 });
  }
}
