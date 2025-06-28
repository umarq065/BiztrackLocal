"use client";

import { useState, useMemo, lazy, Suspense } from "react";
import { ArrowUp, ArrowDown, ArrowLeft } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import StatCard from "@/components/dashboard/stat-card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { DateRange } from "react-day-picker";
import { DateFilter } from "@/components/dashboard/date-filter";
import { Skeleton } from "@/components/ui/skeleton";
import NProgressLink from "@/components/layout/nprogress-link";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

const GigAnalyticsChart = lazy(() => import("@/components/gigs/analytics-chart"));

// Mock data for a single gig. In a real app, you'd fetch this.
const gigData = {
  name: "Acme Corp Redesign",
  source: "Web Design",
  creationDate: "2023-01-15",
  stats: [
    {
      icon: "Eye",
      title: "Impressions",
      value: "12,450",
      change: "+20.1%",
      changeType: "increase" as const,
      description: "from last month",
    },
    {
      icon: "MousePointerClick",
      title: "Clicks",
      value: "980",
      change: "+15.2%",
      changeType: "increase" as const,
      description: "from last month",
    },
    {
      icon: "MessageSquare",
      title: "Messages",
      value: "125",
      change: "+30",
      changeType: "increase" as const,
      description: "from last month",
    },
    {
      icon: "ShoppingCart",
      title: "Orders",
      value: "45",
      change: "+5",
      changeType: "increase" as const,
      description: (
        <div className="flex flex-wrap items-center gap-x-2">
          <span>
            RB: 20
            <span className="ml-1 inline-flex items-center text-green-600">
              (40%
              <ArrowUp className="inline h-3 w-3" />)
            </span>
          </span>
          <span>
            NB: 10
            <span className="ml-1 inline-flex items-center text-red-600">
              (50%
              <ArrowDown className="inline h-3 w-3" />)
            </span>
          </span>
        </div>
      ),
    },
    {
      icon: "Percent",
      title: "Click-Through Rate (CTR)",
      value: "7.87%",
      change: "-1.2%",
      changeType: "decrease" as const,
      description: "from last month",
    },
    {
      icon: "DollarSign",
      title: "Revenue",
      value: "$2,250",
      change: "+15%",
      changeType: "increase" as const,
      description: "from last month",
    },
    {
      icon: "ShoppingCart",
      title: "Total Source Orders",
      value: "120",
      description: "All orders from Web Design",
    },
  ],
  analyticsData: [
    { date: "2024-05-01", impressions: 300, clicks: 20, messages: 5, orders: 2 },
    { date: "2024-05-05", impressions: 450, clicks: 35, messages: 10, orders: 4 },
    { date: "2024-05-10", impressions: 600, clicks: 50, messages: 15, orders: 7 },
    { date: "2024-05-15", impressions: 550, clicks: 45, messages: 20, orders: 6 },
    { date: "2024-05-20", impressions: 700, clicks: 60, messages: 25, orders: 9 },
    { date: "2024-05-25", impressions: 820, clicks: 75, messages: 30, orders: 12 },
  ],
  prevAnalyticsData: [
    { date: "2024-04-01", impressions: 280, clicks: 18, messages: 4, orders: 1 },
    { date: "2024-04-05", impressions: 420, clicks: 30, messages: 8, orders: 3 },
    { date: "2024-04-10", impressions: 580, clicks: 48, messages: 12, orders: 5 },
    { date: "2024-04-15", impressions: 520, clicks: 40, messages: 18, orders: 5 },
    { date: "2024-04-20", impressions: 650, clicks: 55, messages: 22, orders: 7 },
    { date: "2024-04-25", impressions: 780, clicks: 70, messages: 28, orders: 10 },
  ],
  mergeHistory: [
    {
      date: "2023-03-10",
      mergedGig: "Old Acme Project",
      action: "Merged into 'Acme Corp Redesign'",
    },
    {
      date: "2023-02-20",
      mergedGig: "Acme Landing Page Draft",
      action: "Merged into 'Acme Corp Redesign'",
    },
  ],
};

const chartConfig = {
    impressions: { label: "Impressions", color: "hsl(var(--chart-1))" },
    clicks: { label: "Clicks", color: "hsl(var(--chart-2))" },
    messages: { label: "Messages", color: "hsl(var(--chart-3))" },
    orders: { label: "Orders", color: "hsl(var(--chart-4))" },
    prevImpressions: { label: "Prev. Impressions", color: "hsl(var(--chart-1))" },
    prevClicks: { label: "Prev. Clicks", color: "hsl(var(--chart-2))" },
    prevMessages: { label: "Prev. Messages", color: "hsl(var(--chart-3))" },
    prevOrders: { label: "Prev. Orders", color: "hsl(var(--chart-4))" },
  } as const;


