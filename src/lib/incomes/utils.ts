
"use client";

import { type DateRange } from "react-day-picker";
import { type IncomeSource } from "@/lib/data/incomes-data";
import { initialExpenses } from "@/lib/data/expenses-data";

const expenses = initialExpenses;

const calculateMetricsForPeriod = (source: IncomeSource, periodFrom?: Date, periodTo?: Date) => {
    if (!periodFrom || !periodTo) {
        return { impressions: 0, clicks: 0, orders: 0, revenue: 0, sourceMessages: 0, aggregatedAnalytics: [], aggregatedMessages: [] };
    }
    
    const isDateInRange = (itemDate: Date) => {
        if (itemDate < periodFrom) return false;
        const toDateEnd = new Date(periodTo);
        toDateEnd.setHours(23, 59, 59, 999);
        if (itemDate > toDateEnd) return false;
        return true;
    }

    const analyticsMap = new Map<string, { impressions: number; clicks: number; orders: number; revenue: number; }>();
    source.gigs.flatMap(gig => gig.analytics ?? [])
        .filter(analytic => isDateInRange(new Date(analytic.date.replace(/-/g, '/'))))
        .forEach(analytic => {
            const existing = analyticsMap.get(analytic.date) || { impressions: 0, clicks: 0, orders: 0, revenue: 0 };
            analyticsMap.set(analytic.date, {
                impressions: existing.impressions + analytic.impressions,
                clicks: existing.clicks + analytic.clicks,
                orders: existing.orders + (analytic.orders || 0),
                revenue: existing.revenue + (analytic.revenue || 0),
            });
        });
    const aggregatedAnalyticsData = Array.from(analyticsMap.entries())
        .map(([date, data]) => ({ date, ...data }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    const impressions = aggregatedAnalyticsData.reduce((acc, curr) => acc + curr.impressions, 0);
    const clicks = aggregatedAnalyticsData.reduce((acc, curr) => acc + curr.clicks, 0);
    const orders = aggregatedAnalyticsData.reduce((acc, curr) => acc + (curr.orders || 0), 0);
    const revenue = aggregatedAnalyticsData.reduce((acc, curr) => acc + (curr.revenue || 0), 0);

    const messagesMap = new Map<string, { messages: number }>();
    (source.dataPoints ?? [])
        .filter(dp => isDateInRange(new Date(dp.date.replace(/-/g, '/'))))
        .forEach(dp => {
            const existing = messagesMap.get(dp.date) || { messages: 0 };
            messagesMap.set(dp.date, {
                messages: existing.messages + dp.messages,
            });
        });
    const aggregatedMessagesData = Array.from(messagesMap.entries())
        .map(([date, data]) => ({ date, ...data }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const sourceMessages = aggregatedMessagesData.reduce((acc, curr) => acc + curr.messages, 0);
    
    return { impressions, clicks, orders, revenue, sourceMessages, aggregatedAnalytics: aggregatedAnalyticsData, aggregatedMessages: aggregatedMessagesData };
};


const calculateChange = (current: number, previous: number) => {
    if (previous === 0) {
        return current > 0 ? { change: `+100%`, changeType: "increase" as const } : {};
    }
    if (current === 0 && previous > 0) {
        return { change: `-100%`, changeType: "decrease" as const };
    }
    const diff = ((current - previous) / previous) * 100;
    if (Math.abs(diff) < 0.1) return {};
    return {
        change: `${diff >= 0 ? '+' : ''}${diff.toFixed(1)}%`,
        changeType: diff >= 0 ? "increase" as const : "decrease" as const,
    };
};

export function processSourceData(source: IncomeSource, date: DateRange | undefined) {
    const currentPeriodMetrics = calculateMetricsForPeriod(source, date?.from, date?.to);

    let prevPeriodMetrics = { impressions: 0, clicks: 0, orders: 0, revenue: 0, sourceMessages: 0, aggregatedAnalytics: [], aggregatedMessages: [] };
    if (date?.from && date.to) {
        const duration = date.to.getTime() - date.from.getTime();
        const prevTo = new Date(date.from.getTime() - 1);
        const prevFrom = new Date(prevTo.getTime() - duration);
        prevPeriodMetrics = calculateMetricsForPeriod(source, prevFrom, prevTo);
    }
    
    const impressionsChange = calculateChange(currentPeriodMetrics.impressions, prevPeriodMetrics.impressions);
    const clicksChange = calculateChange(currentPeriodMetrics.clicks, prevPeriodMetrics.clicks);
    const messagesChange = calculateChange(currentPeriodMetrics.sourceMessages, prevPeriodMetrics.sourceMessages);
    const ordersChange = calculateChange(currentPeriodMetrics.orders, prevPeriodMetrics.orders);
    const revenueChange = calculateChange(currentPeriodMetrics.revenue, prevPeriodMetrics.revenue);
    
    const avgOrderValue = currentPeriodMetrics.orders > 0 ? currentPeriodMetrics.revenue / currentPeriodMetrics.orders : 0;
    const prevAvgOrderValue = prevPeriodMetrics.orders > 0 ? prevPeriodMetrics.revenue / prevPeriodMetrics.orders : 0;
    const aovChange = calculateChange(avgOrderValue, prevAvgOrderValue);

    let avgMonthlyEarning = 0;
    if (date?.from && date?.to && currentPeriodMetrics.revenue > 0) {
        const days = (date.to.getTime() - date.from.getTime()) / (1000 * 60 * 60 * 24) + 1;
        avgMonthlyEarning = (currentPeriodMetrics.revenue / days) * 30.44;
    }
    let prevAvgMonthlyEarning = 0;
    if (date?.from && date?.to && prevPeriodMetrics.revenue > 0) {
        const duration = date.to.getTime() - date.from.getTime();
        const prevTo = new Date(date.from.getTime() - 1);
        const prevFrom = new Date(prevTo.getTime() - duration);
        const prevDays = (prevTo.getTime() - prevFrom.getTime()) / (1000 * 60 * 60 * 24) + 1;
        prevAvgMonthlyEarning = (prevPeriodMetrics.revenue / prevDays) * 30.44;
    }
    const avgMonthlyEarningChange = calculateChange(avgMonthlyEarning, prevAvgMonthlyEarning);
    
    const finalSourceStats = [
      { 
        icon: "DollarSign", 
        title: "Total Revenue", 
        value: `$${currentPeriodMetrics.revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 
        description: "vs. previous period",
        ...revenueChange
      },
      { 
        icon: "CreditCard", 
        title: "Avg. Order Value", 
        value: `$${avgOrderValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 
        description: "vs. previous period",
        ...aovChange
      },
      { 
        icon: "Calendar", 
        title: "Avg. Monthly Earning", 
        value: `$${avgMonthlyEarning.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 
        description: "vs. previous period",
        ...avgMonthlyEarningChange
      },
      { 
        icon: "Eye", 
        title: "Total Impressions", 
        value: currentPeriodMetrics.impressions.toLocaleString(), 
        description: "vs. previous period",
        ...impressionsChange
      },
      { 
        icon: "MousePointerClick", 
        title: "Total Clicks", 
        value: currentPeriodMetrics.clicks.toLocaleString(), 
        description: "vs. previous period",
        ...clicksChange
      },
       { 
        icon: "ShoppingCart", 
        title: "Total Orders", 
        value: currentPeriodMetrics.orders.toLocaleString(), 
        description: "vs. previous period",
        ...ordersChange
      },
      { 
        icon: "MessageSquare", 
        title: "Source Messages", 
        value: currentPeriodMetrics.sourceMessages.toLocaleString(), 
        description: "vs. previous period",
        ...messagesChange
      },
    ];
    
    const combinedMap = new Map<string, { impressions?: number; clicks?: number; orders?: number; messages?: number }>();
    currentPeriodMetrics.aggregatedAnalytics.forEach(item => {
        combinedMap.set(item.date, { ...combinedMap.get(item.date), impressions: item.impressions, clicks: item.clicks, orders: item.orders });
    });
    currentPeriodMetrics.aggregatedMessages.forEach(item => {
        combinedMap.set(item.date, { ...combinedMap.get(item.date), messages: item.messages });
    });
    const finalCombinedChartData = Array.from(combinedMap.entries())
        .map(([date, data]) => ({ date, ...data }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const prevCombinedMap = new Map<string, { impressions?: number; clicks?: number; orders?: number; messages?: number }>();
    prevPeriodMetrics.aggregatedAnalytics.forEach(item => {
        prevCombinedMap.set(item.date, { ...prevCombinedMap.get(item.date), impressions: item.impressions, clicks: item.clicks, orders: item.orders });
    });
    prevPeriodMetrics.aggregatedMessages.forEach(item => {
        prevCombinedMap.set(item.date, { ...prevCombinedMap.get(item.date), messages: item.messages });
    });
    const prevCombinedChartData = Array.from(prevCombinedMap.entries())
        .map(([date, data]) => ({ date, ...data }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const finalChartDataForRender = finalCombinedChartData.map((current, index) => {
        const prev = prevCombinedChartData[index];
        return {
            ...current,
            prevImpressions: prev?.impressions,
            prevClicks: prev?.clicks,
            prevOrders: prev?.orders,
            prevMessages: prev?.messages,
        }
    });

    return {
      chartDataForRender: finalChartDataForRender,
      sourceStats: finalSourceStats,
    };
}
