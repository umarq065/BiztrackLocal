"use client";

import { useState, lazy, Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { format, subDays, differenceInDays } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, ArrowUp, ArrowDown, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { type GrowthMetricData } from "@/lib/services/analyticsService";

const GrowthMetricsChart = lazy(() => import("@/components/detailed-metrics/growth-metrics-chart"));

interface GrowthMetricsProps {
    previousPeriodLabel: string;
}

export function GrowthMetrics({ previousPeriodLabel }: GrowthMetricsProps) {
  const [showChart, setShowChart] = useState(false);
  const [activeMetrics, setActiveMetrics] = useState({
    revenueGrowth: true,
    profitGrowth: true,
    clientGrowth: true,
    aovGrowth: false,
    highValueClientGrowth: false,
    sourceGrowth: false,
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [growthMetricsData, setGrowthMetricsData] = useState<GrowthMetricData | null>(null);
  const searchParams = useSearchParams();

  const handleMetricToggle = (metric: string) => {
    setActiveMetrics((prev) => ({ ...prev, [metric]: !prev[metric] }));
  };
  
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  
  useEffect(() => {
    async function fetchData() {
        if (!from || !to) return;
        setIsLoading(true);
        try {
            const res = await fetch(`/api/analytics/growth?from=${from}&to=${to}`);
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
  }, [from, to]);
  
  if (isLoading) {
    return <Skeleton className="h-64 w-full" />
  }

  if (!growthMetricsData) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <BarChart className="h-6 w-6 text-primary" />
                    <span>Growth Metrics</span>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p>Could not load growth metrics. Please select a valid date range.</p>
            </CardContent>
        </Card>
    );
  }

  const growthMetrics = [
    { name: "Revenue Growth (%)", value: growthMetricsData.revenueGrowth.value, previousValue: growthMetricsData.revenueGrowth.previousValue, formula: "((This Period’s Revenue - Last Period’s Revenue) / Last Period’s Revenue) × 100" },
    { name: "Net Profit Growth (%)", value: growthMetricsData.profitGrowth.value, previousValue: growthMetricsData.profitGrowth.previousValue, formula: "((This Period's Net Profit - Last Period's) / Last Period's) × 100" },
    { name: "Client Growth Rate (%)", value: growthMetricsData.clientGrowth.value, previousValue: growthMetricsData.clientGrowth.previousValue, formula: "((New Clients) / Clients at Start of Period) × 100" },
    { name: "Average Order Value (AOV) Growth (%)", value: growthMetricsData.aovGrowth.value, previousValue: growthMetricsData.aovGrowth.previousValue, formula: "Growth rate of AOV over a period" },
    { name: "High-Value Client Growth Rate (%)", value: growthMetricsData.vipClientGrowth.value, previousValue: growthMetricsData.vipClientGrowth.previousValue, formula: "((VIPs at End - VIPs at Start) / VIPs at Start) * 100" },
    { name: "Top Source Growth Rate (%)", value: growthMetricsData.topSourceGrowth.value, previousValue: growthMetricsData.topSourceGrowth.previousValue, formula: `Growth of '${growthMetricsData.topSourceGrowth.source}'` },
];

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {growthMetrics.map((metric) => {
            const isPositive = metric.value >= 0;
            const changeIsPositive = metric.previousValue != null && metric.previousValue >= 0;

            return (
                <div key={metric.name} className="rounded-lg border bg-background/50 p-4 flex flex-col justify-between">
                <div>
                    <p className="text-sm font-medium text-muted-foreground">{metric.name}</p>
                    <p className={cn(
                      "text-2xl font-bold mt-1 flex items-center gap-1",
                      isPositive ? "text-green-600" : "text-red-600"
                    )}>
                      {isPositive ? <ArrowUp className="h-5 w-5" /> : <ArrowDown className="h-5 w-5" />}
                      {metric.value.toFixed(1)}%
                    </p>
                </div>
                <div className="mt-2 pt-2 border-t space-y-1">
                    {metric.previousValue != null && (
                        <div className="flex items-center text-xs">
                             <span
                                className={cn(
                                    "flex items-center gap-1 font-semibold",
                                    changeIsPositive ? "text-green-600" : "text-red-600"
                                )}
                            >
                                {changeIsPositive ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                                {metric.previousValue.toFixed(1)}%
                            </span>
                            <span className="ml-1 text-muted-foreground">{previousPeriodLabel}</span>
                        </div>
                    )}
                    <p className="text-xs text-muted-foreground">{metric.formula}</p>
                </div>
                </div>
            )
          })}
        </div>
      </CardContent>
      {showChart && (
        <CardContent>
             <Suspense fallback={<Skeleton className="h-[300px] w-full" />}>
                <GrowthMetricsChart data={growthMetricsData.timeSeries} activeMetrics={activeMetrics} onMetricToggle={handleMetricToggle} />
            </Suspense>
        </CardContent>
      )}
    </Card>
  );
}
