
import { NextResponse } from 'next/server';
import { getOrdersList, addOrder } from '@/lib/services/ordersService';
import { orderFormSchema } from '@/lib/data/orders-data';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

/**
 * @fileoverview API route for fetching and creating orders.
 * - GET: Retrieves a list of all orders from the database.
 * - POST: Creates a new order in the database.
 */

export async function GET() {
  try {
    const orders = await getOrdersList();
    return NextResponse.json(orders);
  } catch (error) {
    console.error('API GET Error fetching orders:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    // The date comes in as a string, so we need to parse it before validation.
    const parsedJson = { ...json, date: new Date(json.date) };
    const parsedData = orderFormSchema.parse(parsedJson);

    const newOrder = await addOrder(parsedData);
    return NextResponse.json(newOrder, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input data', details: error.errors }, { status: 400 });
    }
    console.error('API POST Error creating order:', error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}
