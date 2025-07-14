
import clientPromise, { getDbName } from '@/lib/mongodb';
import { z } from 'zod';

const settingsSchema = z.object({
  timezone: z.string().optional(),
});

type Settings = z.infer<typeof settingsSchema>;

const SETTINGS_ID = 'user_settings'; // Use a consistent ID for the settings document

async function getDb() {
  const client = await clientPromise;
  const dbName = getDbName();
  return client.db(dbName); 
}

export async function getSettings(): Promise<Settings> {
  try {
    const db = await getDb();
    const settings = await db.collection('settings').findOne({ _id: SETTINGS_ID });

    if (settings) {
      // Return what's in the DB, or an empty object.
      return {
        timezone: settings.timezone,
      };
    }
  } catch (error) {
    console.error('Error fetching settings from DB:', error);
    // On error, return an empty object to let the client handle defaults.
    return {};
  }

  // Return empty object if no settings are found.
  return {};
}

export async function updateSettings(newSettings: Partial<Settings>): Promise<void> {
  const db = await getDb();
  await db.collection('settings').updateOne(
    { _id: SETTINGS_ID },
    { $set: newSettings },
    { upsert: true } // Creates the document if it doesn't exist
  );
}
