
/**
 * @fileoverview Service for managing order data.
 * This service abstracts the data access layer for orders.
 */
import { z } from 'zod';
import clientPromise from '@/lib/mongodb';
import { type Order, orderFormSchema, type OrderFormValues } from '@/lib/data/orders-data';
import { ObjectId } from 'mongodb';
import { format } from 'date-fns';

async function getOrdersCollection() {
  const client = await clientPromise;
  const db = client.db("biztrack-pro");
  return db.collection<Omit<Order, '_id'>>('orders');
}

/**
 * Seeds the database with initial data if the collection is empty.
 */
async function seedDatabase() {
    const ordersCollection = await getOrdersCollection();
    const count = await ordersCollection.countDocuments();
    if (count === 0) {
        console.log("Seeding 'orders' collection... No initial orders to seed.");
    }
}

/**
 * Retrieves all orders from the database.
 * @returns A promise that resolves to an array of all orders.
 */
export async function getOrders(): Promise<Order[]> {
  try {
    const ordersCollection = await getOrdersCollection();
    await seedDatabase();
    const orders = await ordersCollection.find({}).sort({ date: -1 }).toArray();
    
    return orders.map(order => ({
      ...order,
      _id: order._id,
      id: order.id,
    }));
  } catch (error) {
    console.error('Error fetching orders from DB:', error);
    return [];
  }
}

/**
 * Checks if an order ID already exists in the database.
 * @param orderId - The ID to check.
 * @returns A promise that resolves to true if the order exists, false otherwise.
 */
export async function checkOrderExists(orderId: string): Promise<boolean> {
  const ordersCollection = await getOrdersCollection();
  const count = await ordersCollection.countDocuments({ id: orderId });
  return count > 0;
}


/**
 * Adds a new order to the database.
 * @param orderData - The data for the new order, validated against the form schema.
 * @returns The newly created order object.
 */
export async function addOrder(orderData: OrderFormValues): Promise<Order> {
    const ordersCollection = await getOrdersCollection();

    let finalCancellationReasons: string[] | undefined = undefined;
    if (orderData.status === 'Cancelled') {
        const reasons = orderData.cancellationReasons || [];
        if (orderData.customCancellationReason && orderData.customCancellationReason.trim()) {
            reasons.push(orderData.customCancellationReason.trim());
        }
        if (reasons.length > 0) {
            finalCancellationReasons = reasons;
        }
    }

    const newOrderDocument: Omit<Order, '_id'> = {
        id: orderData.id,
        clientUsername: orderData.username,
        date: format(orderData.date, "yyyy-MM-dd"),
        amount: orderData.amount,
        source: orderData.source,
        gig: orderData.gig,
        status: orderData.status,
        rating: orderData.rating,
        cancellationReasons: finalCancellationReasons,
    };

    const result = await ordersCollection.insertOne(newOrderDocument as any);
    if (!result.insertedId) {
        throw new Error('Failed to insert new order.');
    }

    return {
        ...newOrderDocument,
        _id: result.insertedId,
    };
}

/**
 * Updates an existing order in the database by its ID.
 * @param orderId - The current ID of the order to update.
 * @param orderData - The new data for the order.
 * @returns The updated order object, or null if not found.
 */
export async function updateOrder(orderId: string, orderData: OrderFormValues): Promise<Order | null> {
    const ordersCollection = await getOrdersCollection();

    let finalCancellationReasons: string[] | undefined = undefined;
    if (orderData.status === 'Cancelled') {
        const reasons = orderData.cancellationReasons || [];
        if (orderData.customCancellationReason && orderData.customCancellationReason.trim()) {
            reasons.push(orderData.customCancellationReason.trim());
        }
        if (reasons.length > 0) {
            finalCancellationReasons = reasons;
        }
    }

    const updateData: Partial<Omit<Order, '_id'>> = {
        id: orderData.id,
        clientUsername: orderData.username,
        date: format(orderData.date, "yyyy-MM-dd"),
        amount: orderData.amount,
        source: orderData.source,
        gig: orderData.gig,
        status: orderData.status,
        rating: orderData.rating,
        cancellationReasons: finalCancellationReasons,
    };
    
    const result = await ordersCollection.findOneAndUpdate(
        { id: orderId },
        { $set: updateData },
        { returnDocument: 'after' }
    );

    if (!result) {
        return null;
    }

    return {
        ...result,
        id: result.id,
        _id: result._id,
    } as Order;
}

/**
 * Deletes an order from the database by its ID.
 * @param orderId - The ID of the order to delete.
 * @returns A boolean indicating whether the deletion was successful.
 */
export async function deleteOrder(orderId: string): Promise<boolean> {
    const ordersCollection = await getOrdersCollection();
    const result = await ordersCollection.deleteOne({ id: orderId });
    return result.deletedCount === 1;
}