export default function GigAnalyticsPage({ params }: { params: { gigId: string } }) {
  // In a real app, you would use params.gigId to fetch data.
  // For now, we'll use the mock data.
  const [activeMetrics, setActiveMetrics] = useState<Record<string, boolean>>({
    impressions: true,
    clicks: true,
    messages: true,
    orders: true,
  });
  const [showComparison, setShowComparison] = useState(false);

  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(gigData.analyticsData[0].date),
    to: new Date(gigData.analyticsData[gigData.analyticsData.length - 1].date),
  });

  const handleMetricToggle = (metric: keyof typeof chartConfig) => {
    setActiveMetrics((prev) => ({
      ...prev,
      [metric]: !prev[metric],
    }));
  };

  const chartDataForRender = useMemo(() => {
    const filterDataByPeriod = (dataToFilter: typeof gigData.analyticsData, periodFrom?: Date, periodTo?: Date) => {
        if (!periodFrom || !periodTo) return [];
        return dataToFilter.filter(item => {
            const itemDate = new Date(item.date);
            if (itemDate < periodFrom) return false;
            const toDateEnd = new Date(periodTo);
            toDateEnd.setHours(23, 59, 59, 999);
            if (itemDate > toDateEnd) return false;
            return true;
        });
    }

    const currentPeriodData = filterDataByPeriod(gigData.analyticsData, date?.from, date?.to);

    let prevPeriodData: typeof gigData.analyticsData = [];
    if (date?.from && date.to) {
        const duration = date.to.getTime() - date.from.getTime();
        const prevTo = new Date(date.from.getTime() - 1);
        const prevFrom = new Date(prevTo.getTime() - duration);
        prevPeriodData = filterDataByPeriod(gigData.prevAnalyticsData, prevFrom, prevTo);
    }
    
    return currentPeriodData.map((current, index) => {
        const prev = prevPeriodData[index];
        return {
            ...current,
            prevImpressions: prev?.impressions,
            prevClicks: prev?.clicks,
            prevMessages: prev?.messages,
            prevOrders: prev?.orders,
        }
    });

  }, [date]);

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center">
        <h1 className="font-headline text-lg font-semibold md:text-2xl">
          Gig Analytics: <span className="text-primary">{gigData.name}</span>
        </h1>
        <div className="ml-auto flex items-center gap-2">
            <NProgressLink href="/incomes" passHref>
                <Button variant="outline">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Incomes
                </Button>
            </NProgressLink>
            <DateFilter date={date} setDate={setDate} />
        </div>
      </div>
       <CardDescription>From Income Source: {gigData.source}</CardDescription>

      <section>
        <h2 className="text-xl font-semibold mb-4">Performance Overview</h2>
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
          {gigData.stats.map((stat) => (
            <StatCard key={stat.title} {...stat} />
          ))}
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
         <Card className="lg:col-span-2">
            <CardHeader>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <CardTitle>Impressions, Clicks, Messages & Orders</CardTitle>
                        <CardDescription>Performance over the selected period.</CardDescription>
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
            <CardContent>
              <Suspense fallback={<Skeleton className="h-[300px] w-full" />}>
                <GigAnalyticsChart data={chartDataForRender} activeMetrics={activeMetrics} showComparison={showComparison} />
              </Suspense>
            </CardContent>
        </Card>
         <Card>
            <CardHeader>
                <CardTitle>Gig History</CardTitle>
                <CardDescription>
                    Key events in this gig's lifecycle.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Event</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                         <TableRow>
                            <TableCell>{format(new Date(gigData.creationDate), "PPP")}</TableCell>
                            <TableCell>
                                <Badge variant="secondary">Gig Created</Badge>
                            </TableCell>
                        </TableRow>
                        {gigData.mergeHistory.map((event, index) => (
                            <TableRow key={index}>
                                <TableCell>{format(new Date(event.date), "PPP")}</TableCell>
                                <TableCell>
                                    <div className="font-medium">{event.action}</div>
                                    <div className="text-sm text-muted-foreground">Source: {event.mergedGig}</div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
      </div>
    </main>
  );
}
