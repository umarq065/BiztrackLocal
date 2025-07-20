

/**
 * @fileoverview Service for fetching and processing analytics data.
 */
import { ObjectId } from 'mongodb';
import { format, subDays, eachDayOfInterval, differenceInDays, parseISO, sub, startOfMonth, endOfMonth, eachMonthOfInterval } from 'date-fns';
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

async function getExpensesCollection() {
    const client = await clientPromise;
    return client.db("biztrack-pro").collection('expenses');
}

async function getClientsCollection() {
    const client = await clientPromise;
    return client.db("biztrack-pro").collection('clients');
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
    totals: Omit<Totals, 'conversionRate'> & {ctr: number};
    previousTotals: Omit<Totals, 'conversionRate'> & {ctr: number};
}

export interface GrowthMetricTimeSeries {
    month: string;
    revenueGrowth: number;
    profitGrowth: number;
    clientGrowth: number;
    aovGrowth: number;
    vipClientGrowth: number;
    topSourceGrowth: number;
}
export interface GrowthMetricData {
  revenueGrowth: { value: number; change: number };
  profitGrowth: { value: number; change: number };
  clientGrowth: { value: number; change: number };
  aovGrowth: { value: number; change: number };
  vipClientGrowth: { value: number; change: number };
  topSourceGrowth: { value: number; change: number; source: string };
  timeSeries: GrowthMetricTimeSeries[];
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
        totals: { ...totals, ctr: totals.ctr },
        previousTotals: { ...previousTotals, ctr: previousTotals.ctr }
    };
}

export async function getGrowthMetrics(from: string, to: string): Promise<GrowthMetricData> {
    const fromDate = parseISO(from);
    const toDate = parseISO(to);
    const duration = differenceInDays(toDate, fromDate);
    
    const prevToDate = subDays(fromDate, 1);
    const prevFromDate = subDays(prevToDate, duration);

    const ordersCol = await getOrdersCollection();
    const expensesCol = await getExpensesCollection();
    const clientsCol = await getClientsCollection();

    const calcPeriodMetrics = async (start: Date, end: Date) => {
        const startStr = format(start, 'yyyy-MM-dd');
        const endStr = format(end, 'yyyy-MM-dd');

        const revenuePromise = ordersCol.aggregate([ { $match: { date: { $gte: startStr, $lte: endStr }, status: 'Completed' } }, { $group: { _id: null, total: { $sum: '$amount' } } } ]).toArray();
        const expensesPromise = expensesCol.aggregate([ { $match: { date: { $gte: startStr, $lte: endStr } } }, { $group: { _id: null, total: { $sum: '$amount' } } } ]).toArray();
        const newClientsPromise = clientsCol.countDocuments({ clientSince: { $gte: startStr, $lte: endStr } });
        const ordersInPeriodPromise = ordersCol.find({ date: { $gte: startStr, $lte: endStr }, status: 'Completed' }).toArray();
        const vipClientsPromise = clientsCol.countDocuments({ isVip: true, clientSince: {$lte: endStr} });
        const sourcesPromise = ordersCol.aggregate([{$match: {date: {$gte: startStr, $lte: endStr}}}, {$group: {_id: "$source", revenue: {$sum: "$amount"}}}, {$sort: {revenue: -1}}, {$limit: 1}]).toArray();
        const allClientsAtStartPromise = clientsCol.countDocuments({ clientSince: { $lt: startStr } });
        const inactiveClientsPromise = (await getClients()).filter(c => c.lastOrder !== 'N/A' && parseISO(c.lastOrder) < start).length;

        const [revenueRes, expensesRes, newClients, ordersInPeriod, vipClients, topSourceRes, clientsAtStart, inactiveClients] = await Promise.all([revenuePromise, expensesPromise, newClientsPromise, ordersInPeriodPromise, vipClientsPromise, sourcesPromise, allClientsAtStartPromise, inactiveClientsPromise]);

        const revenue = revenueRes[0]?.total || 0;
        const expenses = expensesRes[0]?.total || 0;
        const netProfit = revenue - expenses;
        const aov = ordersInPeriod.length > 0 ? revenue / ordersInPeriod.length : 0;
        const topSource = topSourceRes[0] ? {source: topSourceRes[0]._id, revenue: topSourceRes[0].revenue} : {source: 'N/A', revenue: 0};

        return { revenue, expenses, netProfit, newClients, aov, vipClients, topSource, clientsAtStart, inactiveClients};
    };

    const [current, previous] = await Promise.all([
        calcPeriodMetrics(fromDate, toDate),
        calcPeriodMetrics(prevFromDate, prevToDate)
    ]);

    const calculateGrowth = (currentVal: number, prevVal: number) => prevVal === 0 ? (currentVal > 0 ? 100 : 0) : ((currentVal - prevVal) / prevVal) * 100;
    
    const clientGrowth = previous.clientsAtStart > 0 ? ((current.newClients - current.inactiveClients) / previous.clientsAtStart) * 100 : (current.newClients > 0 ? 100 : 0);
    const prevClientGrowth = 0; // Simplified for now

    const timeSeries: GrowthMetricTimeSeries[] = eachMonthOfInterval({ start: fromDate, end: toDate }).map(monthStart => {
        // Dummy data for chart - in a real scenario, this would be another aggregation
        return {
            month: format(monthStart, 'MMM'),
            revenueGrowth: Math.random() * 5,
            profitGrowth: Math.random() * 5,
            clientGrowth: Math.random() * 10,
            aovGrowth: Math.random() * 2,
            vipClientGrowth: Math.random(),
            topSourceGrowth: Math.random() * 12
        };
    });

    return {
        revenueGrowth: { value: calculateGrowth(current.revenue, previous.revenue), change: 0 },
        profitGrowth: { value: calculateGrowth(current.netProfit, previous.netProfit), change: 0 },
        clientGrowth: { value: clientGrowth, change: clientGrowth - prevClientGrowth },
        aovGrowth: { value: calculateGrowth(current.aov, previous.aov), change: 0 },
        vipClientGrowth: { value: calculateGrowth(current.vipClients, previous.vipClients), change: 0 },
        topSourceGrowth: { value: calculateGrowth(current.topSource.revenue, previous.topSource.revenue), change: 0, source: current.topSource.source },
        timeSeries,
    };
}
