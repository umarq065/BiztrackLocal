
"use client";

import { useMemo, lazy, Suspense, useState } from "react";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Eye,
  MousePointerClick,
  MessageSquare,
  ShoppingCart,
  DollarSign,
  CreditCard,
  Calendar,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import StatCard from "@/components/dashboard/stat-card";
import { Skeleton } from "@/components/ui/skeleton";
import NProgressLink from "@/components/layout/nprogress-link";
import { Button } from "@/components/ui/button";
import { initialIncomeSources, type IncomeSource } from "@/lib/data/incomes-data";
import { format } from "date-fns";

import { type ChartConfig } from "@/components/ui/chart";
import type { DateRange } from "react-day-picker";
import { DateFilter } from "@/components/dashboard/date-filter";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

const SourcePerformanceChart = lazy(() => import('@/components/incomes/source-performance-chart').then(m => ({ default: m.SourcePerformanceChart })));

const chartConfig = {
  impressions: { label: "Impressions", color: "hsl(var(--chart-1))" },
  clicks: { label: "Clicks", color: "hsl(var(--chart-2))" },
  messages: { label: "Messages", color: "hsl(var(--chart-3))" },
  orders: { label: "Orders", color: "hsl(var(--chart-4))" },
  prevImpressions: { label: "Prev. Impressions", color: "hsl(var(--chart-1))" },
  prevClicks: { label: "Prev. Clicks", color: "hsl(var(--chart-2))" },
  prevMessages: { label: "Prev. Messages", color: "hsl(var(--chart-3))" },
  prevOrders: { label: "Prev. Orders", color: "hsl(var(--chart-4))" },
} satisfies ChartConfig;

const getInitialDateRangeForSource = (source: IncomeSource): DateRange => {
    const allDates = [
      ...(source.gigs.flatMap(g => g.analytics?.map(a => new Date(a.date)) ?? [])),
      ...(source.dataPoints?.map(dp => new Date(dp.date)) ?? [])
    ].filter(d => d && !isNaN(d.getTime()));

    if (allDates.length > 0) {
        const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())));
        const fromDate = new Date(maxDate);
        fromDate.setDate(fromDate.getDate() - 29);
        return { from: fromDate, to: maxDate };
    }
    
    const today = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setDate(today.getDate() - 30);
    return { from: oneMonthAgo, to: today };
};

export default function SourceAnalyticsPage({
  params,
}: {
  params: { sourceId: string };
}) {
  const source = initialIncomeSources.find((s) => s.id === params.sourceId);

  if (!source) {
    notFound();
  }
  
  const [date, setDate] = useState<DateRange | undefined>(() => getInitialDateRangeForSource(source));
  const [activeMetrics, setActiveMetrics] = useState({
    impressions: true,
    clicks: true,
    orders: true,
    messages: true,
  });
  const [showComparison, setShowComparison] = useState(false);

  const handleMetricToggle = (metric: keyof typeof activeMetrics) => {
    setActiveMetrics((prev) => ({
      ...prev,
      [metric]: !prev[metric],
    }));
  };

  const {
    chartDataForRender,
    sourceStats,
  } = useMemo(() => {
    const calculateMetricsForPeriod = (periodFrom?: Date, periodTo?: Date) => {
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

    const currentPeriodMetrics = calculateMetricsForPeriod(date?.from, date?.to);

    let prevPeriodMetrics = { impressions: 0, clicks: 0, orders: 0, revenue: 0, sourceMessages: 0, aggregatedAnalytics: [], aggregatedMessages: [] };
    if (date?.from && date.to) {
        const duration = date.to.getTime() - date.from.getTime();
        const prevTo = new Date(date.from.getTime() - 1);
        const prevFrom = new Date(prevTo.getTime() - duration);
        prevPeriodMetrics = calculateMetricsForPeriod(prevFrom, prevTo);
    }
    
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
  }, [source, date]);

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center">
        <h1 className="font-headline text-lg font-semibold md:text-2xl">
          Source Analytics: <span className="text-primary">{source.name}</span>
        </h1>
        <div className="ml-auto flex items-center gap-2">
          <DateFilter date={date} setDate={setDate} />
          <NProgressLink href="/incomes">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Incomes
            </Button>
          </NProgressLink>
        </div>
      </div>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Overall Performance</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {sourceStats.map((stat) => (
            <StatCard key={stat.title} {...stat} />
          ))}
        </div>
      </section>

      <div className="grid gap-4">
        <Card>
            <CardHeader>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <CardTitle>Source Performance</CardTitle>
                        <CardDescription>Impressions, clicks, orders, and messages from this source.</CardDescription>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                        {(Object.keys(chartConfig) as Array<keyof typeof chartConfig>).filter(k => !k.startsWith('prev')).map((metric) => (
                            <div key={metric} className="flex items-center gap-2">
                                <Checkbox
                                    id={`metric-${metric}`}
                                    checked={activeMetrics[metric as keyof typeof activeMetrics]}
                                    onCheckedChange={() => handleMetricToggle(metric as keyof typeof activeMetrics)}
                                    style={{
                                        '--chart-color': chartConfig[metric as keyof typeof chartConfig].color,
                                    } as React.CSSProperties}
                                    className="data-[state=checked]:bg-[var(--chart-color)] data-[state=checked]:border-[var(--chart-color)] border-muted-foreground"
                                />
                                <Label htmlFor={`metric-${metric}`} className="capitalize">
                                    {chartConfig[metric as keyof typeof chartConfig].label}
                                </Label>
                            </div>
                        ))}
                         <div className="flex items-center gap-2">
                            <Checkbox id="show-comparison" checked={showComparison} onCheckedChange={(c) => setShowComparison(!!c)} />
                            <Label htmlFor="show-comparison">Compare</Label>
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pl-2">
                <Suspense fallback={<Skeleton className="h-[300px] w-full" />}>
                   <SourcePerformanceChart 
                     data={chartDataForRender} 
                     config={chartConfig}
                     activeMetrics={activeMetrics}
                     showComparison={showComparison}
                   />
                </Suspense>
            </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>Gigs in this Source</CardTitle>
            <CardDescription>A list of all gigs associated with {source.name}.</CardDescription>
        </CardHeader>
        <CardContent>
             <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Gig Name</TableHead>
                        <TableHead>Date Added</TableHead>
                        <TableHead className="text-right">Messages</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {source.gigs.map(gig => (
                         <TableRow key={gig.id}>
                            <TableCell className="font-medium">
                                <NProgressLink href={`/gigs/${gig.id}`} className="hover:underline">
                                    {gig.name}
                                </NProgressLink>
                            </TableCell>
                            <TableCell>{format(new Date(gig.date.replace(/-/g, '/')), "PPP")}</TableCell>
                            <TableCell className="text-right">{gig.messages ?? <span className="text-muted-foreground">N/A</span>}</TableCell>
                         </TableRow>
                    ))}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
    </main>
  );
}
