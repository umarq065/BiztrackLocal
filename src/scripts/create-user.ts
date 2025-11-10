// To run this script: npx tsx src/scripts/create-user.ts

import { hash } from 'bcryptjs';
import { createUser } from '../lib/services/userService';
import clientPromise from '../lib/mongodb';

async function main() {
  const username = 'umarqureshi3';
  const password = 'Pakistan009$%';
  
  console.log(`Attempting to create user: ${username}`);

  try {
    const passwordHash = await hash(password, 10);
    console.log('Password hashed successfully.');

    const newUser = await createUser(username, passwordHash);
    console.log('User created successfully!', newUser);
    
  } catch (error) {
    console.error('Error creating user:', (error as Error).message);
  } finally {
    // Ensure the client will close when you finish/error
    const client = await clientPromise;
    await client.close();
    console.log('MongoDB connection closed.');
  }
}

main().catch(console.error);
