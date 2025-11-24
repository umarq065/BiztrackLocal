export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { deleteOrdersByIds } from '@/lib/services/ordersService';
import { z } from 'zod';

const deleteSchema = z.object({
  orderIds: z.array(z.string()).min(1, 'At least one order ID is required.'),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsedData = deleteSchema.safeParse(json);

    if (!parsedData.success) {
      return NextResponse.json({ error: 'Invalid input data', details: parsedData.error.errors }, { status: 400 });
    }

    const { orderIds } = parsedData.data;
    const deletedCount = await deleteOrdersByIds(orderIds);

    return NextResponse.json({ message: `${deletedCount} orders deleted successfully.` }, { status: 200 });
  } catch (error: any) {
    console.error('API DELETE Error bulk deleting orders:', error);
    return NextResponse.json({ error: 'Failed to delete orders' }, { status: 500 });
  }
}

