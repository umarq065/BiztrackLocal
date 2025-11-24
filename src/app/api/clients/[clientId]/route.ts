export const dynamic = 'force-dynamic';


import { NextResponse } from 'next/server';
import { updateClient, deleteClient } from '@/lib/services/clientsService';
import { clientFormSchema } from '@/lib/data/clients-data';
import { z } from 'zod';
import { ObjectId } from 'mongodb';

/**
 * @fileoverview API route for updating and deleting a specific client.
 * - PUT: Updates a client's details.
 * - DELETE: Removes a client from the database.
 */

export async function PUT(request: Request, { params }: { params: { clientId: string } }) {
  try {
    if (!ObjectId.isValid(params.clientId)) {
      return NextResponse.json({ error: 'Invalid client ID' }, { status: 400 });
    }

    const json = await request.json();
    const parsedData = clientFormSchema.parse(json);
    const updatedClient = await updateClient(params.clientId, parsedData);

    if (!updatedClient) {
        return NextResponse.json({ error: 'Client not found or update failed' }, { status: 404 });
    }

    return NextResponse.json(updatedClient, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input data', details: error.errors }, { status: 400 });
    }
    console.error('API PUT Error updating client:', error);
    return NextResponse.json({ error: 'Failed to update client' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { clientId: string } }) {
  try {
     if (!ObjectId.isValid(params.clientId)) {
      return NextResponse.json({ error: 'Invalid client ID' }, { status: 400 });
    }

    const success = await deleteClient(params.clientId);
    if (!success) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Client deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('API DELETE Error deleting client:', error);
    return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 });
  }
}
