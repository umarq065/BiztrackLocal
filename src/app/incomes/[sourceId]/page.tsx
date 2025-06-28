
"use client";

import { useMemo, lazy, Suspense, useState, useEffect } from "react";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Eye,
  MousePointerClick,
  MessageSquare,
  ShoppingCart,
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
import { initialIncomeSources } from "@/lib/data/incomes-data";
import { format } from "date-fns";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  ChartContainer,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { DateRange } from "react-day-picker";
import { DateFilter } from "@/components/dashboard/date-filter";

const chartConfig = {
  impressions: { label: "Impressions", color: "hsl(var(--chart-1))" },
  clicks: { label: "Clicks", color: "hsl(var(--chart-2))" },
  messages: { label: "Messages", color: "hsl(var(--chart-3))" },
  orders: { label: "Orders", color: "hsl(var(--chart-4))" },
} satisfies ChartConfig;

const ChartComponent = ({ data, config, lines, yAxisLabel }: { data: any[], config: ChartConfig, lines: {key: string, color: string}[], yAxisLabel?: string }) => {
    if (!data || data.length === 0) {
        return (
            <div className="flex h-[300px] w-full items-center justify-center">
                <p className="text-muted-foreground">No data to display chart.</p>
            </div>
        );
    }
    return (
        <ChartContainer config={config} className="h-[300px] w-full">
            <LineChart accessibilityLayer data={data} margin={{ top: 20, right: 20, left: 10, bottom: 0 }}>
                <CartesianGrid vertical={false} />
                <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => format(new Date(value), "MMM d")}
                />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} label={yAxisLabel} />
                <Tooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                {lines.map(line => (
                     <Line key={line.key} dataKey={line.key} type="natural" stroke={line.color} strokeWidth={2} dot={false} />
                ))}
            </LineChart>
        </ChartContainer>
    );
}

export default function SourceAnalyticsPage({
  params,
}: {
  params: { sourceId: string };
}) {
  const source = initialIncomeSources.find((s) => s.id === params.sourceId);
  const [date, setDate] = useState<DateRange | undefined>();

  if (!source) {
    notFound();
  }

  useEffect(() => {
    const allDates = [
      ...(source.gigs.flatMap(g => g.analytics?.map(a => new Date(a.date)) ?? [])),
      ...(source.dataPoints?.map(dp => new Date(dp.date)) ?? [])
    ].filter(d => d && !isNaN(d.getTime()));

    if (allDates.length > 0) {
        const minDate = new Date(Math.min(...allDates.map(d => d.getTime())));
        const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())));
        setDate({ from: minDate, to: maxDate });
    } else {
        const today = new Date();
        const oneMonthAgo = new Date(new Date().setDate(today.getDate() - 30));
        setDate({ from: oneMonthAgo, to: today });
    }
  }, [source]);


  const {
    combinedChartData,
    sourceStats,
  } = useMemo(() => {
    const calculateMetricsForPeriod = (periodFrom?: Date, periodTo?: Date) => {
        if (!periodFrom || !periodTo) {
            return { impressions: 0, clicks: 0, orders: 0, sourceMessages: 0, aggregatedAnalytics: [], aggregatedMessages: [] };
        }
        
        const isDateInRange = (itemDate: Date) => {
            if (itemDate < periodFrom) return false;
            const toDateEnd = new Date(periodTo);
            toDateEnd.setHours(23, 59, 59, 999);
            if (itemDate > toDateEnd) return false;
            return true;
        }

        const analyticsMap = new Map<string, { impressions: number; clicks: number; orders: number }>();
        source.gigs.flatMap(gig => gig.analytics ?? [])
            .filter(analytic => isDateInRange(new Date(analytic.date)))
            .forEach(analytic => {
                const existing = analyticsMap.get(analytic.date) || { impressions: 0, clicks: 0, orders: 0 };
                analyticsMap.set(analytic.date, {
                    impressions: existing.impressions + analytic.impressions,
                    clicks: existing.clicks + analytic.clicks,
                    orders: existing.orders + (analytic.orders || 0),
                });
            });
        const aggregatedAnalyticsData = Array.from(analyticsMap.entries())
            .map(([date, data]) => ({ date, ...data }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        const impressions = aggregatedAnalyticsData.reduce((acc, curr) => acc + curr.impressions, 0);
        const clicks = aggregatedAnalyticsData.reduce((acc, curr) => acc + curr.clicks, 0);
        const orders = aggregatedAnalyticsData.reduce((acc, curr) => acc + (curr.orders || 0), 0);

        const messagesMap = new Map<string, { messages: number }>();
        (source.dataPoints ?? [])
            .filter(dp => isDateInRange(new Date(dp.date)))
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
        
        return { impressions, clicks, orders, sourceMessages, aggregatedAnalytics: aggregatedAnalyticsData, aggregatedMessages: aggregatedMessagesData };
    };

    const currentPeriodMetrics = calculateMetricsForPeriod(date?.from, date?.to);

    let prevPeriodMetrics = { impressions: 0, clicks: 0, orders: 0, sourceMessages: 0 };
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
    
    const finalSourceStats = [
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


    return {
      combinedChartData: finalCombinedChartData,
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
          <NProgressLink href="/incomes" passHref>
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
                <CardTitle>Source Performance</CardTitle>
                <CardDescription>Impressions, clicks, orders, and messages from this source.</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
                <Suspense fallback={<Skeleton className="h-[300px] w-full" />}>
                   <ChartComponent 
                     data={combinedChartData} 
                     config={chartConfig}
                     lines={[
                         { key: "impressions", color: "var(--color-impressions)" },
                         { key: "clicks", color: "var(--color-clicks)" },
                         { key: "orders", color: "var(--color-orders)" },
                         { key: "messages", color: "var(--color-messages)" },
                     ]}
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
                            <TableCell>{format(new Date(gig.date), "PPP")}</TableCell>
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
