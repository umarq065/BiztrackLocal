

/**
 * @fileoverview Service for fetching and processing analytics data.
 */
import { ObjectId } from 'mongodb';
import { format, subDays, eachDayOfInterval, differenceInDays, parseISO, sub, startOfMonth, endOfMonth, eachMonthOfInterval, startOfYear, endOfYear, getMonth, getYear, differenceInMonths } from 'date-fns';
import clientPromise from '@/lib/mongodb';
import { type Competitor } from '@/lib/data/incomes-data';
import type { IncomeSource } from '@/lib/data/incomes-data';
import type { Client } from '@/lib/data/clients-data';
import type { Order } from '@/lib/data/orders-data';
import type { SingleYearData } from '@/lib/data/yearly-stats-data';
import type { BusinessNote } from '../data/business-notes-data';
import { getMonthlyTargets } from './monthlyTargetsService';

// Helper function to get database collections
async function getIncomesCollection() {
    const client = await clientPromise;
    return client.db("biztrack-pro").collection<IncomeSource>('incomes');
}

async function getOrdersCollection() {
    const client = await clientPromise;
    return client.db("biztrack-pro").collection<Order>('orders');
}

async function getExpensesCollection() {
    const client = await clientPromise;
    return client.db("biztrack-pro").collection('expenses');
}

async function getClientsCollection() {
    const client = await clientPromise;
    return client.db("biztrack-pro").collection<Omit<Client, 'id'>>('clients');
}

async function getCompetitorsCollection() {
    const client = await clientPromise;
    return client.db("biztrack-pro").collection<Competitor>('competitors');
}

async function getBusinessNotesCollection() {
    const client = await clientPromise;
    return client.db("biztrack-pro").collection<Omit<BusinessNote, 'id' | 'date'>>('businessNotes');
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
    highValueClientGrowth: number;
    sourceGrowth: number;
}
export interface GrowthMetricData {
  revenueGrowth: { value: number; previousValue: number };
  profitGrowth: { value: number; previousValue: number };
  clientGrowth: { value: number; previousValue: number };
  aovGrowth: { value: number; previousValue: number };
  vipClientGrowth: { value: number; previousValue: number };
  topSourceGrowth: { value: number; previousValue: number; source: string };
  timeSeries: GrowthMetricTimeSeries[];
}

export interface FinancialMetricTimeSeries {
  month: string;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  grossMargin: number;
  cac: number;
  cltv: number;
  aov: number;
}

export interface FinancialMetricData {
    totalRevenue: { value: number; change: number; previousValue: number };
    totalExpenses: { value: number; change: number; previousValue: number };
    netProfit: { value: number; change: number; previousValue: number };
    profitMargin: { value: number; change: number; previousValue: number };
    grossMargin: { value: number; change: number; previousValue: number };
    cac: { value: number; change: number; previousValue: number };
    cltv: { value: number; change: number; previousValue: number };
    aov: { value: number; change: number; previousValue: number };
    timeSeries: FinancialMetricTimeSeries[];
}


export interface ClientMetricData {
    totalClients: { value: number; change: number };
    newClients: { value: number; change: number };
    repeatClients: { value: number; change: number };
    repeatPurchaseRate: { value: number; change: number };
    retentionRate: { value: number; change: number };
    avgLifespan: { value: number; change: number };
    csat: { value: number; change: number };
    avgRating: { value: number; change: number };
    cancelledOrders: { value: number; change: number };
}

interface PeriodOrderStats {
    total: number;
    fromNewBuyers: number;
    fromRepeatBuyers: number;
}
export interface OrderCountAnalytics {
    currentPeriodOrders: PeriodOrderStats;
    previousPeriodOrders: PeriodOrderStats;
    periodBeforePreviousOrders: PeriodOrderStats;
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
    
    const durationInDays = differenceInDays(toDate, fromDate);
    if (durationInDays < 0) throw new Error("Invalid date range");

    const P2_to = toDate;
    const P2_from = fromDate;
    const P1_to = subDays(P2_from, 1);
    const P1_from = subDays(P1_to, durationInDays);
    const P0_to = subDays(P1_from, 1);
    const P0_from = subDays(P0_to, durationInDays);
    
