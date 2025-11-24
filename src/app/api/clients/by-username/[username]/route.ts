
import { NextResponse } from 'next/server';
import { getClientByUsername, updateClient, deleteClient } from '@/lib/services/clientsService';
import { clientFormSchema } from '@/lib/data/clients-data';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

/**
 * @fileoverview API route for fetching, updating and deleting a specific client by username.
 * - GET: Fetches a client's details by username.
 * - PUT: Updates a client's details by their ID (fetched via username).
 * - DELETE: Removes a client from the database by their ID (fetched via username).
 */

export async function GET(request: Request, { params }: { params: { username: string } }) {
  try {
    const client = await getClientByUsername(params.username);
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }
    return NextResponse.json(client);
  } catch (error) {
    console.error('API GET Error fetching client by username:', error);
    return NextResponse.json({ error: 'Failed to fetch client' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { username: string } }) {
  try {
    const client = await getClientByUsername(params.username);
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const json = await request.json();
    const parsedData = clientFormSchema.parse(json);
    const updatedClient = await updateClient(client.id, parsedData);

    if (!updatedClient) {
      return NextResponse.json({ error: 'Client not found or update failed' }, { status: 404 });
    }

    return NextResponse.json(updatedClient, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input data', details: error.errors }, { status: 400 });
    }
    console.error('API PUT Error updating client by username:', error);
    return NextResponse.json({ error: 'Failed to update client' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { username: string } }) {
  try {
    const client = await getClientByUsername(params.username);
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const success = await deleteClient(client.id);
    if (!success) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Client deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('API DELETE Error deleting client by username:', error);
    return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 });
  }
}
