

/**
 * @fileoverview Service for fetching and processing analytics data.
 */
import { ObjectId } from 'mongodb';
import { format, subDays, eachDayOfInterval, differenceInDays, parseISO, sub, startOfMonth, endOfMonth, eachMonthOfInterval, startOfYear, endOfYear, getMonth, getYear, differenceInMonths, startOfWeek, eachWeekOfInterval, getQuarter, startOfQuarter, eachQuarterOfInterval, eachYearOfInterval } from 'date-fns';
import clientPromise from '@/lib/mongodb';
import { type Competitor } from '@/lib/data/incomes-data';
import type { IncomeSource } from '@/lib/data/incomes-data';
import type { Client } from '@/lib/data/clients-data';
import type { Order } from '@/lib/data/orders-data';
import type { SingleYearData } from '@/lib/data/yearly-stats-data';
import type { BusinessNote } from '../data/business-notes-data';
import { getMonthlyTargets } from './monthlyTargetsService';
import { type GigPerformance } from '../data/gig-performance-data';

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
    return client.db("biztrack-pro").collection<Omit<BusinessNote, 'id'>>('businessNotes');
}

async function getMessagesCollection() {
    const client = await clientPromise;
    return client.db("biztrack-pro").collection('messages');
}

async function getGigPerformancesCollection() {
    const client = await clientPromise;
    return client.db("biztrack-pro").collection<GigPerformance>('gigPerformances');
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
    gigs: { id: string; name: string; date: string; messages?: number; }[];
    timeSeries: TimeSeriesDataPoint[];
    totals: Omit<Totals, 'conversionRate'> & {ctr: number};
    previousTotals: Omit<Totals, 'conversionRate'> & {ctr: number};
}

export interface GrowthMetricTimeSeries {
    date: string;
    revenueGrowth: number;
    profitGrowth: number;
    clientGrowth: number;
    aovGrowth: number;
    highValueClientGrowth: number;
    sourceGrowth: number;
    note?: Pick<BusinessNote, 'title' | 'content'>;
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
    date: string;
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
    profitMargin: number;
    grossMargin: number;
    cac: number;
    cltv: number;
    aov: number;
}

export interface FinancialMetric {
    value: number;
    change: number;
    previousPeriodChange: number;
    previousValue: number;
}

export interface FinancialMetricData {
    totalRevenue: FinancialMetric;
    totalExpenses: FinancialMetric;
    netProfit: FinancialMetric;
    profitMargin: FinancialMetric;
    grossMargin: FinancialMetric;
    cac: FinancialMetric;
    aov: FinancialMetric;
    cltv: FinancialMetric;
    timeSeries: FinancialMetricTimeSeries[];
}

export interface PerformanceMetric {
  value: number;
  change: number;
  previousValue: number;
  previousPeriodChange: number;
}
export interface PerformanceMetricData {
  impressions: PerformanceMetric;
  clicks: PerformanceMetric;
  messages: PerformanceMetric;
  ctr: PerformanceMetric;
}

export interface MarketingMetric {
    value: number;
    change: number;
    previousValue: number;
}

export interface MarketingMetricData {
    cpl: MarketingMetric;
    romi: MarketingMetric;
}

interface PeriodOrderStats {
    total: number;
    fromNewBuyers: number;
    fromRepeatBuyers: number;
    cancelled: number;
    avgRating: number;
}
export interface OrderCountAnalytics {
    currentPeriodOrders: PeriodOrderStats;
    previousPeriodOrders: PeriodOrderStats;
    periodBeforePreviousOrders: PeriodOrderStats;
}

export interface ClientMetricData {
    totalClients: { value: number; change: number };
    newClients: { value: number; change: number };
    repeatClients: { value: number; change: number };
    repeatPurchaseRate: { value: number; change: number };
    retentionRate: { value: number; change: number };
    avgLifespan: { value: number; change: number };
    medianLifespan: { value: number; change: number };
}


