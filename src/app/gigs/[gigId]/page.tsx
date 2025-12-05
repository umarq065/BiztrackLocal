
"use client";

import { useState, useMemo, lazy, Suspense, useEffect } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import StatCard from "@/components/dashboard/stat-card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { DateRange } from "react-day-picker";
import { DateFilter } from "@/components/dashboard/date-filter";
import { Skeleton } from "@/components/ui/skeleton";
import NProgressLink from "@/components/layout/nprogress-link";
import { Button } from "@/components/ui/button";
import { format, subDays } from "date-fns";
import { notFound, useParams, useRouter } from 'next/navigation';
import type { GigAnalyticsData } from "@/lib/services/analyticsService";
import { useToast } from "@/hooks/use-toast";

const GigAnalyticsChart = lazy(() => import("@/components/gigs/analytics-chart"));

const chartConfig = {
  impressions: { label: "Impressions", color: "hsl(var(--chart-1))" },
  clicks: { label: "Clicks", color: "hsl(var(--chart-2))" },
  messages: { label: "Messages", color: "hsl(var(--chart-3))" },
  orders: { label: "Orders", color: "hsl(var(--chart-4))" },
  ctr: { label: "CTR", color: "hsl(var(--chart-5))" },
  prevImpressions: { label: "Prev. Impressions", color: "hsl(var(--chart-1))" },
  prevClicks: { label: "Prev. Clicks", color: "hsl(var(--chart-2))" },
  prevMessages: { label: "Prev. Messages", color: "hsl(var(--chart-3))" },
  prevOrders: { label: "Prev. Orders", color: "hsl(var(--chart-4))" },
  prevCtr: { label: "Prev. CTR", color: "hsl(var(--chart-5))" },
} as const;


