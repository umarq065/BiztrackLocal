export const dynamic = 'force-dynamic';


import { NextResponse } from 'next/server';
import { addOrUpdateMessageData } from '@/lib/services/messagesService';
import { addMessageDataSchema } from '@/lib/data/messages-data';
import { z } from 'zod';

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsedJson = { ...json, date: new Date(json.date) };
    const parsedData = addMessageDataSchema.parse(parsedJson);

    const messageData = await addOrUpdateMessageData(parsedData);

    return NextResponse.json({ message: 'Data added successfully', messageData }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input data', details: error.errors }, { status: 400 });
    }
    console.error('API Error adding message data:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}


