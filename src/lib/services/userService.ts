/**
 * @fileoverview Service for managing user data for authentication.
 */
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { hash } from 'bcryptjs';

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

/**
 * Seeds the initial user if they don't exist.
 * This is a one-time operation for development setup.
 */
export async function seedInitialUser() {
    const collection = await getUsersCollection();
    const username = 'umarqureshi3';
    const password = 'Pakistan009$%';

    try {
        const userExists = await collection.findOne({ username });

        if (!userExists) {
            console.log(`Initial user "${username}" not found. Creating...`);
            const passwordHash = await hash(password, 10);
            await collection.insertOne({
                username,
                passwordHash,
            });
            console.log(`User "${username}" created successfully.`);
        }
    } catch (error) {
        console.error("Error during initial user seeding:", error);
    }
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
