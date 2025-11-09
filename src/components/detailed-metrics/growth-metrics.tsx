

"use client";

import { useState, lazy, Suspense, useEffect, useMemo } from "react";
import type { DateRange } from "react-day-picker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, ArrowUp, ArrowDown, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { type GrowthMetricData, type RevenueDataPoint } from "@/lib/services/analyticsService";

const GrowthMetricsChart = lazy(() => import("@/components/detailed-metrics/growth-metrics-chart"));
const NetProfitGrowthChart = lazy(() => import("@/components/detailed-metrics/net-profit-growth-chart"));


interface GrowthMetricsProps {
    date: DateRange | undefined;
    selectedSources: string[];
    previousPeriodLabel: string;
}

export function GrowthMetrics({ date, selectedSources, previousPeriodLabel }: GrowthMetricsProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [growthMetricsData, setGrowthMetricsData] = useState<GrowthMetricData | null>(null);
  const [showChart, setShowChart] = useState(false);

  useEffect(() => {
    async function fetchData() {
        if (!date?.from || !date?.to) return;
        setIsLoading(true);
        try {
            const query = new URLSearchParams({
                from: date.from.toISOString(),
                to: date.to.toISOString(),
                sources: selectedSources.join(','),
            });
            const res = await fetch(`/api/analytics/growth?${query.toString()}`);
            if (!res.ok) throw new Error('Failed to fetch growth metrics');
            const data = await res.json();
            setGrowthMetricsData(data);
        } catch(e) {
            console.error("Error fetching growth metrics:", e);
            setGrowthMetricsData(null);
        } finally {
            setIsLoading(false);
        }
    }
    fetchData();
  }, [date, selectedSources]);
  
  const renderContent = () => {
      if (isLoading) {
          return (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-[180px] w-full" />)}
              </div>
          )
      }

      if (!growthMetricsData) {
        return <p className="text-muted-foreground">Could not load growth metrics. Please select a valid date range and at least one source.</p>
      }

      const {
        revenueGrowth,
        profitGrowth,
        clientGrowth,
        aovGrowth,
        vipClientGrowth,
        topSourceGrowth
      } = growthMetricsData;

      const metrics = [
        { name: "Revenue Growth (%)", data: revenueGrowth, formula: "((Current - Previous) / Previous) * 100" },
        { name: "Net Profit Growth (%)", data: profitGrowth, formula: "((Current - Previous) / Previous) * 100" },
        { name: "Client Growth Rate (%)", data: clientGrowth, formula: "((New Clients) / Start Clients) * 100" },
        { name: "AOV Growth (%)", data: aovGrowth, formula: "Growth rate of Average Order Value" },
        { name: "High-Value Client Growth (%)", data: vipClientGrowth, formula: "Growth rate of VIP clients" },
        { name: `Top Source Growth: ${topSourceGrowth.source} (%)`, data: topSourceGrowth, formula: `Growth of top income source` },
      ];

      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {metrics.map((metric) => {
            const isPositive = metric.data.value >= 0;
            const prevIsPositive = metric.data.previousValue >= 0;
            return (
                <div key={metric.name} className="rounded-lg border bg-background/50 p-4 flex flex-col justify-between">
                <div>
                    <p className="text-sm font-medium text-muted-foreground">{metric.name}</p>
                    <p className={cn(
                      "text-2xl font-bold mt-1 flex items-center gap-1",
                      isPositive ? "text-green-600" : "text-red-600"
                    )}>
                      {isPositive ? <ArrowUp className="h-5 w-5" /> : <ArrowDown className="h-5 w-5" />}
                      {metric.data.value.toFixed(1)}%
                    </p>
                </div>
                <div className="mt-2 pt-2 border-t space-y-1 text-xs">
                    <div className="flex items-center">
                         <span className={cn(
                            "flex items-center gap-1 font-semibold",
                            prevIsPositive ? "text-green-600" : "text-red-600"
                        )}>
                            {prevIsPositive ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                            {metric.data.previousValue.toFixed(1)}%
                        </span>
                        <span className="ml-1 text-muted-foreground">{previousPeriodLabel}</span>
                    </div>
                    <p className="text-muted-foreground pt-1">{metric.formula}</p>
                </div>
                </div>
            )
          })}
        </div>
      )
  };

  const currentPeriodTimeSeries = growthMetricsData?.timeSeries?.currentPeriod;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <BarChart className="h-6 w-6 text-primary" />
          <span>Growth Metrics</span>
        </CardTitle>
        <Button variant="outline" size="sm" onClick={() => setShowChart(!showChart)}>
            {showChart ? <EyeOff className="mr-2 h-4 w-4" /> : <BarChart className="mr-2 h-4 w-4" />}
            {showChart ? "Hide Graph" : "Show Graph"}
        </Button>
      </CardHeader>
      <CardContent>
        {renderContent()}
      </CardContent>
       {showChart && growthMetricsData?.timeSeries && (
        <CardContent className="space-y-6">
            <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
                <GrowthMetricsChart
                    timeSeries={currentPeriodTimeSeries ? currentPeriodTimeSeries.map(d => ({ date: d.date, value: d.revenue, note: d.note })) : []}
                />
            </Suspense>
             <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
                <NetProfitGrowthChart
                     timeSeries={currentPeriodTimeSeries ? currentPeriodTimeSeries.map(d => ({ date: d.date, value: d.netProfit, note: d.note })) : []}
                />
            </Suspense>
        </CardContent>
       )}
    </Card>
  );
}
