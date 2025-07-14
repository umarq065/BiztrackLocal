
"use client";

import { useMemo, lazy, Suspense, useState } from "react";
import { notFound, useParams } from "next/navigation";
import {
  ArrowLeft,
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
import { processSourceData } from "@/lib/incomes/utils";

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

const getInitialDateRangeForSource = (source?: IncomeSource): DateRange => {
    if (!source) {
      const today = new Date();
      const oneMonthAgo = new Date();
      oneMonthAgo.setDate(today.getDate() - 30);
      return { from: oneMonthAgo, to: today };
    }
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

export default function SourceAnalyticsPage() {
  const params = useParams();
  const sourceId = params.sourceId as string;
  const source = useMemo(() => initialIncomeSources.find((s) => s.id === sourceId), [sourceId]);

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
  
  const { chartDataForRender, sourceStats } = useMemo(
    () => processSourceData(source, date), 
    [source, date]
  );
  
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