// Shared data processing function
async function processAnalytics(
    dateRange: { from: Date; to: Date },
    filter: { sourceId?: string; gigId?: string }
) {
    const incomesCollection = await getIncomesCollection();
    const ordersCollection = await getOrdersCollection();
    const messagesCollection = await getMessagesCollection();
    const gigPerformancesCollection = await getGigPerformancesCollection();

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

    const sourceId = source._id.toString();

    const gigNames = filter.gigId 
        ? [source.gigs.find(g => g.id === filter.gigId)?.name] 
        : source.gigs.map(g => g.name);
    
    const getOrdersForPeriod = async (start: Date, end: Date) => {
        return ordersCollection.aggregate([
            { $match: { 
                source: source.name,
                ...(gigNames.length > 0 && gigNames[0] && { gig: { $in: gigNames } }),
                date: { $gte: format(start, 'yyyy-MM-dd'), $lte: format(end, 'yyyy-MM-dd') },
                status: { $ne: 'Cancelled' }
            }},
            { $group: {
                _id: "$date",
                orders: { $sum: 1 },
                revenue: { $sum: '$amount' }
            }}
        ]).toArray();
    }
    
    const [currentOrders, previousOrders] = await Promise.all([
        getOrdersForPeriod(from, to),
        getOrdersForPeriod(prevFrom, prevTo)
    ]);

    const ordersMap = new Map(currentOrders.map(o => [o._id, o]));
    const prevOrdersMap = new Map(previousOrders.map(o => [o._id, o]));

    const getPerformanceForPeriod = async (start: Date, end: Date) => {
        return gigPerformancesCollection.aggregate([
            { $match: { 
                sourceId: sourceId,
                ...(filter.gigId && { gigId: filter.gigId }),
                date: { $gte: format(start, 'yyyy-MM-dd'), $lte: format(end, 'yyyy-MM-dd') },
            }},
            { $group: {
                _id: "$date",
                impressions: { $sum: '$impressions' },
                clicks: { $sum: '$clicks' }
            }}
        ]).toArray();
    };

    const [currentPerf, previousPerf] = await Promise.all([
        getPerformanceForPeriod(from, to),
        getPerformanceForPeriod(prevFrom, prevTo)
    ]);

    const performanceMap = new Map(currentPerf.map(p => [p._id, p]));
    const prevPerformanceMap = new Map(previousPerf.map(p => [p._id, p]));
    
    const getMessagesForPeriod = async (start: Date, end: Date) => {
        return messagesCollection.aggregate([
             { $match: { 
                sourceId: source._id.toString(),
                date: { $gte: format(start, 'yyyy-MM-dd'), $lte: format(end, 'yyyy-MM-dd') }
            }},
            { $group: {
                _id: "$date",
                messages: { $sum: '$messages' }
            }}
        ]).toArray();
    };

    const [currentMessages, previousMessages] = await Promise.all([
        getMessagesForPeriod(from, to),
        getMessagesForPeriod(prevFrom, prevTo)
    ]);

    const messagesMap = new Map(currentMessages.map(m => [m._id, m]));
    const prevMessagesMap = new Map(previousMessages.map(m => [m._id, m]));
    
    // Combine all data into a time series
    const timeSeries = dateArray.map((date, i) => {
        const prevDate = prevDateArray[i];
        
        const perfData = performanceMap.get(date) || { impressions: 0, clicks: 0 };
        const prevPerfData = prevPerformanceMap.get(prevDate) || { impressions: 0, clicks: 0 };
        const orderData = ordersMap.get(date) || { orders: 0, revenue: 0 };
        const prevOrderData = prevOrdersMap.get(prevDate) || { orders: 0, revenue: 0 };
        const messageData = messagesMap.get(date) || { messages: 0 };
        const prevMessageData = prevMessagesMap.get(prevDate) || { messages: 0 };

        return {
            date,
            impressions: perfData.impressions,
            clicks: perfData.clicks,
            orders: orderData.orders,
            revenue: orderData.revenue,
            messages: messageData.messages,
            ctr: perfData.impressions > 0 ? (perfData.clicks / perfData.impressions) * 100 : 0,
            prevImpressions: prevPerfData.impressions,
            prevClicks: prevPerfData.clicks,
            prevOrders: prevOrderData.orders,
            prevRevenue: prevOrderData.revenue,
            prevMessages: prevMessageData.messages,
            prevCtr: prevPerfData.impressions > 0 ? (prevPerfData.clicks / prevPerfData.impressions) * 100 : 0,
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
async function getFullDateRange(sourceName: string, sourceId: string) {
    const ordersCollection = await getOrdersCollection();
    const messagesCollection = await getMessagesCollection();
    const gigPerformancesCollection = await getGigPerformancesCollection();

    const orderDateRangePromise = ordersCollection.aggregate([
        { $match: { source: sourceName } },
        { $group: { _id: null, minDate: { $min: "$date" }, maxDate: { $max: "$date" } } }
    ]).toArray();
    
    const messageDateRangePromise = messagesCollection.aggregate([
        { $match: { sourceId: sourceId } },
        { $group: { _id: null, minDate: { $min: "$date" }, maxDate: { $max: "$date" } } }
    ]).toArray();
    
     const performanceDateRangePromise = gigPerformancesCollection.aggregate([
        { $match: { sourceId: sourceId } },
        { $group: { _id: null, minDate: { $min: "$date" }, maxDate: { $max: "$date" } } }
    ]).toArray();

    const [orderDateRange, messageDateRange, performanceDateRange] = await Promise.all([
        orderDateRangePromise,
        messageDateRangePromise,
        performanceDateRangePromise
    ]);
    
    const allDates = [
        orderDateRange[0]?.minDate,
        orderDateRange[0]?.maxDate,
        messageDateRange[0]?.minDate,
        messageDateRange[0]?.maxDate,
        performanceDateRange[0]?.minDate,
        performanceDateRange[0]?.maxDate,
    ].filter(Boolean);

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
        const fullRange = await getFullDateRange(sourceDoc.name, sourceId);
        if (!fullRange) {
             return {
                sourceId,
                sourceName: sourceDoc.name,
                gigs: sourceDoc.gigs.map(g => ({ id: g.id, name: g.name, date: g.date })),
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

    const messagesCollection = await getMessagesCollection();
    const messagesPerGig = await messagesCollection.aggregate([
        { $match: { sourceId: sourceId } },
        { $group: { _id: "$gigId", messages: { $sum: "$messages" } } }
    ]).toArray();
    const messageMap = new Map(messagesPerGig.map(m => [m._id, m.messages]));
    
    return {
        sourceId,
        sourceName: source.name,
        gigs: source.gigs.map(g => ({ id: g.id, name: g.name, date: g.date, messages: messageMap.get(g.id) })),
        timeSeries,
        totals: { ...totals, ctr: totals.ctr },
        previousTotals: { ...previousTotals, ctr: previousTotals.ctr }
    };
}

export async function getGrowthMetrics(from: string, to: string, sources?: string[]): Promise<GrowthMetricData> {
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
    const businessNotesCol = await getBusinessNotesCollection();
    
    const calculateGrowth = (currentVal: number, prevVal: number) => {
        if (prevVal === 0) return currentVal > 0 ? 100 : 0;
        return ((currentVal - prevVal) / prevVal) * 100;
    }

    const sourceFilter = sources ? { source: { $in: sources } } : {};
    
    // Time Series Calculations (daily)
    const timeSeriesDays = eachDayOfInterval({ start: P2_from, end: P2_to });

    const [notesForPeriod, allOrders, allExpenses] = await Promise.all([
        businessNotesCol.find({ date: { $gte: P2_from, $lte: P2_to } }).project({ _id: 0, date: 1, title: 1, content: 1 }).toArray(),
        ordersCol.find({ date: { $gte: format(subDays(P2_from, 1), 'yyyy-MM-dd'), $lte: format(P2_to, 'yyyy-MM-dd') }, status: 'Completed', ...sourceFilter }).toArray(),
        expensesCol.find({ date: { $gte: format(subDays(P2_from, 1), 'yyyy-MM-dd'), $lte: format(P2_to, 'yyyy-MM-dd') } }).toArray()
    ]);

    const notesMap = new Map(notesForPeriod.map(note => [format(note.date as Date, 'yyyy-MM-dd'), { title: note.title, content: note.content }]));
    
    const calculateMetricsForDate = (date: Date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const dayOrders = allOrders.filter(o => o.date === dateStr);
        const dayExpenses = allExpenses.filter(e => e.date === dateStr);
        
        const revenue = dayOrders.reduce((sum, o) => sum + o.amount, 0);
        const expenses = dayExpenses.reduce((sum, e) => sum + e.amount, 0);
        const aov = dayOrders.length > 0 ? revenue / dayOrders.length : 0;
        
        return { revenue, netProfit: revenue - expenses, aov };
    };

    const timeSeries: GrowthMetricTimeSeries[] = await Promise.all(
        timeSeriesDays.map(async (day) => {
            const prevDay = sub(day, { days: 1 });

            const currentDayMetrics = calculateMetricsForDate(day);
            const prevDayMetrics = calculateMetricsForDate(prevDay);
            
            const newClientsCount = await clientsCol.countDocuments({ clientSince: format(day, 'yyyy-MM-dd'), ...sourceFilter });

            return {
                date: format(day, 'yyyy-MM-dd'),
                revenueGrowth: calculateGrowth(currentDayMetrics.revenue, prevDayMetrics.revenue),
                profitGrowth: calculateGrowth(currentDayMetrics.netProfit, prevDayMetrics.netProfit),
                aovGrowth: calculateGrowth(currentDayMetrics.aov, prevDayMetrics.aov),
                clientGrowth: newClientsCount, // absolute number for daily, not rate
                highValueClientGrowth: 0, // Placeholder
                sourceGrowth: 0, // Placeholder
                note: notesMap.get(format(day, 'yyyy-MM-dd')),
            };
        })
    );


    // Overall Period Calculations
    const calcPeriodMetrics = async (start: Date, end: Date) => {
        const startStr = format(start, 'yyyy-MM-dd');
        const endStr = format(end, 'yyyy-MM-dd');

        const revenuePromise = ordersCol.aggregate([ { $match: { date: { $gte: startStr, $lte: endStr }, status: 'Completed', ...sourceFilter } }, { $group: { _id: null, total: { $sum: '$amount' } } } ]).toArray();
        const expensesPromise = expensesCol.aggregate([ { $match: { date: { $gte: startStr, $lte: endStr } } }, { $group: { _id: null, total: { $sum: '$amount' } } } ]).toArray();
        const ordersInPeriodPromise = ordersCol.find({ date: { $gte: startStr, $lte: endStr }, status: 'Completed', ...sourceFilter }).toArray();
        const sourcesPromise = ordersCol.aggregate([{$match: {date: {$gte: startStr, $lte: endStr}, status: 'Completed', ...sourceFilter}}, {$group: {_id: "$source", revenue: {$sum: "$amount"}}}, {$sort: {revenue: -1}}, {$limit: 1}]).toArray();
        
        const newClientsPromise = clientsCol.countDocuments({ clientSince: { $gte: startStr, $lte: endStr }, ...sourceFilter });
        const clientsAtStartPromise = clientsCol.countDocuments({ clientSince: { $lt: startStr }, ...sourceFilter });
        const vipClientsPromise = clientsCol.countDocuments({ isVip: true, clientSince: {$lte: endStr}, ...sourceFilter });
        
        const [
            revenueRes, expensesRes, ordersInPeriod, topSourceRes, newClients, clientsAtStart, vipClients
        ] = await Promise.all([
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
        ? (await ordersCol.aggregate([ { $match: { source: P2_metrics.topSource.source, date: { $gte: format(P1_from, 'yyyy-MM-dd'), $lte: format(P1_to, 'yyyy-MM-dd') }, status: 'Completed', ...sourceFilter } }, { $group: { _id: null, total: { $sum: '$amount' } } } ]).toArray())[0]?.total || 0
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

export async function getClientMetrics(from: string, to: string, sources?: string[]): Promise<ClientMetricData> {
    const fromDate = parseISO(from);
    const toDate = parseISO(to);
    
    const sourceFilter = sources ? { source: { $in: sources } } : {};
    
    const calcPeriodMetrics = async (start: Date, end: Date) => {
        const startStr = format(start, 'yyyy-MM-dd');
        const endStr = format(end, 'yyyy-MM-dd');
        
        const ordersCol = await getOrdersCollection();
        const clientsCol = await getClientsCollection();
        
        const [
            ordersInPeriod,
            newClientsInPeriodCount,
            clientsAtStart,
            lifespanResults,
        ] = await Promise.all([
            ordersCol.find({ date: { $gte: startStr, $lte: endStr }, ...sourceFilter }).toArray(),
            clientsCol.countDocuments({ clientSince: { $gte: startStr, $lte: endStr }, ...sourceFilter }),
            clientsCol.find({ clientSince: { $lt: startStr }, ...sourceFilter }).project({ username: 1 }).toArray(),
            clientsCol.aggregate([
                { $match: sourceFilter },
                {
                    $lookup: {
                        from: 'orders',
                        let: { client_username: '$username' },
                        pipeline: [
                            {
                                $match: {
                                    $expr: { $eq: ['$clientUsername', '$$client_username'] },
                                    ...sourceFilter, // Also filter orders by source inside lookup
                                    status: { $ne: 'Cancelled' }
                                }
                            }
                        ],
                        as: 'clientOrders'
                    }
                },
                { $match: { 'clientOrders.1': { $exists: true } } },
                { $addFields: { firstOrderDate: { $min: '$clientOrders.date' }, lastOrderDate: { $max: '$clientOrders.date' } } },
                { $match: { lastOrderDate: { $gte: startStr, $lte: endStr } } },
                { $project: { lifespanDays: { $cond: { if: { $and: [{ $ne: ['$firstOrderDate', null] }, { $ne: ['$lastOrderDate', null] }, { $ne: ['$firstOrderDate', '$lastOrderDate'] }] }, then: { $divide: [ { $subtract: [ { $dateFromString: { dateString: '$lastOrderDate' } }, { $dateFromString: { dateString: '$firstOrderDate' } } ]}, 1000 * 60 * 60 * 24 ] }, else: 0 } } } }
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
        
        const allLifespans = lifespanResults.map(r => r.lifespanDays).sort((a,b) => a - b);
        const avgLifespanDays = allLifespans.length > 0 ? allLifespans.reduce((sum, val) => sum + val, 0) / allLifespans.length : 0;
        
        let medianLifespanDays = 0;
        if (allLifespans.length > 0) {
            const mid = Math.floor(allLifespans.length / 2);
            if (allLifespans.length % 2 === 0) {
                medianLifespanDays = (allLifespans[mid - 1] + allLifespans[mid]) / 2;
            } else {
                medianLifespanDays = allLifespans[mid];
            }
        }
        
        const repeatPurchaseRate = totalClientsInPeriod > 0 ? (repeatClientsCount / totalClientsInPeriod) * 100 : 0;
        const retentionRate = clientsAtStart.length > 0 ? (retainedClientsCount / clientsAtStart.length) * 100 : 0;

        return {
            totalClients: totalClientsInPeriod,
            newClients: newClientsInPeriodCount,
            repeatClients: repeatClientsCount,
            repeatPurchaseRate,
            retentionRate,
            avgLifespan: avgLifespanDays / 30.44,
            medianLifespan: medianLifespanDays / 30.44,
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
        medianLifespan: { value: currentMetrics.medianLifespan, change: calculateChange(currentMetrics.medianLifespan, prevMetrics.medianLifespan) },
    };
}

export async function getOrderCountAnalytics(from: string, to: string, sources?: string[]): Promise<OrderCountAnalytics> {
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
    
    const sourceFilter = sources ? { source: { $in: sources } } : {};

    const getPeriodStats = async (start: Date, end: Date): Promise<PeriodOrderStats> => {
        const startStr = format(start, 'yyyy-MM-dd');
        const endStr = format(end, 'yyyy-MM-dd');

        const ordersCol = await getOrdersCollection();
        const clientsCol = await getClientsCollection();

        const ordersInPeriod = await ordersCol.find({
            date: { $gte: startStr, $lte: endStr },
            ...sourceFilter
        }).toArray();

        const completedOrders = ordersInPeriod.filter(o => o.status === 'Completed');
        const cancelledOrdersCount = ordersInPeriod.filter(o => o.status === 'Cancelled').length;

        if (completedOrders.length === 0) {
            return { total: 0, fromNewBuyers: 0, fromRepeatBuyers: 0, cancelled: cancelledOrdersCount, avgRating: 0 };
        }
        
        const clientUsernamesInPeriod = [...new Set(completedOrders.map(o => o.clientUsername))];

        const clientsFromDB = await clientsCol.find(
            { username: { $in: clientUsernamesInPeriod }, ...sourceFilter },
            { projection: { username: 1, clientSince: 1 } }
        ).toArray();
        
        const periodStartDate = parseISO(startStr);

        const newBuyerUsernames = new Set<string>();
        const repeatBuyerUsernames = new Set<string>();
        
        for (const client of clientsFromDB) {
            const clientSinceDate = parseISO(client.clientSince as string);
            if (clientSinceDate >= periodStartDate) {
                newBuyerUsernames.add(client.username);
            } else {
                repeatBuyerUsernames.add(client.username);
            }
        }
        
        const newBuyerOrders = completedOrders.filter(o => newBuyerUsernames.has(o.clientUsername)).length;
        const repeatBuyerOrders = completedOrders.filter(o => repeatBuyerUsernames.has(o.clientUsername)).length;

        const ratedOrders = completedOrders.filter(o => o.rating != null);
        const avgRating = ratedOrders.length > 0
            ? ratedOrders.reduce((sum, o) => sum + (o.rating ?? 0), 0) / ratedOrders.length
            : 0;
        
        return { total: completedOrders.length, fromNewBuyers: newBuyerOrders, fromRepeatBuyers: repeatBuyerOrders, cancelled: cancelledOrdersCount, avgRating };
    };

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

export async function getFinancialMetrics(from: string, to: string, sources?: string[]): Promise<FinancialMetricData> {
    const fromDate = parseISO(from);
    const toDate = parseISO(to);

    const durationDays = differenceInDays(toDate, fromDate);
    if (durationDays < 0) throw new Error("Invalid date range for financial metrics.");

    // Define all 3 periods
    const p2End = toDate;
    const p2Start = fromDate;
    const p1End = subDays(p2Start, 1);
    const p1Start = subDays(p1End, durationDays);
    const p0End = subDays(p1Start, 1);
    const p0Start = subDays(p0End, durationDays);
    
    const overallStart = p0Start;
    const overallEnd = p2End;

    const sourceFilter = sources ? { source: { $in: sources } } : {};

    const ordersCol = await getOrdersCollection();
    const expensesCol = await getExpensesCollection();
    const clientsCol = await getClientsCollection();

    // Fetch all data for the entire range at once
    const ordersPromise = ordersCol.find({ date: { $gte: format(overallStart, 'yyyy-MM-dd'), $lte: format(overallEnd, 'yyyy-MM-dd') }, status: 'Completed', ...sourceFilter }).toArray();
    const expensesPromise = expensesCol.find({ date: { $gte: format(overallStart, 'yyyy-MM-dd'), $lte: format(overallEnd, 'yyyy-MM-dd') } }).toArray();
    const newClientsPromise = clientsCol.find({ clientSince: { $gte: format(overallStart, 'yyyy-MM-dd'), $lte: format(overallEnd, 'yyyy-MM-dd') }, ...sourceFilter }).toArray();
    const allClientsPromise = clientsCol.find({ ...sourceFilter }).toArray();

    const [allOrders, allExpenses, allNewClients, allClients] = await Promise.all([ordersPromise, expensesPromise, newClientsPromise, allClientsPromise]);
    
    const calculateMetricsForPeriod = (start: Date, end: Date) => {
        const startStr = format(start, 'yyyy-MM-dd');
        const endStr = format(end, 'yyyy-MM-dd');
        
        const periodOrders = allOrders.filter(o => o.date >= startStr && o.date <= endStr);
        const periodExpenses = allExpenses.filter(e => e.date >= startStr && e.date <= endStr);
        const periodNewClients = allNewClients.filter(c => c.clientSince >= startStr && c.clientSince <= endStr);
        
        const totalRevenue = periodOrders.reduce((sum, o) => sum + o.amount, 0);
        const totalOrders = periodOrders.length;
        const totalExpenses = periodExpenses.reduce((sum, e) => sum + e.amount, 0);
        const salaryExpenses = periodExpenses.filter(e => e.category === 'Salary').reduce((sum, e) => sum + e.amount, 0);
        const marketingExpenses = periodExpenses.filter(e => e.category === 'Marketing').reduce((sum, e) => sum + e.amount, 0);

        const netProfit = totalRevenue - totalExpenses;
        const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
        const grossMargin = totalRevenue > 0 ? ((totalRevenue - salaryExpenses) / totalRevenue) * 100 : 0;
        const cac = periodNewClients.length > 0 ? marketingExpenses / periodNewClients.length : 0;
        const aov = totalOrders > 0 ? totalRevenue / totalOrders : 0;

        // CLTV Simplified Calculation (more complex calculation is too slow)
        const periodClientUsernames = new Set(periodOrders.map(o => o.clientUsername));
        const totalPeriodClients = periodClientUsernames.size;
        const clientOrderCounts = periodOrders.reduce((acc, order) => { acc[order.clientUsername] = (acc[order.clientUsername] || 0) + 1; return acc; }, {} as Record<string, number>);
        const repeatClientsCount = Object.values(clientOrderCounts).filter(count => count > 1).length;
        const repeatPurchaseRate = totalPeriodClients > 0 ? repeatClientsCount / totalPeriodClients : 0;
        const avgLifespanMonths = 12; // Simplified assumption
        const cltv = aov * repeatPurchaseRate * avgLifespanMonths;

        return { totalRevenue, totalExpenses, netProfit, profitMargin, grossMargin, cac, aov, cltv };
    };

    const timeSeries = eachDayOfInterval({ start: p2Start, end: p2End }).map(date => {
        const dailyMetrics = calculateMetricsForPeriod(date, date);
        return {
            date: format(date, 'yyyy-MM-dd'),
            ...dailyMetrics,
        };
    });

    const [metricsP2, metricsP1, metricsP0] = [
        calculateMetricsForPeriod(p2Start, p2End),
        calculateMetricsForPeriod(p1Start, p1End),
        calculateMetricsForPeriod(p0Start, p0End),
    ];

    const calculateChangePercentage = (current: number, previous: number) => {
        if (previous === 0) return current !== 0 ? 100 : 0;
        return ((current - previous) / previous) * 100;
    };
    
    return {
        totalRevenue: { value: metricsP2.totalRevenue, change: calculateChangePercentage(metricsP2.totalRevenue, metricsP1.totalRevenue), previousPeriodChange: calculateChangePercentage(metricsP1.totalRevenue, metricsP0.totalRevenue), previousValue: metricsP1.totalRevenue },
        totalExpenses: { value: metricsP2.totalExpenses, change: calculateChangePercentage(metricsP2.totalExpenses, metricsP1.totalExpenses), previousPeriodChange: calculateChangePercentage(metricsP1.totalExpenses, metricsP0.totalExpenses), previousValue: metricsP1.totalExpenses },
        netProfit: { value: metricsP2.netProfit, change: calculateChangePercentage(metricsP2.netProfit, metricsP1.netProfit), previousPeriodChange: calculateChangePercentage(metricsP1.netProfit, metricsP0.netProfit), previousValue: metricsP1.netProfit },
        profitMargin: { value: metricsP2.profitMargin, change: metricsP2.profitMargin - metricsP1.profitMargin, previousPeriodChange: metricsP1.profitMargin - metricsP0.profitMargin, previousValue: metricsP1.profitMargin },
        grossMargin: { value: metricsP2.grossMargin, change: metricsP2.grossMargin - metricsP1.grossMargin, previousPeriodChange: metricsP1.grossMargin - metricsP0.grossMargin, previousValue: metricsP1.grossMargin },
        cac: { value: metricsP2.cac, change: calculateChangePercentage(metricsP2.cac, metricsP1.cac), previousPeriodChange: calculateChangePercentage(metricsP1.cac, metricsP0.cac), previousValue: metricsP1.cac },
        aov: { value: metricsP2.aov, change: calculateChangePercentage(metricsP2.aov, metricsP1.aov), previousPeriodChange: calculateChangePercentage(metricsP1.aov, metricsP0.aov), previousValue: metricsP1.aov },
        cltv: { value: metricsP2.cltv, change: calculateChangePercentage(metricsP2.cltv, metricsP1.cltv), previousPeriodChange: calculateChangePercentage(metricsP1.cltv, metricsP0.cltv), previousValue: metricsP1.cltv },
        timeSeries,
    };
}



export async function getMarketingMetrics(from: string, to: string, sources: string[]): Promise<MarketingMetricData> {
    const fromDate = parseISO(from);
    const toDate = parseISO(to);

    const durationDays = differenceInDays(toDate, fromDate);
    if (durationDays < 0) throw new Error("Invalid date range.");

    const P2_to = toDate;
    const P2_from = fromDate;
    const P1_to = subDays(P2_from, 1);
    const P1_from = subDays(P1_to, durationDays);

    const calculateMetricsForPeriod = async (start: Date, end: Date) => {
        const startStr = format(start, 'yyyy-MM-dd');
        const endStr = format(end, 'yyyy-MM-dd');

        const sourceFilter = { source: { $in: sources } };

        const expensesCol = await getExpensesCollection();
        const messagesCol = await getMessagesCollection();
        const ordersCol = await getOrdersCollection();
        const incomesCol = await getIncomesCollection();

        // Get source IDs from names
        const incomeSourceDocs = await incomesCol.find({ name: { $in: sources } }).project({ _id: 1 }).toArray();
        const sourceIds = incomeSourceDocs.map(s => s._id.toString());
        
        const marketingExpensesPromise = expensesCol.aggregate([
            { $match: { date: { $gte: startStr, $lte: endStr }, category: 'Marketing' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]).toArray();

        const messagesPromise = messagesCol.aggregate([
            { $match: { sourceId: { $in: sourceIds }, date: { $gte: startStr, $lte: endStr } } },
            { $group: { _id: null, total: { $sum: '$messages' } } }
        ]).toArray();

        const revenuePromise = ordersCol.aggregate([
            { $match: { date: { $gte: startStr, $lte: endStr }, status: 'Completed', ...sourceFilter } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]).toArray();

        const [marketingExpensesRes, messagesRes, revenueRes] = await Promise.all([
            marketingExpensesPromise,
            messagesPromise,
            revenuePromise
        ]);
        
        const marketingExpenses = marketingExpensesRes[0]?.total || 0;
        const totalMessages = messagesRes[0]?.total || 0;
        const totalRevenue = revenueRes[0]?.total || 0;

        const cpl = totalMessages > 0 ? marketingExpenses / totalMessages : 0;
        const romi = marketingExpenses > 0 ? ((totalRevenue - marketingExpenses) / marketingExpenses) * 100 : 0;

        return { cpl, romi };
    };

    const [metricsP2, metricsP1] = await Promise.all([
        calculateMetricsForPeriod(P2_from, P2_to),
        calculateMetricsForPeriod(P1_from, P1_to),
    ]);

    const calculateChange = (current: number, previous: number) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / previous) * 100;
    };
    
    return {
        cpl: {
            value: metricsP2.cpl,
            change: calculateChange(metricsP2.cpl, metricsP1.cpl),
            previousValue: metricsP1.cpl,
        },
        romi: {
            value: metricsP2.romi,
            change: calculateChange(metricsP2.romi, metricsP1.romi),
            previousValue: metricsP1.romi,
        }
    };
}

export async function getPerformanceMetrics(from: string, to: string, sources: string[]): Promise<PerformanceMetricData> {
    const fromDate = parseISO(from);
    const toDate = parseISO(to);

    const durationDays = differenceInDays(toDate, fromDate);
    if (durationDays < 0) throw new Error("Invalid date range.");

    const p2_to = toDate;
    const p2_from = fromDate;
    const p1_to = subDays(p2_from, 1);
    const p1_from = subDays(p1_to, durationDays);
    const p0_to = subDays(p1_from, 1);
    const p0_from = subDays(p0_to, durationDays);

    const calculateMetricsForPeriod = async (start: Date, end: Date) => {
        const startStr = format(start, 'yyyy-MM-dd');
        const endStr = format(end, 'yyyy-MM-dd');
        
        const incomesCol = await getIncomesCollection();
        const sourceDocs = await incomesCol.find({ name: { $in: sources } }).project({ _id: 1, gigs: 1 }).toArray();
        const sourceIds = sourceDocs.map(s => s._id.toString());
        const allGigIds = sourceDocs.flatMap(s => s.gigs.map(g => g.id));
        
        const gigPerformancesCol = await getGigPerformancesCollection();
        const messagesCol = await getMessagesCollection();
        
        const perfPromise = gigPerformancesCol.aggregate([
            { $match: { gigId: { $in: allGigIds }, date: { $gte: startStr, $lte: endStr } } },
            { $group: { _id: null, impressions: { $sum: '$impressions' }, clicks: { $sum: '$clicks' } } }
        ]).toArray();
        
        const messagesPromise = messagesCol.aggregate([
            { $match: { sourceId: { $in: sourceIds }, date: { $gte: startStr, $lte: endStr } } },
            { $group: { _id: null, messages: { $sum: '$messages' } } }
        ]).toArray();
        
        const [perfRes, messagesRes] = await Promise.all([perfPromise, messagesPromise]);
        
        const impressions = perfRes[0]?.impressions || 0;
        const clicks = perfRes[0]?.clicks || 0;
        const messages = messagesRes[0]?.messages || 0;
        const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
        
        return { impressions, clicks, messages, ctr };
    };

    const [metricsP2, metricsP1, metricsP0] = await Promise.all([
        calculateMetricsForPeriod(p2_from, p2_to),
        calculateMetricsForPeriod(p1_from, p1_to),
        calculateMetricsForPeriod(p0_from, p0_to),
    ]);
    
    const calculateChangePercentage = (current: number, previous: number) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / previous) * 100;
    };

    return {
        impressions: {
            value: metricsP2.impressions,
            change: calculateChangePercentage(metricsP2.impressions, metricsP1.impressions),
            previousPeriodChange: calculateChangePercentage(metricsP1.impressions, metricsP0.impressions),
            previousValue: metricsP1.impressions,
        },
        clicks: {
            value: metricsP2.clicks,
            change: calculateChangePercentage(metricsP2.clicks, metricsP1.clicks),
            previousPeriodChange: calculateChangePercentage(metricsP1.clicks, metricsP0.clicks),
            previousValue: metricsP1.clicks,
        },
        messages: {
            value: metricsP2.messages,
            change: calculateChangePercentage(metricsP2.messages, metricsP1.messages),
            previousPeriodChange: calculateChangePercentage(metricsP1.messages, metricsP0.messages),
            previousValue: metricsP1.messages,
        },
        ctr: {
            value: metricsP2.ctr,
            change: metricsP2.ctr - metricsP1.ctr, // Absolute change for percentage
            previousPeriodChange: metricsP1.ctr - metricsP0.ctr,
            previousValue: metricsP1.ctr,
        },
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
                .filter((d: { year: number; }) => d.year === year)
                .forEach((d: { month: number; orders: any; }) => {
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
