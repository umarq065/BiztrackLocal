import { NextResponse } from 'next/server';
import { getClients, addClient } from '@/lib/services/clientsService';
import { clientFormSchema } from '@/lib/data/clients-data';
import { z } from 'zod';

/**
 * @fileoverview API route for fetching and creating clients.
 * - GET: Retrieves a list of all clients from the database.
 * - POST: Creates a new client in the database.
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

export async function POST(request: Request) {
    try {
        const json = await request.json();
        const parsedData = clientFormSchema.parse(json);
        const newClient = await addClient(parsedData);
        return NextResponse.json(newClient, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Invalid input data', details: error.errors }, { status: 400 });
        }
        console.error('API POST Error creating client:', error);
        return NextResponse.json({ error: 'Failed to create client' }, { status: 500 });
    }
}
