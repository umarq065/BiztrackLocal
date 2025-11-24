export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { importSingleOrder } from '@/lib/services/ordersService';
import { z } from 'zod';

const importSchema = z.object({
  source: z.string().min(1, 'Income source is required.'),
  orderData: z.object({
    date: z.string().min(1),
    'order id': z.string().min(1),
    'gig name': z.string().min(1),
    'client username': z.string().min(1),
    amount: z.string().min(1),
  }),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsedData = importSchema.safeParse(json);

    if (!parsedData.success) {
      return NextResponse.json({ error: 'Invalid input data', details: parsedData.error.errors }, { status: 400 });
    }

    const result = await importSingleOrder(parsedData.data.source, parsedData.data.orderData);
    
    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    if (error.message.includes('already exists')) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    console.error('API POST Error importing single order:', error);
    return NextResponse.json({ error: 'Failed to import order' }, { status: 500 });
  }
}

