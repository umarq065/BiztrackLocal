
import { NextResponse } from 'next/server';
import { importBulkOrders } from '@/lib/services/ordersService';
import { z } from 'zod';

const importSchema = z.object({
  source: z.string().min(1, 'Income source is required.'),
  csvContent: z.string().min(1, 'CSV content is required.'),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsedData = importSchema.safeParse(json);

    if (!parsedData.success) {
      return NextResponse.json({ error: 'Invalid input data', details: parsedData.error.errors }, { status: 400 });
    }

    const result = await importBulkOrders(parsedData.data.source, parsedData.data.csvContent);
    
    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error('API POST Error importing bulk orders:', error);
    return NextResponse.json({ error: error.message || 'Failed to import orders' }, { status: 500 });
  }
}
