
/**
 * @fileoverview Service for managing order data.
 * This service abstracts the data access layer for orders.
 */
import { z } from 'zod';
import clientPromise from '@/lib/mongodb';
import { type Order, orderFormSchema, type OrderFormValues } from '@/lib/data/orders-data';
import { ObjectId } from 'mongodb';
import { format, parse } from 'date-fns';
import { getClientByUsername, addClient, getClients } from './clientsService';
import { addGigToSource, getIncomeSources } from './incomesService';
import Papa from 'papaparse';

async function getOrdersCollection() {
  const client = await clientPromise;
  const db = client.db("biztrack-pro");
  return db.collection<Omit<Order, '_id'>>('orders');
}

/**
 * Retrieves all orders from the database.
 * @returns A promise that resolves to an array of all orders.
 */
export async function getOrders(): Promise<Order[]> {
  try {
    const ordersCollection = await getOrdersCollection();
    if (process.env.NODE_ENV === 'development' && !process.env.DATA_CLEARED_ORDERS_V3) {
        console.log("Clearing 'orders' collection...");
        await ordersCollection.deleteMany({});
        process.env.DATA_CLEARED_ORDERS_V3 = 'true';
    }
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
            name: orderData.username,
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
    const incomesCollection = (await clientPromise).db("biztrack-pro").collection('incomes');

    const orderId = orderData['order id'];
    const clientUsername = orderData['client username'];
    const gigName = orderData['gig name'];
    const dateStr = orderData['date'];
    const amount = parseFloat(orderData['amount']);
    const status = (orderData['status'] || 'In Progress') as Order['status'];

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
        await addGigToSource(source._id.toString(), { name: gigName, date: orderDate });
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
        status: status,
    });

    return { order: newOrder };
}


/**
 * Imports multiple orders from a CSV string.
 * @param sourceName - The name of the income source for the orders.
 * @param csvContent - The string content of the CSV file.
 * @returns An object with counts of imported and skipped orders.
 */
export async function importBulkOrders(sourceName: string, csvContent: string): Promise<{ importedCount: number; updatedCount: number; skippedCount: number }> {
    const ordersCollection = await getOrdersCollection();
    const incomesCollection = (await clientPromise).db("biztrack-pro").collection('incomes');
    const clientCollection = (await clientPromise).db("biztrack-pro").collection('clients');

    // Parse CSV
    const parsed = Papa.parse(csvContent, { header: true, skipEmptyLines: true });
    if (parsed.errors.length) {
        console.error("CSV Parsing Errors:", parsed.errors);
        throw new Error("Failed to parse CSV file. Please check the format.");
    }

    const rows = parsed.data as Record<string, string>[];
    let importedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    // Check if income source exists
    const source = await incomesCollection.findOne({ name: sourceName });
    if (!source) {
        throw new Error(`Income source "${sourceName}" not found.`);
    }
    const sourceId = source._id.toString();

    // Get existing data to avoid repeated DB calls inside the loop
    const existingOrdersCursor = await ordersCollection.find({}, { projection: { id: 1, _id: 0 } });
    const existingOrderIds = new Set((await existingOrdersCursor.toArray()).map(o => o.id));
    
    const existingClientsCursor = await clientCollection.find({}, { projection: { username: 1, _id: 0 } });
    const existingClients = new Set((await existingClientsCursor.toArray()).map(c => c.username));
    let sourceGigs = new Map(source.gigs.map(g => [g.name.toLowerCase(), g]));

    const newClientsToCreate: any[] = [];
    const newGigsToCreate: any[] = [];
    const newOrdersToCreate: any[] = [];
    const ordersToUpdate: { id: string; amount: number }[] = [];

    for (const row of rows) {
        // Standardize headers
        const orderData = Object.fromEntries(Object.entries(row).map(([key, value]) => [key.trim().toLowerCase(), value]));
        
        const orderId = orderData['order id'];
        const clientUsername = orderData['client username'];
        const gigName = orderData['gig name'];
        const amountStr = orderData['amount'];
        const type = orderData['type'];
        
        if (!orderId || !clientUsername || !gigName || !orderData['date'] || !amountStr) {
            console.warn("Skipping row due to missing required fields:", row);
            skippedCount++;
            continue;
        }

        const amount = parseFloat(amountStr);
        if (isNaN(amount)) {
            console.warn(`Skipping order ${orderId} due to invalid amount: ${amountStr}`);
            skippedCount++;
            continue;
        }

        let orderDate;
        try {
            orderDate = parse(orderData['date'], 'M/d/yyyy', new Date());
            if (isNaN(orderDate.getTime())) orderDate = parse(orderData['date'], 'yyyy-MM-dd', new Date());
            if (isNaN(orderDate.getTime())) throw new Error();
        } catch (e) {
            console.warn(`Skipping order ${orderId} due to invalid date format: ${orderData['date']}`);
            skippedCount++;
            continue;
        }

        if (existingOrderIds.has(orderId)) {
            ordersToUpdate.push({ id: orderId, amount: amount });
            updatedCount++;
            continue;
        }
        
        // Add client to creation list if new
        if (!existingClients.has(clientUsername) && !newClientsToCreate.some(c => c.username === clientUsername)) {
            newClientsToCreate.push({
                username: clientUsername,
                source: sourceName,
                name: clientUsername,
                email: '',
                avatarUrl: '',
                socialLinks: [],
                notes: `Client auto-created from bulk import.`,
                tags: ['auto-created', 'bulk-import'],
                isVip: false,
                clientSince: orderDate
            });
            existingClients.add(clientUsername);
        }

        // Add gig to creation list if new
        const gigNameLower = gigName.toLowerCase();
        if (!sourceGigs.has(gigNameLower) && !newGigsToCreate.some(g => g.name.toLowerCase() === gigNameLower)) {
             const newGig = { name: gigName, date: orderDate };
             newGigsToCreate.push(newGig);
             sourceGigs.set(gigNameLower, { id: '', name: gigName, date: format(orderDate, 'yyyy-MM-dd') });
        }
        
        let status: Order['status'] = 'In Progress';
        if (type?.toLowerCase() === 'order') {
            status = 'Completed';
        } else if (type?.toLowerCase() === 'cancellation') {
            status = 'Cancelled';
        }

        const newOrder = {
            id: orderId,
            clientUsername: clientUsername,
            date: format(orderDate, "yyyy-MM-dd"),
            amount: amount,
            source: sourceName,
            gig: gigName,
            status: status,
        };
        newOrdersToCreate.push(newOrder);
        existingOrderIds.add(orderId);
        importedCount++;
    }

    // --- Perform batched database operations ---
    if (newClientsToCreate.length > 0) {
        const clientDocsToInsert = newClientsToCreate.map(c => ({
            ...c,
            clientSince: format(c.clientSince, 'yyyy-MM-dd')
        }));
        await clientCollection.insertMany(clientDocsToInsert);
    }

    if (newGigsToCreate.length > 0) {
        for(const gig of newGigsToCreate) {
            await addGigToSource(sourceId, gig);
        }
    }

    if (newOrdersToCreate.length > 0) {
        await ordersCollection.insertMany(newOrdersToCreate as any);
    }

    if (ordersToUpdate.length > 0) {
        const bulkUpdateOps = ordersToUpdate.map(op => ({
            updateOne: {
                filter: { id: op.id },
                update: { $inc: { amount: op.amount } }
            }
        }));
        await ordersCollection.bulkWrite(bulkUpdateOps);
    }
    
    return { importedCount, updatedCount, skippedCount };
}
