/**
 * @fileoverview Service for managing client data.
 * This service abstracts the data access layer for clients.
 */
import clientPromise from '@/lib/mongodb';
import type { Client } from '@/lib/data/clients-data';

async function getClientsCollection() {
  const client = await clientPromise;
  const db = client.db("biztrack-pro");
  return db.collection<Client>('clients');
}

/**
 * Retrieves all clients from the database.
 * @returns A promise that resolves to an array of all clients.
 */
export async function getClients(): Promise<Client[]> {
  try {
    const clientsCollection = await getClientsCollection();
    // find({}).toArray() returns all documents in the collection
    const clients = await clientsCollection.find({}).toArray();
    
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