    const ordersCol = await getOrdersCollection();
    const expensesCol = await getExpensesCollection();
    const clientsCol = await getClientsCollection();
    
    const calculateGrowth = (currentVal: number, prevVal: number) => {
        if (prevVal === 0) return currentVal > 0 ? 100 : 0;
        return ((currentVal - prevVal) / prevVal) * 100;
    }

    const calcMonthMetrics = async (start: Date, end: Date) => {
        const startStr = format(start, 'yyyy-MM-dd');
        const endStr = format(end, 'yyyy-MM-dd');

        const revenueRes = await ordersCol.aggregate([ { $match: { date: { $gte: startStr, $lte: endStr }, status: 'Completed' } }, { $group: { _id: null, total: { $sum: '$amount' } } } ]).toArray();
        const expensesRes = await expensesCol.aggregate([ { $match: { date: { $gte: startStr, $lte: endStr } } }, { $group: { _id: null, total: { $sum: '$amount' } } } ]).toArray();
        const ordersInPeriod = await ordersCol.find({ date: { $gte: startStr, $lte: endStr }, status: 'Completed' }).toArray();
        
        const revenue = revenueRes[0]?.total || 0;
        return {
            revenue: revenue,
            netProfit: revenue - (expensesRes[0]?.total || 0),
            aov: ordersInPeriod.length > 0 ? revenue / ordersInPeriod.length : 0,
            newClients: await clientsCol.countDocuments({ clientSince: { $gte: startStr, $lte: endStr } }),
            clientsAtStart: await clientsCol.countDocuments({ clientSince: { $lt: startStr } }),
        };
    };

    // Time Series Calculations
    const timeSeriesMonths = eachMonthOfInterval({ start: P2_from, end: P2_to });
    const timeSeries: GrowthMetricTimeSeries[] = await Promise.all(
        timeSeriesMonths.map(async (monthStart) => {
            const monthEnd = endOfMonth(monthStart);
            const prevMonthStart = sub(monthStart, { months: 1 });
            const prevMonthEnd = endOfMonth(prevMonthStart);

            const [currentMonthMetrics, prevMonthMetrics] = await Promise.all([
                calcMonthMetrics(monthStart, monthEnd),
                calcMonthMetrics(prevMonthStart, prevMonthEnd)
            ]);

            return {
                month: format(monthStart, 'MMM'),
                revenueGrowth: calculateGrowth(currentMonthMetrics.revenue, prevMonthMetrics.revenue),
                profitGrowth: calculateGrowth(currentMonthMetrics.netProfit, prevMonthMetrics.netProfit),
                aovGrowth: calculateGrowth(currentMonthMetrics.aov, prevMonthMetrics.aov),
                clientGrowth: calculateGrowth(currentMonthMetrics.newClients, prevMonthMetrics.newClients),
                highValueClientGrowth: 0, // Placeholder
                sourceGrowth: 0, // Placeholder
            };
        })
    );


