// This file is DEPRECATED and is no longer used.
// The initial user is now seeded automatically in the `userService.ts` file.
// You can safely delete this file.

import { hash } from 'bcryptjs';
import { createUser } from '../lib/services/userService';
import clientPromise from '../lib/mongodb';

async function main() {
  console.log("This script is deprecated. User seeding is now automatic.");
  console.log("You can safely delete this file: src/scripts/create-user.ts");

  // Keep the client connection logic to avoid breaking if someone runs it.
  try {
  } catch (error) {
  } finally {
    const client = await clientPromise;
    await client.close();
  }
}

main().catch(console.error);
