export const dynamic = 'force-dynamic';


import { NextResponse } from 'next/server';
import { updateOrder, deleteOrder } from '@/lib/services/ordersService';
import { orderFormSchema } from '@/lib/data/orders-data';
import { z } from 'zod';

/**
 * @fileoverview API route for updating and deleting a specific order.
 * - PUT: Updates an order's details.
 * - DELETE: Removes an order from the database.
 */

export async function PUT(request: Request, { params }: { params: { orderId: string } }) {
  try {
    const json = await request.json();
     // The date comes in as a string, so we need to parse it before validation.
    const parsedJson = { ...json, date: new Date(json.date) };
    const parsedData = orderFormSchema.parse(parsedJson);

    // The order ID might have changed, so we use the param for lookup
    // and the body's ID for the new value if it exists.
    const updatedOrder = await updateOrder(params.orderId, parsedData);

    if (!updatedOrder) {
        return NextResponse.json({ error: 'Order not found or update failed' }, { status: 404 });
    }

    return NextResponse.json(updatedOrder, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input data', details: error.errors }, { status: 400 });
    }
    console.error('API PUT Error updating order:', error);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { orderId: string } }) {
  try {
    const success = await deleteOrder(params.orderId);
    if (!success) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Order deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('API DELETE Error deleting order:', error);
    return NextResponse.json({ error: 'Failed to delete order' }, { status: 500 });
  }
}
