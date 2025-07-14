/**
 * @fileoverview Service for managing client data.
 * This service abstracts the data access layer for clients.
 */
import { z } from 'zod';
import clientPromise from '@/lib/mongodb';
import { type Client, type ClientFormValues, initialClients } from '@/lib/data/clients-data';
import { ObjectId } from 'mongodb';
import { format } from 'date-fns';

async function getClientsCollection() {
  const client = await clientPromise;
  const db = client.db("biztrack-pro");
  return db.collection<Client>('clients');
}

/**
 * Seeds the database with initial data if the collection is empty.
 */
async function seedDatabase() {
    const clientsCollection = await getClientsCollection();
    const count = await clientsCollection.countDocuments();
    if (count === 0) {
        console.log("Seeding 'clients' collection...");
        const clientsToInsert = initialClients.map(client => ({
            ...client,
            _id: new ObjectId(),
        }));
        await clientsCollection.insertMany(clientsToInsert as any[]);
    }
}

/**
 * Retrieves all clients from the database.
 * @returns A promise that resolves to an array of all clients.
 */
export async function getClients(): Promise<Client[]> {
  try {
    const clientsCollection = await getClientsCollection();
    await seedDatabase();
    // find({}).toArray() returns all documents in the collection
    const clients = await clientsCollection.find({}).sort({ _id: -1 }).toArray();
    
    // The _id from MongoDB is an ObjectId, which is not directly serializable for Next.js API routes.
    // We map it to a simple string.
    return clients.map(client => ({
      ...client,
      id: client._id.toString(),
    }));
  } catch (error) {
    console.error('Error fetching clients from DB:', error);
    // In case of an error, return an empty array.
    return [];
  }
}

/**
 * Adds a new client to the database.
 * @param clientData - The data for the new client, validated against the form schema.
 * @returns The newly created client object.
 */
export async function addClient(clientData: ClientFormValues): Promise<Client> {
    const clientsCollection = await getClientsCollection();
    const _id = new ObjectId();

    const newClient: Omit<Client, 'id'> = {
        _id,
        ...clientData,
        tags: clientData.tags ? clientData.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        clientType: 'New',
        clientSince: format(new Date(), 'yyyy-MM-dd'),
        totalOrders: 0,
        totalEarning: 0,
        lastOrder: 'N/A',
    };

    const result = await clientsCollection.insertOne(newClient as any);
    if (!result.insertedId) {
        throw new Error('Failed to insert new client.');
    }

    return {
        ...newClient,
        id: _id.toString(),
    };
}