    // Overall Period Calculations
    const calcPeriodMetrics = async (start: Date, end: Date) => {
        const startStr = format(start, 'yyyy-MM-dd');
        const endStr = format(end, 'yyyy-MM-dd');

        const revenuePromise = ordersCol.aggregate([ { $match: { date: { $gte: startStr, $lte: endStr }, status: 'Completed' } }, { $group: { _id: null, total: { $sum: '$amount' } } } ]).toArray();
        const expensesPromise = expensesCol.aggregate([ { $match: { date: { $gte: startStr, $lte: endStr } } }, { $group: { _id: null, total: { $sum: '$amount' } } } ]).toArray();
        const ordersInPeriodPromise = ordersCol.find({ date: { $gte: startStr, $lte: endStr }, status: 'Completed' }).toArray();
        const sourcesPromise = ordersCol.aggregate([{$match: {date: {$gte: startStr, $lte: endStr}, status: 'Completed'}}, {$group: {_id: "$source", revenue: {$sum: "$amount"}}}, {$sort: {revenue: -1}}, {$limit: 1}]).toArray();
        
        const newClientsPromise = clientsCol.countDocuments({ clientSince: { $gte: startStr, $lte: endStr } });
        const clientsAtStartPromise = clientsCol.countDocuments({ clientSince: { $lt: startStr } });
        const vipClientsPromise = clientsCol.countDocuments({ isVip: true, clientSince: {$lte: endStr} });
        
        const [revenueRes, expensesRes, ordersInPeriod, topSourceRes, newClients, clientsAtStart, vipClients] = await Promise.all([
            revenuePromise, expensesPromise, ordersInPeriodPromise, sourcesPromise, newClientsPromise, clientsAtStartPromise, vipClientsPromise
        ]);

        const revenue = revenueRes[0]?.total || 0;
        return { 
            revenue, 
            netProfit: revenue - (expensesRes[0]?.total || 0), 
            newClients, 
            aov: ordersInPeriod.length > 0 ? revenue / ordersInPeriod.length : 0, 
            vipClients, 
            topSource: topSourceRes[0] ? {source: topSourceRes[0]._id, revenue: topSourceRes[0].revenue} : {source: 'N/A', revenue: 0},
            clientsAtStart
        };
    };
    
    const [P2_metrics, P1_metrics, P0_metrics] = await Promise.all([
        calcPeriodMetrics(P2_from, P2_to),
        calcPeriodMetrics(P1_from, P1_to),
        calcPeriodMetrics(P0_from, P0_to)
    ]);
    
    const P2_topSourcePrevPeriodRevenue = P2_metrics.topSource.source !== 'N/A' 
        ? (await ordersCol.aggregate([ { $match: { source: P2_metrics.topSource.source, date: { $gte: format(P1_from, 'yyyy-MM-dd'), $lte: format(P1_to, 'yyyy-MM-dd') }, status: 'Completed' } }, { $group: { _id: null, total: { $sum: '$amount' } } } ]).toArray())[0]?.total || 0
        : 0;

    return {
        revenueGrowth: { value: calculateGrowth(P2_metrics.revenue, P1_metrics.revenue), previousValue: calculateGrowth(P1_metrics.revenue, P0_metrics.revenue) },
        profitGrowth: { value: calculateGrowth(P2_metrics.netProfit, P1_metrics.netProfit), previousValue: calculateGrowth(P1_metrics.netProfit, P0_metrics.netProfit) },
        aovGrowth: { value: calculateGrowth(P2_metrics.aov, P1_metrics.aov), previousValue: calculateGrowth(P1_metrics.aov, P0_metrics.aov) },
        vipClientGrowth: { value: calculateGrowth(P2_metrics.vipClients, P1_metrics.vipClients), previousValue: calculateGrowth(P1_metrics.vipClients, P0_metrics.vipClients) },
        topSourceGrowth: { value: calculateGrowth(P2_metrics.topSource.revenue, P2_topSourcePrevPeriodRevenue), previousValue: 0, source: P2_metrics.topSource.source }, // Change for top source growth is complex and deferred
        clientGrowth: { value: P1_metrics.clientsAtStart > 0 ? (P2_metrics.newClients / P1_metrics.clientsAtStart) * 100 : P2_metrics.newClients > 0 ? 100 : 0, previousValue: P0_metrics.clientsAtStart > 0 ? (P1_metrics.newClients / P0_metrics.clientsAtStart) * 100 : P1_metrics.newClients > 0 ? 100 : 0 },
        timeSeries,
    };
}


