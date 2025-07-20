
"use client";

import { useMemo, lazy, Suspense, useState, useEffect } from "react";
import { notFound, useParams } from "next/navigation";
import { ArrowLeft, BarChart2, LineChartIcon, Loader2, Percent } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import StatCard from "@/components/dashboard/stat-card";
import { Skeleton } from "@/components/ui/skeleton";
import NProgressLink from "@/components/layout/nprogress-link";
import { Button } from "@/components/ui/button";
import { format, subDays } from "date-fns";
import { type ChartConfig } from "@/components/ui/chart";
import type { DateRange } from "react-day-picker";
import { DateFilter } from "@/components/dashboard/date-filter";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import type { SourceAnalyticsData } from "@/lib/services/analyticsService";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const SourcePerformanceChart = lazy(() => import('@/components/incomes/source-performance-chart').then(m => ({ default: m.SourcePerformanceChart })));

const chartConfig = {
  revenue: { label: "Revenue", color: "hsl(var(--chart-5))"},
  impressions: { label: "Impressions", color: "hsl(var(--chart-1))" },
  clicks: { label: "Clicks", color: "hsl(var(--chart-2))" },
  orders: { label: "Orders", color: "hsl(var(--chart-4))" },
  messages: { label: "Messages", color: "hsl(var(--chart-3))" },
  ctr: { label: "CTR (%)", color: "hsl(var(--accent))" },
  prevRevenue: { label: "Prev. Revenue", color: "hsl(var(--chart-5))"},
  prevImpressions: { label: "Prev. Impressions", color: "hsl(var(--chart-1))" },
  prevClicks: { label: "Prev. Clicks", color: "hsl(var(--chart-2))" },
  prevOrders: { label: "Prev. Orders", color: "hsl(var(--chart-4))" },
  prevMessages: { label: "Prev. Messages", color: "hsl(var(--chart-3))" },
  prevCtr: { label: "Prev. CTR (%)", color: "hsl(var(--accent))" },
} satisfies ChartConfig;

