export const dynamic = 'force-dynamic';


import { NextResponse } from 'next/server';
import { checkOrderExists } from '@/lib/services/ordersService';

/**
 * @fileoverview API route for checking if an order ID already exists.
 * - GET: Checks for the existence of an order by its ID.
 */

export async function GET(request: Request, { params }: { params: { orderId: string } }) {
  try {
    const { orderId } = params;
    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const exists = await checkOrderExists(orderId);
    return NextResponse.json({ exists });
  } catch (error) {
    console.error('API GET Error checking order existence:', error);
    return NextResponse.json({ error: 'Failed to check order existence' }, { status: 500 });
  }
}