export async function getFinancialMetrics(from: string, to: string): Promise<FinancialMetricData> {
    const fromDate = parseISO(from);
    const toDate = parseISO(to);
    const duration = differenceInDays(toDate, fromDate);
    
    const P1_to = subDays(fromDate, 1);
    const P1_from = subDays(P1_to, duration);

    const ordersCol = await getOrdersCollection();
    const expensesCol = await getExpensesCollection();
    const clientsCol = await getClientsCollection();
    
    const calcPeriodMetrics = async (start: Date, end: Date) => {
        const startStr = format(start, 'yyyy-MM-dd');
        const endStr = format(end, 'yyyy-MM-dd');

        const revenuePromise = ordersCol.aggregate([ { $match: { date: { $gte: startStr, $lte: endStr }, status: 'Completed' } }, { $group: { _id: null, total: { $sum: '$amount' } } } ]).toArray();
        const expensesPromise = expensesCol.aggregate([ { $match: { date: { $gte: startStr, $lte: endStr } } }, { $group: { _id: null, total: { $sum: '$amount' } } } ]).toArray();
        const ordersCountPromise = ordersCol.countDocuments({ date: { $gte: startStr, $lte: endStr }, status: 'Completed' });
        
        const marketingExpensesPromise = expensesCol.aggregate([ { $match: { date: { $gte: startStr, $lte: endStr }, category: 'Marketing' } }, { $group: { _id: null, total: { $sum: '$amount' } } } ]).toArray();
        const salaryExpensesPromise = expensesCol.aggregate([ { $match: { date: { $gte: startStr, $lte: endStr }, category: 'Salary' } }, { $group: { _id: null, total: { $sum: '$amount' } } } ]).toArray();
        
        const newClientsCountPromise = clientsCol.countDocuments({ clientSince: { $gte: startStr, $lte: endStr } });

        // CLTV specific queries
        const buyerStatsPromise = ordersCol.aggregate([
            { $match: { date: { $gte: startStr, $lte: endStr } } },
            { $group: { _id: "$clientUsername", orderCount: { $sum: 1 } } }
        ]).toArray();
        
        const avgLifespanPromise = clientsCol.aggregate([
            { $lookup: { from: 'orders', localField: 'username', foreignField: 'clientUsername', as: 'clientOrders' } },
            { $match: { 'clientOrders.1': { $exists: true } } },
            { $addFields: { clientOrders: { $filter: { input: "$clientOrders", as: "order", cond: { $ne: ["$$order.status", "Cancelled"] } } } } },
            { $match: { 'clientOrders.1': { $exists: true } } },
            { $project: {
                firstOrderDate: { $min: '$clientOrders.date' },
                lastOrderDate: { $max: '$clientOrders.date' },
            }},
            { $project: {
                lifespanDays: {
                    $cond: {
                        if: { $and: [{ $ne: ['$firstOrderDate', null] }, { $ne: ['$lastOrderDate', null] }, { $ne: ['$firstOrderDate', '$lastOrderDate'] }] },
                        then: {
                            $divide: [
                                { $subtract: [
                                    { $dateFromString: { dateString: '$lastOrderDate' } },
                                    { $dateFromString: { dateString: '$firstOrderDate' } }
                                ] },
                                86400000 // ms in a day
                            ]
                        },
                        else: 0
                    }
                }
            }},
            { $group: { _id: null, avgLifespan: { $avg: '$lifespanDays' } } }
        ]).toArray();

        const [revenueRes, expensesRes, ordersCount, marketingExpensesRes, salaryExpensesRes, newClientsCount, buyerStats, avgLifespanRes] = await Promise.all([
            revenuePromise, expensesPromise, ordersCountPromise, marketingExpensesPromise, salaryExpensesPromise, newClientsCountPromise, buyerStatsPromise, avgLifespanPromise
        ]);
        
        const revenue = revenueRes[0]?.total || 0;
        const expenses = expensesRes[0]?.total || 0;
        const marketingExpenses = marketingExpensesRes[0]?.total || 0;
        const salaryExpenses = salaryExpensesRes[0]?.total || 0;
        const aov = ordersCount > 0 ? revenue / ordersCount : 0;
        
        const totalBuyers = buyerStats.length;
        const repeatBuyers = buyerStats.filter(b => b.orderCount > 1).length;
        const repeatPurchaseRate = totalBuyers > 0 ? repeatBuyers / totalBuyers : 0;
        const avgLifespanMonths = (avgLifespanRes[0]?.avgLifespan || 0) / 30.44;

        const cltv = aov * repeatPurchaseRate * avgLifespanMonths;

        return {
            totalRevenue: revenue,
            totalExpenses: expenses,
            netProfit: revenue - expenses,
            profitMargin: revenue > 0 ? ((revenue - expenses) / revenue) * 100 : 0,
            grossMargin: revenue > 0 ? ((revenue - salaryExpenses) / revenue) * 100 : 0,
            cac: newClientsCount > 0 ? marketingExpenses / newClientsCount : 0,
            cltv: cltv,
            aov: aov,
        };
    };

    const [currentMetrics, prevMetrics] = await Promise.all([
        calcPeriodMetrics(fromDate, toDate),
        calcPeriodMetrics(P1_from, P1_to)
    ]);
    
    const calculateChange = (current: number, prev: number) => prev === 0 ? (current !== 0 ? 100 : 0) : ((current - prev) / prev) * 100;
    
    // Time Series data (dummy for now)
    const timeSeries: FinancialMetricTimeSeries[] = eachMonthOfInterval({ start: fromDate, end: toDate }).map(monthStart => {
        // In a real app, this would be another aggregation by month
        const numMonths = differenceInMonths(toDate, fromDate) + 1;
        const dummyRevenue = currentMetrics.totalRevenue / numMonths;
        return {
            month: format(monthStart, 'MMM'),
            totalRevenue: dummyRevenue * (0.8 + Math.random() * 0.4),
            totalExpenses: currentMetrics.totalExpenses / numMonths * (0.8 + Math.random() * 0.4),
            netProfit: (dummyRevenue - currentMetrics.totalExpenses / numMonths) * (0.8 + Math.random() * 0.4),
            profitMargin: currentMetrics.profitMargin * (0.95 + Math.random() * 0.1),
            grossMargin: currentMetrics.grossMargin * (0.95 + Math.random() * 0.1),
            cac: currentMetrics.cac * (0.9 + Math.random() * 0.2),
            cltv: currentMetrics.cltv * (0.95 + Math.random() * 0.1),
            aov: currentMetrics.aov * (0.95 + Math.random() * 0.1),
        };
    });

    return {
        totalRevenue: { value: currentMetrics.totalRevenue, change: calculateChange(currentMetrics.totalRevenue, prevMetrics.totalRevenue), previousValue: prevMetrics.totalRevenue },
        totalExpenses: { value: currentMetrics.totalExpenses, change: calculateChange(currentMetrics.totalExpenses, prevMetrics.totalExpenses), previousValue: prevMetrics.totalExpenses },
        netProfit: { value: currentMetrics.netProfit, change: calculateChange(currentMetrics.netProfit, prevMetrics.netProfit), previousValue: prevMetrics.netProfit },
        profitMargin: { value: currentMetrics.profitMargin, change: currentMetrics.profitMargin - prevMetrics.profitMargin, previousValue: prevMetrics.profitMargin },
        grossMargin: { value: currentMetrics.grossMargin, change: currentMetrics.grossMargin - prevMetrics.grossMargin, previousValue: prevMetrics.grossMargin },
        cac: { value: currentMetrics.cac, change: calculateChange(currentMetrics.cac, prevMetrics.cac), previousValue: prevMetrics.cac },
        cltv: { value: currentMetrics.cltv, change: calculateChange(currentMetrics.cltv, prevMetrics.cltv), previousValue: prevMetrics.cltv },
        aov: { value: currentMetrics.aov, change: calculateChange(currentMetrics.aov, prevMetrics.aov), previousValue: prevMetrics.aov },
        timeSeries
    };
}

