
import { NextResponse } from 'next/server';
import { getSettings, updateSettings } from '@/lib/services/settingsService';
import { z } from 'zod';

const settingsSchema = z.object({
  timezone: z.string().optional(),
  geminiApiKey: z.string().optional(),
});

export async function GET() {
  try {
    const settings = await getSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error('API GET Error:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsedData = settingsSchema.safeParse(json);

    if (!parsedData.success) {
      return NextResponse.json({ error: 'Invalid input data', details: parsedData.error.errors }, { status: 400 });
    }

    await updateSettings(parsedData.data);

    return NextResponse.json({ message: 'Settings updated successfully' }, { status: 200 });
  } catch (error) {
    console.error('API POST Error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
