
/**
 * @fileoverview Service for fetching and processing analytics data.
 */
import { ObjectId } from 'mongodb';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import clientPromise from '@/lib/mongodb';
import type { IncomeSource } from '@/lib/data/incomes-data';

// Helper function to get database collections
async function getIncomesCollection() {
    const client = await clientPromise;
    return client.db("biztrack-pro").collection<IncomeSource>('incomes');
}

async function getOrdersCollection() {
    const client = await clientPromise;
    return client.db("biztrack-pro").collection('orders');
}

// Interfaces for Analytics Data
export interface TimeSeriesDataPoint {
    date: string;
    impressions: number;
    clicks: number;
    orders: number;
    revenue: number;
    messages: number;
    ctr: number;
    prevImpressions: number;
    prevClicks: number;
    prevOrders: number;
    prevRevenue: number;
    prevMessages: number;
    prevCtr: number;
}

export interface Totals {
    impressions: number;
    clicks: number;
    orders: number;
    revenue: number;
    messages: number;
    ctr: number;
    conversionRate: number;
}

export interface GigAnalyticsData {
    gigId: string;
    gigName: string;
    sourceName: string;
    sourceTotalOrders: number;
    timeSeries: TimeSeriesDataPoint[];
    totals: Totals;
    previousTotals: Omit<Totals, 'ctr' | 'conversionRate'> & { ctr: number };
}

export interface SourceAnalyticsData {
    sourceId: string;
    sourceName: string;
    gigs: { id: string; name: string; date: string; messages?: number }[];
    timeSeries: TimeSeriesDataPoint[];
    totals: Omit<Totals, 'conversionRate'>;
    previousTotals: Omit<Totals, 'conversionRate'>;
}

// Shared data processing function
async function processAnalytics(
    dateRange: { from: Date; to: Date },
    filter: { sourceId?: string; gigId?: string }
) {
    const incomesCollection = await getIncomesCollection();
    const ordersCollection = await getOrdersCollection();

    const { from, to } = dateRange;
    const duration = to.getTime() - from.getTime();
    const prevTo = new Date(from.getTime() - 1);
    const prevFrom = new Date(prevTo.getTime() - duration);

    const dateArray = eachDayOfInterval({ start: from, end: to }).map(d => format(d, 'yyyy-MM-dd'));
    const prevDateArray = eachDayOfInterval({ start: prevFrom, end: prevTo }).map(d => format(d, 'yyyy-MM-dd'));
    
    // Find the relevant source/gig
    const source = await incomesCollection.findOne({ 
        ...(filter.sourceId && { _id: new ObjectId(filter.sourceId) }),
        ...(filter.gigId && { "gigs.id": filter.gigId })
    });
    if (!source) return null;

    const gigNames = filter.gigId 
        ? [source.gigs.find(g => g.id === filter.gigId)?.name] 
        : source.gigs.map(g => g.name);

    // Aggregate orders for the periods
    const getOrdersForPeriod = async (start: Date, end: Date) => {
        return ordersCollection.aggregate([
            { $match: { 
                source: source.name,
                ...(gigNames.length > 0 && { gig: { $in: gigNames } }),
                date: { $gte: format(start, 'yyyy-MM-dd'), $lte: format(end, 'yyyy-MM-dd') },
                status: { $ne: 'Cancelled' }
            }},
            { $group: {
                _id: "$date",
                orders: { $sum: 1 },
                revenue: { $sum: "$amount" }
            }}
        ]).toArray();
    }
    
    const [currentOrders, previousOrders] = await Promise.all([
        getOrdersForPeriod(from, to),
        getOrdersForPeriod(prevFrom, prevTo)
    ]);

    const ordersMap = new Map(currentOrders.map(o => [o._id, o]));
    const prevOrdersMap = new Map(previousOrders.map(o => [o._id, o]));

    // Aggregate analytics data from the source document
    const aggregateSourceData = (dates: string[]) => {
        const dataMap = new Map<string, { impressions: number; clicks: number; messages: number }>();
        dates.forEach(date => dataMap.set(date, { impressions: 0, clicks: 0, messages: 0 }));

        source.gigs.forEach(gig => {
            if (filter.gigId && gig.id !== filter.gigId) return;
            (gig.analytics || []).forEach(analytic => {
                if (dataMap.has(analytic.date)) {
                    const existing = dataMap.get(analytic.date)!;
                    existing.impressions += analytic.impressions;
                    existing.clicks += analytic.clicks;
                }
            });
        });
        (source.dataPoints || []).forEach(dp => {
             if (dataMap.has(dp.date)) {
                dataMap.get(dp.date)!.messages += dp.messages;
            }
        });
        return dataMap;
    };

    const currentSourceMap = aggregateSourceData(dateArray);
    const prevSourceMap = aggregateSourceData(prevDateArray);

    // Combine all data into a time series
    const timeSeries = dateArray.map((date, i) => {
        const prevDate = prevDateArray[i];
        const currentData = currentSourceMap.get(date) || { impressions: 0, clicks: 0, messages: 0 };
        const prevData = prevSourceMap.get(prevDate) || { impressions: 0, clicks: 0, messages: 0 };
        const orderData = ordersMap.get(date) || { orders: 0, revenue: 0 };
        const prevOrderData = prevOrdersMap.get(prevDate) || { orders: 0, revenue: 0 };

        return {
            date,
            impressions: currentData.impressions,
            clicks: currentData.clicks,
            orders: orderData.orders,
            revenue: orderData.revenue,
            messages: currentData.messages,
            ctr: currentData.impressions > 0 ? (currentData.clicks / currentData.impressions) * 100 : 0,
            prevImpressions: prevData.impressions,
            prevClicks: prevData.clicks,
            prevOrders: prevOrderData.orders,
            prevRevenue: prevOrderData.revenue,
            prevMessages: prevData.messages,
            prevCtr: prevData.impressions > 0 ? (prevData.clicks / prevData.impressions) * 100 : 0,
        };
    });

    const calculateTotals = (series: TimeSeriesDataPoint[]) => {
        const totals = series.reduce((acc, curr) => ({
            impressions: acc.impressions + curr.impressions,
            clicks: acc.clicks + curr.clicks,
            orders: acc.orders + curr.orders,
            revenue: acc.revenue + curr.revenue,
            messages: acc.messages + curr.messages,
        }), { impressions: 0, clicks: 0, orders: 0, revenue: 0, messages: 0 });
        
        return {
            ...totals,
            ctr: totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0,
            conversionRate: totals.impressions > 0 ? (totals.orders / totals.impressions) * 100 : 0,
        };
    };
    
    const calculatePreviousTotals = (series: TimeSeriesDataPoint[]) => {
        const totals = series.reduce((acc, curr) => ({
            impressions: acc.impressions + curr.prevImpressions,
            clicks: acc.clicks + curr.prevClicks,
            orders: acc.orders + curr.prevOrders,
            revenue: acc.revenue + curr.prevRevenue,
            messages: acc.messages + curr.prevMessages,
        }), { impressions: 0, clicks: 0, orders: 0, revenue: 0, messages: 0 });
        
         return {
            ...totals,
            ctr: totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0,
            conversionRate: totals.impressions > 0 ? (totals.orders / totals.impressions) * 100 : 0,
        };
    }

    const totals = calculateTotals(timeSeries);
    const previousTotals = calculatePreviousTotals(timeSeries);

    return { source, timeSeries, totals, previousTotals };
}