export async function getClientMetrics(from: string, to: string): Promise<ClientMetricData> {
    const fromDate = parseISO(from);
    const toDate = parseISO(to);
    
    const calcPeriodMetrics = async (start: Date, end: Date) => {
        const startStr = format(start, 'yyyy-MM-dd');
        const endStr = format(end, 'yyyy-MM-dd');
        
        const ordersCol = await getOrdersCollection();
        const clientsCol = await getClientsCollection();
        
        const [
            ordersInPeriod,
            newClientsInPeriodCount,
            clientsAtStart,
            cancelledInPeriod,
            csatResults,
            lifespanResults,
        ] = await Promise.all([
            ordersCol.find({ date: { $gte: startStr, $lte: endStr } }).toArray(),
            clientsCol.countDocuments({ clientSince: { $gte: startStr, $lte: endStr } }),
            clientsCol.find({ clientSince: { $lt: startStr } }).project({ username: 1 }).toArray(),
            ordersCol.countDocuments({ date: { $gte: startStr, $lte: endStr }, status: 'Cancelled' }),
            ordersCol.aggregate([
                { $match: { date: { $gte: startStr, $lte: endStr }, rating: { $ne: null } } },
                { $group: { _id: null, positiveRatings: { $sum: { $cond: [{ $gte: ['$rating', 4] }, 1, 0] } }, totalRatings: { $sum: 1 }, avgRating: { $avg: '$rating' } } }
            ]).toArray(),
            clientsCol.aggregate([
                { $lookup: { from: 'orders', localField: 'username', foreignField: 'clientUsername', as: 'clientOrders' } },
                { $match: { 'clientOrders.1': { $exists: true } } },
                { $addFields: { clientOrders: { $filter: { input: "$clientOrders", as: "order", cond: { $ne: ["$$order.status", "Cancelled"] } } } } },
                { $match: { 'clientOrders.1': { $exists: true } } },
                { $project: {
                    firstOrderDate: { $min: '$clientOrders.date' },
                    lastOrderDate: { $max: '$clientOrders.date' }
                }},
                { $project: {
                    lifespanDays: {
                        $cond: {
                             if: { $and: [{ $ne: ['$firstOrderDate', null] }, { $ne: ['$lastOrderDate', null] }, { $ne: ['$firstOrderDate', '$lastOrderDate'] }] },
                             then: {
                                $divide: [
                                    { $subtract: [
                                        { $dateFromString: { dateString: '$lastOrderDate' } },
                                        { $dateFromString: { dateString: '$firstOrderDate' } }
                                    ]},
                                    1000 * 60 * 60 * 24
                                ]
                             },
                             else: 0
                        }
                    }
                }},
                { $group: { _id: null, avgLifespan: { $avg: '$lifespanDays' } } }
            ]).toArray(),
        ]);
        
        const clientUsernamesInPeriod = new Set(ordersInPeriod.map(o => o.clientUsername));
        const totalClientsInPeriod = clientUsernamesInPeriod.size;

        const clientOrderCounts = ordersInPeriod.reduce((acc, order) => {
            acc[order.clientUsername] = (acc[order.clientUsername] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        
        const repeatClientsCount = Object.values(clientOrderCounts).filter(count => count > 1).length;
        const clientsAtStartUsernames = new Set(clientsAtStart.map(c => c.username));
        const retainedClientsCount = Array.from(clientUsernamesInPeriod).filter(username => clientsAtStartUsernames.has(username)).length;
        
        const csat = (csatResults[0]?.totalRatings > 0) ? (csatResults[0].positiveRatings / csatResults[0].totalRatings) * 100 : 0;
        const avgRating = csatResults[0]?.avgRating || 0;
        const avgLifespanMonths = (lifespanResults[0]?.avgLifespan || 0) / 30.44;
        const repeatPurchaseRate = totalClientsInPeriod > 0 ? (repeatClientsCount / totalClientsInPeriod) * 100 : 0;
        const retentionRate = clientsAtStart.length > 0 ? (retainedClientsCount / clientsAtStart.length) * 100 : 0;

        return {
            totalClients: totalClientsInPeriod,
            newClients: newClientsInPeriodCount,
            repeatClients: repeatClientsCount,
            repeatPurchaseRate,
            retentionRate,
            avgLifespan: avgLifespanMonths,
            csat,
            avgRating,
            cancelledOrders: cancelledInPeriod
        };
    };

    const durationDays = differenceInDays(toDate, fromDate);
    const prevToDate = subDays(fromDate, 1);
    const prevFromDate = subDays(prevToDate, durationDays);

    const [currentMetrics, prevMetrics] = await Promise.all([
        calcPeriodMetrics(fromDate, toDate),
        calcPeriodMetrics(prevFromDate, prevToDate)
    ]);
    
    const calculateChange = (current: number, prev: number) => prev === 0 ? (current !== 0 ? 100 : 0) : ((current - prev) / prev) * 100;

    return {
        totalClients: { value: currentMetrics.totalClients, change: calculateChange(currentMetrics.totalClients, prevMetrics.totalClients) },
        newClients: { value: currentMetrics.newClients, change: calculateChange(currentMetrics.newClients, prevMetrics.newClients) },
        repeatClients: { value: currentMetrics.repeatClients, change: calculateChange(currentMetrics.repeatClients, prevMetrics.repeatClients) },
        repeatPurchaseRate: { value: currentMetrics.repeatPurchaseRate, change: currentMetrics.repeatPurchaseRate - prevMetrics.repeatPurchaseRate },
        retentionRate: { value: currentMetrics.retentionRate, change: currentMetrics.retentionRate - prevMetrics.retentionRate },
        avgLifespan: { value: currentMetrics.avgLifespan, change: calculateChange(currentMetrics.avgLifespan, prevMetrics.avgLifespan) },
        csat: { value: currentMetrics.csat, change: currentMetrics.csat - prevMetrics.csat },
        avgRating: { value: currentMetrics.avgRating, change: currentMetrics.avgRating - prevMetrics.avgRating },
        cancelledOrders: { value: currentMetrics.cancelledOrders, change: calculateChange(currentMetrics.cancelledOrders, prevMetrics.cancelledOrders) },
    };
}

export async function getOrderCountAnalytics(from: string, to: string): Promise<OrderCountAnalytics> {
    const fromDate = parseISO(from);
    const toDate = parseISO(to);
    
    const durationInDays = differenceInDays(toDate, fromDate);
    if (durationInDays < 0) throw new Error("Invalid date range");

    const p2_from = fromDate;
    const p2_to = toDate;
    const p1_to = subDays(p2_from, 1);
    const p1_from = subDays(p1_to, durationInDays);
    const p0_to = subDays(p1_from, 1);
    const p0_from = subDays(p0_to, durationInDays);
    
    const ordersCol = await getOrdersCollection();
    const clientsCol = await getClientsCollection();
    
    const getPeriodStats = async (start: Date, end: Date): Promise<PeriodOrderStats> => {
        const startStr = format(start, 'yyyy-MM-dd');
        const endStr = format(end, 'yyyy-MM-dd');

        const ordersInPeriod = await ordersCol.find({
            date: { $gte: startStr, $lte: endStr },
            status: 'Completed'
        }).toArray();

        const totalOrders = ordersInPeriod.length;
        if (totalOrders === 0) return { total: 0, fromNewBuyers: 0, fromRepeatBuyers: 0 };
        
        const clientsInPeriod = [...new Set(ordersInPeriod.map(o => o.clientUsername))];

        const clientsWithFirstOrderDate = await clientsCol.aggregate([
            { $match: { username: { $in: clientsInPeriod } } },
            { $project: { username: 1, firstOrderDate: "$clientSince" }}
        ]).toArray();
        
        const firstOrderDateMap = new Map(clientsWithFirstOrderDate.map(c => [c.username, c.firstOrderDate]));
        
        const newBuyerUsernames = new Set<string>();
        const repeatBuyerUsernames = new Set<string>();

        clientsInPeriod.forEach(username => {
            const firstOrderDate = firstOrderDateMap.get(username);
            if (firstOrderDate && firstOrderDate >= startStr && firstOrderDate <= endStr) {
                newBuyerUsernames.add(username);
            } else {
                repeatBuyerUsernames.add(username);
            }
        });

        const newBuyerOrders = ordersInPeriod.filter(o => newBuyerUsernames.has(o.clientUsername)).length;
        const repeatBuyerOrders = ordersInPeriod.filter(o => repeatBuyerUsernames.has(o.clientUsername)).length;
        
        return { total: totalOrders, fromNewBuyers: newBuyerOrders, fromRepeatBuyers: repeatBuyerOrders };
    }

    const [currentPeriodOrders, previousPeriodOrders, periodBeforePreviousOrders] = await Promise.all([
        getPeriodStats(p2_from, p2_to),
        getPeriodStats(p1_from, p1_to),
        getPeriodStats(p0_from, p0_to)
    ]);
    
    return {
        currentPeriodOrders,
        previousPeriodOrders,
        periodBeforePreviousOrders
    };
}

export async function getYearlyStats(year: number): Promise<SingleYearData> {
    const ordersCol = await getOrdersCollection();
    const competitorsCol = await getCompetitorsCollection();
    const expensesCol = await getExpensesCollection();
    const businessNotesCol = await getBusinessNotesCollection();

    const yearStart = format(startOfYear(new Date(year, 0, 1)), 'yyyy-MM-dd');
    const yearEnd = format(endOfYear(new Date(year, 0, 1)), 'yyyy-MM-dd');
    
    const monthlyTargets = await getMonthlyTargets();

    // Initialize with a default structure
    const data: SingleYearData = {
        year: year,
        myTotalYearlyOrders: 0,
        monthlyOrders: Array(12).fill(0),
        competitors: [],
        monthlyFinancials: Array(12).fill(0).map((_, i) => ({
            month: format(new Date(year, i, 1), 'MMM'),
            revenue: 0,
            expenses: 0,
            profit: 0,
            monthlyTargetRevenue: monthlyTargets[`${year}-${String(i + 1).padStart(2, '0')}`] ?? 0,
            notes: [],
        })),
    };

    const myMonthlyDataArr = await ordersCol.aggregate([
        { $match: { date: { $gte: yearStart, $lte: yearEnd }, status: 'Completed' } },
        { $project: { month: { $substrBytes: ['$date', 5, 2] }, amount: '$amount' } },
        { $group: { _id: '$month', orders: { $sum: 1 }, revenue: { $sum: '$amount' } } },
        { $sort: { '_id': 1 } }
    ]).toArray();
    
    myMonthlyDataArr.forEach(item => {
        const monthIndex = parseInt(item._id, 10) - 1;
        if (monthIndex >= 0 && monthIndex < 12) {
            data.monthlyOrders[monthIndex] = item.orders;
            data.monthlyFinancials[monthIndex].revenue = item.revenue;
        }
    });

    const monthlyExpensesArr = await expensesCol.aggregate([
        { $match: { date: { $gte: yearStart, $lte: yearEnd } } },
        { $project: { month: { $substrBytes: ['$date', 5, 2] }, amount: '$amount' } } ,
        { $group: { _id: '$month', totalExpenses: { $sum: '$amount' } } },
        { $sort: { '_id': 1 } }
    ]).toArray();
    
    monthlyExpensesArr.forEach(item => {
        const monthIndex = parseInt(item._id, 10) - 1;
        if (monthIndex >= 0 && monthIndex < 12) {
            data.monthlyFinancials[monthIndex].expenses = item.totalExpenses;
        }
    });
    
    const notesForYear = await businessNotesCol.find({
        date: { $gte: new Date(yearStart), $lte: new Date(yearEnd) }
    }).project({ title: 1, content: 1, date: 1 }).toArray();

    notesForYear.forEach(note => {
        const monthIndex = (note.date as Date).getMonth();
        if (monthIndex >= 0 && monthIndex < 12) {
            data.monthlyFinancials[monthIndex].notes.push({
                title: note.title,
                content: note.content,
                date: note.date,
            });
        }
    });

    data.monthlyFinancials.forEach(mf => {
        mf.profit = mf.revenue - mf.expenses;
    });
    data.myTotalYearlyOrders = data.monthlyOrders.reduce((sum, count) => sum + count, 0);

    const competitors = await competitorsCol.find({}).toArray();
    if (competitors && competitors.length > 0) {
        data.competitors = competitors.map(comp => {
            const monthlyOrders = Array(12).fill(0);
            (comp.monthlyData || [])
                .filter(d => d.year === year)
                .forEach(d => {
                    if(d.month >= 1 && d.month <= 12) {
                        monthlyOrders[d.month - 1] = d.orders;
                    }
                });
            const totalOrders = monthlyOrders.reduce((sum, count) => sum + count, 0);
            return {
                id: comp._id.toString(),
                name: comp.name,
                monthlyOrders,
                totalOrders
            };
        });
    }

    return data;
}

