/**
 * @fileoverview Service for managing user data for authentication.
 */
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export interface User {
    _id: ObjectId;
    username: string;
    passwordHash: string;
}

async function getUsersCollection() {
  const client = await clientPromise;
  const db = client.db("biztrack-pro");
  return db.collection<Omit<User, '_id'>>('users');
}

export async function findUserByUsername(username: string): Promise<User | null> {
    const collection = await getUsersCollection();
    const user = await collection.findOne({ username });
    if (!user) {
        return null;
    }
    return { ...user, _id: user._id as ObjectId };
}

export async function createUser(username: string, passwordHash: string): Promise<User> {
    const collection = await getUsersCollection();
    const existingUser = await collection.findOne({ username });
    if (existingUser) {
        throw new Error("A user with this username already exists.");
    }
    
    const newUserDocument = {
        username,
        passwordHash,
    };

    const result = await collection.insertOne(newUserDocument);
    if (!result.insertedId) {
        throw new Error('Failed to create new user.');
    }
    
    return {
        _id: result.insertedId,
        username,
        passwordHash,
    };
}