export default function GigAnalyticsPage() {
  const params = useParams();
  const gigId = params.gigId as string;
  const router = useRouter();
  const { toast } = useToast();

  const [analyticsData, setAnalyticsData] = useState<GigAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [date, setDate] = useState<DateRange | undefined>(() => {
    const today = new Date();
    const from = subDays(today, 29);
    return { from, to: today };
  });

  const [activeMetrics, setActiveMetrics] = useState<Record<string, boolean>>({
    impressions: true,
    clicks: true,
    messages: true,
    orders: true,
    ctr: true,
  });
  const [showComparison, setShowComparison] = useState(false);

  useEffect(() => {
    async function fetchAnalytics() {
      if (!gigId) return;
      setIsLoading(true);

      const from = date?.from ? format(date.from, 'yyyy-MM-dd') : undefined;
      const to = date?.to ? format(date.to, 'yyyy-MM-dd') : undefined;

      const query = new URLSearchParams({
        ...(from && { from }),
        ...(to && { to }),
      }).toString();

      try {
        const res = await fetch(`/api/analytics/gig/${gigId}?${query}`);
        if (res.status === 404) {
          notFound();
          return;
        }
        if (!res.ok) {
          throw new Error('Failed to fetch analytics data');
        }
        const data: GigAnalyticsData = await res.json();
        setAnalyticsData(data);
      } catch (error) {
        console.error("Error fetching gig analytics:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not load analytics data for this gig."
        })
      } finally {
        setIsLoading(false);
      }
    }
    fetchAnalytics();
  }, [gigId, date, toast]);

  const handleMetricToggle = (metric: keyof typeof chartConfig) => {
    setActiveMetrics((prev) => ({
      ...prev,
      [metric]: !prev[metric],
    }));
  };

  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? { change: `+100%`, changeType: "increase" as const } : {};
    if (current === 0 && previous > 0) return { change: `-100%`, changeType: "decrease" as const };
    const diff = ((current - previous) / previous) * 100;
    if (Math.abs(diff) < 0.1) return {};
    return {
      change: `${diff >= 0 ? '+' : ''}${diff.toFixed(1)}%`,
      changeType: diff >= 0 ? "increase" as const : "decrease" as const,
    };
  };

  const statCards = useMemo(() => {
    if (!analyticsData) return [];
    const { totals, previousTotals } = analyticsData;
    return [
      {
        icon: "DollarSign", title: "Revenue", value: `$${totals.revenue.toFixed(2)}`,
        description: `vs. $${previousTotals.revenue.toFixed(2)} previous period`,
        ...calculateChange(totals.revenue, previousTotals.revenue)
      },
      {
        icon: "ShoppingCart", title: "Orders", value: totals.orders.toString(),
        description: `vs. ${previousTotals.orders} previous period`,
        ...calculateChange(totals.orders, previousTotals.orders)
      },
      {
        icon: "Eye", title: "Impressions", value: totals.impressions.toLocaleString(),
        description: `vs. ${previousTotals.impressions.toLocaleString()} previous period`,
        ...calculateChange(totals.impressions, previousTotals.impressions)
      },
      {
        icon: "MousePointerClick", title: "Clicks", value: totals.clicks.toLocaleString(),
        description: `vs. ${previousTotals.clicks.toLocaleString()} previous period`,
        ...calculateChange(totals.clicks, previousTotals.clicks)
      },
      {
        icon: "Percent", title: "Click-Through Rate (CTR)", value: `${totals.ctr.toFixed(2)}%`,
        description: `vs. ${previousTotals.ctr.toFixed(2)}% previous period`,
        ...calculateChange(totals.ctr, previousTotals.ctr)
      },
      {
        icon: "TrendingUp", title: "Conversion Rate", value: `${totals.conversionRate.toFixed(2)}%`,
        description: "Orders / Impressions"
      },
      {
        icon: "MessageSquare", title: "Messages", value: totals.messages.toLocaleString(),
        description: `vs. ${previousTotals.messages.toLocaleString()} previous period`,
        ...calculateChange(totals.messages, previousTotals.messages)
      },
      {
        icon: "ShoppingCart", title: "Total Source Orders", value: analyticsData.sourceTotalOrders?.toLocaleString() ?? 'N/A',
        description: `All orders from ${analyticsData.sourceName}`,
      },
    ];
  }, [analyticsData]);

  if (isLoading) {
    return (
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="flex items-center">
          <Skeleton className="h-9 w-96" />
          <div className="ml-auto flex items-center gap-2">
            <Skeleton className="h-10 w-28" />
            <Skeleton className="h-10 w-[260px]" />
          </div>
        </div>
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-[400px] w-full" />
      </main>
    )
  }

  if (!analyticsData) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center min-h-screen">
        <Card className="w-full max-w-lg glass-card border-white/10">
          <CardHeader>
            <CardTitle>Could Not Load Analytics</CardTitle>
            <CardDescription>There was an issue fetching the data for this gig. Please try again later or check if the gig exists.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 md:gap-8 md:p-8 min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <NProgressLink href="/incomes">
              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </NProgressLink>
            <h1 className="font-headline text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 animate-gradient-x">
              {analyticsData.gigName}
            </h1>
          </div>
          <p className="text-muted-foreground text-lg ml-10">
            Analytics & Performance • <span className="text-primary">{analyticsData.sourceName}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DateFilter date={date} setDate={setDate} />
        </div>
      </div>

      {/* Main Content Card */}
      <div className="glass-card rounded-xl p-6 relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        <div className="relative z-10 space-y-8">

          {/* Stats Grid */}
          <section>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span className="w-1 h-6 bg-primary rounded-full" />
              Performance Overview
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {statCards.map((stat, i) => (
                <StatCard
                  key={i}
                  {...stat}
                  contentClassName="glass border-white/10 bg-white/5 hover:bg-white/10 transition-all duration-300"
                />
              ))}
            </div>
          </section>

          {/* Chart Section */}
          <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="lg:col-span-3 glass border-white/10 bg-white/5">
              <CardHeader>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle>Trends Analysis</CardTitle>
                    <CardDescription>Impressions, Clicks, Messages & Orders over time.</CardDescription>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                    {(Object.keys(chartConfig) as Array<keyof typeof chartConfig>).filter(k => !k.startsWith('prev')).map((metric) => (
                      <div key={metric} className="flex items-center gap-2">
                        <Checkbox
                          id={`metric-${metric}`}
                          checked={activeMetrics[metric as keyof typeof activeMetrics]}
                          onCheckedChange={() => handleMetricToggle(metric as keyof typeof chartConfig)}
                          style={{
                            '--chart-color': chartConfig[metric as keyof typeof chartConfig].color,
                          } as React.CSSProperties}
                          className="data-[state=checked]:bg-[var(--chart-color)] data-[state=checked]:border-[var(--chart-color)] border-white/20"
                        />
                        <Label htmlFor={`metric-${metric}`} className="capitalize cursor-pointer">
                          {chartConfig[metric as keyof typeof chartConfig].label}
                        </Label>
                      </div>
                    ))}
                    <div className="flex items-center gap-2 pl-4 border-l border-white/10">
                      <Checkbox
                        id="show-comparison"
                        checked={showComparison}
                        onCheckedChange={(c) => setShowComparison(!!c)}
                        className="border-white/20"
                      />
                      <Label htmlFor="show-comparison" className="cursor-pointer">Compare Previous</Label>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<Skeleton className="h-[300px] w-full bg-white/5" />}>
                  <GigAnalyticsChart data={analyticsData.timeSeries} activeMetrics={activeMetrics} showComparison={showComparison} />
                </Suspense>
              </CardContent>
            </Card>
          </section>
        </div>
      </div >
    </main >
  );
}