// Function to get the full date range of data for a source
async function getFullDateRange(sourceName: string) {
    const ordersCollection = await getOrdersCollection();
    const incomesCollection = await getIncomesCollection();

    const orderDateRange = await ordersCollection.aggregate([
        { $match: { source: sourceName } },
        { $group: { _id: null, minDate: { $min: "$date" }, maxDate: { $max: "$date" } } }
    ]).toArray();

    const source = await incomesCollection.findOne({ name: sourceName });
    let analyticsDates = source?.gigs.flatMap(g => g.analytics?.map(a => a.date) || []) || [];
    let dataPointDates = source?.dataPoints?.map(dp => dp.date) || [];
    const allDates = [...(orderDateRange[0]?.minDate ? [orderDateRange[0].minDate] : []), ...(orderDateRange[0]?.maxDate ? [orderDateRange[0].maxDate] : []), ...analyticsDates, ...dataPointDates].filter(Boolean);

    if (allDates.length === 0) return null;

    const sortedDates = allDates.map(d => new Date(d.replace(/-/g, '/'))).sort((a,b) => a.getTime() - b.getTime());

    return { from: sortedDates[0], to: sortedDates[sortedDates.length - 1] };
}


// Public service functions
export async function getGigAnalytics(gigId: string, fromDate?: string, toDate?: string): Promise<GigAnalyticsData | null> {
    const to = toDate ? new Date(toDate.replace(/-/g, '/')) : new Date();
    const from = fromDate ? new Date(fromDate.replace(/-/g, '/')) : subDays(to, 29);

    const result = await processAnalytics({ from, to }, { gigId });
    if (!result) return null;

    const { source, timeSeries, totals, previousTotals } = result;
    const gig = source.gigs.find(g => g.id === gigId);
    if (!gig) return null;
    
    const ordersCollection = await getOrdersCollection();
    const sourceTotalOrders = await ordersCollection.countDocuments({ source: source.name, status: { $ne: 'Cancelled' } });
    
    return {
        gigId,
        gigName: gig.name,
        sourceName: source.name,
        sourceTotalOrders,
        timeSeries,
        totals,
        previousTotals
    };
}

export async function getSourceAnalytics(sourceId: string, fromDate?: string, toDate?: string): Promise<SourceAnalyticsData | null> {
    const incomesCollection = await getIncomesCollection();
    const sourceDoc = await incomesCollection.findOne({_id: new ObjectId(sourceId)});
    if (!sourceDoc) return null;

    let dateRange;
    if (fromDate && toDate) {
        dateRange = { from: new Date(fromDate.replace(/-/g, '/')), to: new Date(toDate.replace(/-/g, '/')) };
    } else {
        const fullRange = await getFullDateRange(sourceDoc.name);
        if (!fullRange) {
             return {
                sourceId,
                sourceName: sourceDoc.name,
                gigs: sourceDoc.gigs.map(g => ({ id: g.id, name: g.name, date: g.date, messages: g.messages })),
                timeSeries: [],
                totals: { impressions: 0, clicks: 0, orders: 0, revenue: 0, messages: 0, ctr: 0 },
                previousTotals: { impressions: 0, clicks: 0, orders: 0, revenue: 0, messages: 0, ctr: 0 }
            };
        }
        dateRange = fullRange;
    }

    const result = await processAnalytics(dateRange, { sourceId });
    if (!result) return null;
    
    const { source, timeSeries, totals, previousTotals } = result;
    
    return {
        sourceId,
        sourceName: source.name,
        gigs: source.gigs.map(g => ({ id: g.id, name: g.name, date: g.date, messages: g.messages })),
        timeSeries,
        totals,
        previousTotals
    };
}
