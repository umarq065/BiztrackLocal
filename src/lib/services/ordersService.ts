
/**
 * @fileoverview Service for managing order data.
 * This service abstracts the data access layer for orders.
 */
import { z } from 'zod';
import clientPromise from '@/lib/mongodb';
import { type Order, orderFormSchema, type OrderFormValues } from '@/lib/data/orders-data';
import { ObjectId } from 'mongodb';
import { format, parse } from 'date-fns';
import { getClientByUsername, addClient } from './clientsService';
import { addGigToSource } from './incomesService';

async function getOrdersCollection() {
  const client = await clientPromise;
  const db = client.db("biztrack-pro");
  return db.collection<Omit<Order, '_id'>>('orders');
}

async function getIncomesCollection() {
    const client = await clientPromise;
    return client.db("biztrack-pro").collection('incomes');
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

    // Check if client exists, if not, create one.
    const existingClient = await getClientByUsername(orderData.username);
    if (!existingClient) {
        await addClient({
            username: orderData.username,
            source: orderData.source,
            // You can add other default fields for auto-created clients if needed
            name: orderData.username, // Default name to username
            email: '',
            avatarUrl: '',
            socialLinks: [],
            notes: `Client auto-created from order ${orderData.id}.`,
            tags: 'auto-created',
            isVip: false,
            clientSince: orderData.date,
        });
    }


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


/**
 * Imports a single order from a CSV data object.
 * @param sourceName - The name of the income source for the order.
 * @param orderData - The parsed data from the CSV row.
 * @returns The created order object.
 */
export async function importSingleOrder(sourceName: string, orderData: Record<string, string>): Promise<{ order: Order }> {
    const ordersCollection = await getOrdersCollection();
    const incomesCollection = await getIncomesCollection();

    const orderId = orderData['order id'];
    const clientUsername = orderData['client username'];
    const gigName = orderData['gig name'];
    const dateStr = orderData['date'];
    const amount = parseFloat(orderData['amount']);
    
    // Attempt to parse multiple date formats
    let orderDate;
    try {
        orderDate = parse(dateStr, 'M/d/yyyy', new Date());
        if (isNaN(orderDate.getTime())) {
            orderDate = parse(dateStr, 'yyyy-MM-dd', new Date());
        }
        if (isNaN(orderDate.getTime())) {
            throw new Error('Invalid date format');
        }
    } catch (e) {
        throw new Error(`Invalid date format in CSV: "${dateStr}". Please use MM/DD/YYYY or YYYY-MM-DD.`);
    }

    // 1. Check if order ID exists
    const orderExists = await checkOrderExists(orderId);
    if (orderExists) {
        throw new Error(`Order with ID "${orderId}" already exists.`);
    }

    // 2. Check if income source exists
    const source = await incomesCollection.findOne({ name: sourceName });
    if (!source) {
        throw new Error(`Income source "${sourceName}" not found.`);
    }

    // 3. Check if gig exists in the source, if not, create it
    const gigExists = source.gigs.some(g => g.name.toLowerCase() === gigName.toLowerCase());
    if (!gigExists) {
        await addGigToSource(source.id, { name: gigName, date: orderDate });
    }

    // 4. Check if client exists, if not, create one
    const clientExists = await getClientByUsername(clientUsername);
    if (!clientExists) {
        await addClient({
            username: clientUsername,
            source: sourceName,
            name: clientUsername,
            email: '',
            avatarUrl: '',
            socialLinks: [],
            notes: `Client auto-created from single order import for order ${orderId}.`,
            tags: 'auto-created,single-import',
            isVip: false,
            clientSince: orderDate,
        });
    }

    // 5. Add the order
    const newOrder = await addOrder({
        id: orderId,
        date: orderDate,
        username: clientUsername,
        amount: amount,
        source: sourceName,
        gig: gigName,
        status: "In Progress", // Default status for imported orders
    });

    return { order: newOrder };
}