export default function SourceAnalyticsPage() {
  const params = useParams();
  const sourceId = params.sourceId as string;
  const { toast } = useToast();

  const [analyticsData, setAnalyticsData] = useState<SourceAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const [date, setDate] = useState<DateRange | undefined>(() => {
    const today = new Date();
    const from = subDays(today, 29);
    return { from, to: today };
  });
  
  const [chartType, setChartType] = useState('line');
  const [chartView, setChartView] = useState('daily');

  const [activeMetrics, setActiveMetrics] = useState({
    revenue: true,
    impressions: true,
    clicks: true,
    orders: true,
    messages: true,
    ctr: false,
  });
  const [showComparison, setShowComparison] = useState(false);
  
  useEffect(() => {
    if (!sourceId) return;
    const fetchSource = async () => {
      setLoading(true);
      const from = date?.from ? format(date.from, 'yyyy-MM-dd') : undefined;
      const to = date?.to ? format(date.to, 'yyyy-MM-dd') : undefined;

      const query = new URLSearchParams({
          ...(from && { from }),
          ...(to && { to }),
      }).toString();

      try {
        const response = await fetch(`/api/analytics/source/${sourceId}?${query}`);
        if (!response.ok) {
          throw new Error('Failed to fetch income source analytics');
        }
        const data = await response.json();
        setAnalyticsData(data);
      } catch (error) {
        console.error("Error fetching source analytics:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not load analytics data for this source."
        });
        setAnalyticsData(null);
      } finally {
        setLoading(false);
      }
    };
    fetchSource();
  }, [sourceId, date, toast]);

  const handleMetricToggle = (metric: keyof typeof activeMetrics) => {
    setActiveMetrics((prev) => ({
      ...prev,
      [metric]: !prev[metric],
    }));
  };
  
  const sourceStats = useMemo(() => {
    if (!analyticsData) return [];
    const { totals, previousTotals } = analyticsData;
    
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

    const avgOrderValue = totals.orders > 0 ? totals.revenue / totals.orders : 0;
    const prevAvgOrderValue = previousTotals.orders > 0 ? previousTotals.revenue / previousTotals.orders : 0;
    const aovChange = calculateChange(avgOrderValue, prevAvgOrderValue);
    
    const ctrChange = calculateChange(totals.ctr, previousTotals.ctr);

    return [
      { icon: "DollarSign", title: "Total Revenue", value: `$${totals.revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, description: "vs. previous period", ...calculateChange(totals.revenue, previousTotals.revenue)},
      { icon: "CreditCard", title: "Avg. Order Value", value: `$${avgOrderValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, description: "vs. previous period", ...aovChange },
      { icon: "Eye", title: "Total Impressions", value: totals.impressions.toLocaleString(), description: "vs. previous period", ...calculateChange(totals.impressions, previousTotals.impressions) },
      { icon: "MousePointerClick", title: "Total Clicks", value: totals.clicks.toLocaleString(), description: "vs. previous period", ...calculateChange(totals.clicks, previousTotals.clicks) },
      { icon: "Percent", title: "Click-Through Rate (CTR)", value: `${totals.ctr.toFixed(2)}%`, description: "vs. previous period", ...ctrChange },
      { icon: "ShoppingCart", title: "Total Orders", value: totals.orders.toLocaleString(), description: "vs. previous period", ...calculateChange(totals.orders, previousTotals.orders) },
      { icon: "MessageSquare", title: "Source Messages", value: totals.messages.toLocaleString(), description: "vs. previous period", ...calculateChange(totals.messages, previousTotals.messages) },
    ];
  }, [analyticsData]);

  if (loading) {
    return (
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
            <Skeleton className="h-9 w-72" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-96 w-full" />
            <Skeleton className="h-64 w-full" />
        </main>
    );
  }
  
  if (!analyticsData) {
    notFound();
  }
  
  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center">
        <h1 className="font-headline text-lg font-semibold md:text-2xl">
          Source Analytics: <span className="text-primary">{analyticsData.sourceName}</span>
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
          {sourceStats.map((stat, i) => (
            <StatCard key={i} {...stat} />
          ))}
        </div>
      </section>

      <div className="grid gap-4">
        <Card>
            <CardHeader>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <CardTitle>Source Performance</CardTitle>
                        <CardDescription>Impressions, clicks, orders, messages, and revenue from this source.</CardDescription>
                    </div>
                    <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
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
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                            <div className="flex items-center space-x-2">
                                <Label htmlFor="chart-type-toggle" className="text-sm font-normal">Line</Label>
                                <Switch
                                    id="chart-type-toggle"
                                    checked={chartType === 'bar'}
                                    onCheckedChange={(checked) => setChartType(checked ? 'bar' : 'line')}
                                    aria-label="Toggle between line and bar chart"
                                />
                                <Label htmlFor="chart-type-toggle" className="text-sm font-normal">Bar</Label>
                            </div>
                            <Select value={chartView} onValueChange={setChartView}>
                                <SelectTrigger className="w-[120px]">
                                    <SelectValue placeholder="Select view" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="daily">Daily</SelectItem>
                                    <SelectItem value="weekly">Weekly</SelectItem>
                                    <SelectItem value="monthly">Monthly</SelectItem>
                                    <SelectItem value="quarterly">Quarterly</SelectItem>
                                    <SelectItem value="yearly">Yearly</SelectItem>
                                </SelectContent>
                            </Select>
                            <div className="flex items-center gap-2">
                                <Checkbox id="show-comparison" checked={showComparison} onCheckedChange={(c) => setShowComparison(!!c)} />
                                <Label htmlFor="show-comparison">Compare</Label>
                            </div>
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pl-2">
                <Suspense fallback={<Skeleton className="h-[300px] w-full" />}>
                   <SourcePerformanceChart 
                     data={analyticsData.timeSeries} 
                     config={chartConfig}
                     activeMetrics={activeMetrics}
                     showComparison={showComparison}
                     chartType={chartType}
                     chartView={chartView}
                   />
                </Suspense>
            </CardContent>
        </Card>
      </div>
      
       <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
              <CardTitle>Gigs in this Source</CardTitle>
              <CardDescription>A list of all gigs associated with {analyticsData.sourceName}.</CardDescription>
          </div>
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
                    {analyticsData.gigs.length > 0 ? analyticsData.gigs.map((gig) => (
                         <TableRow key={gig.id}>
                            <TableCell className="font-medium">
                                <NProgressLink href={`/gigs/${gig.id}`} className="hover:underline">
                                    {gig.name}
                                </NProgressLink>
                            </TableCell>
                            <TableCell>{format(new Date(gig.date.replace(/-/g, '/')), "PPP")}</TableCell>
                            <TableCell className="text-right">{gig.messages ?? <span className="text-muted-foreground">N/A</span>}</TableCell>
                         </TableRow>
                    )) : (
                        <TableRow>
                            <TableCell colSpan={3} className="h-24 text-center">No gigs found for this source.</TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
    </main>
  );
}
