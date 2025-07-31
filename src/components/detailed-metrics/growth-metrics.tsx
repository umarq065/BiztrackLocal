
"use client";

import { useState, lazy, Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, ArrowUp, ArrowDown, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { type GrowthMetricData } from "@/lib/services/analyticsService";

const GrowthMetricsChart = lazy(() => import("@/components/detailed-metrics/growth-metrics-chart"));

interface GrowthMetricsProps {
    data: GrowthMetricData;
    previousPeriodLabel: string;
}

export function GrowthMetrics({ data, previousPeriodLabel }: GrowthMetricsProps) {
  const [showChart, setShowChart] = useState(false);
  const [activeMetrics, setActiveMetrics] = useState({
    revenueGrowth: true,
    profitGrowth: true,
    clientGrowth: true,
    aovGrowth: false,
    highValueClientGrowth: false,
    sourceGrowth: false,
  });

  const handleMetricToggle = (metric: string) => {
    setActiveMetrics((prev) => ({ ...prev, [metric]: !prev[metric] }));
  };
  
  const growthMetrics = [
    { name: "Revenue Growth (%)", value: data.revenueGrowth.value, change: data.revenueGrowth.change, formula: "((This Period’s Revenue - Last Period’s Revenue) / Last Period’s Revenue) × 100" },
    { name: "Net Profit Growth (%)", value: data.profitGrowth.value, change: data.profitGrowth.change, formula: "((This Period's Net Profit - Last Period's) / Last Period's) × 100" },
    { name: "Client Growth Rate (%)", value: data.clientGrowth.value, change: data.clientGrowth.change, formula: "((New Clients) / Clients at Start of Period) × 100" },
    { name: "Average Order Value (AOV) Growth (%)", value: data.aovGrowth.value, change: data.aovGrowth.change, formula: "Growth rate of AOV over a period" },
    { name: "High-Value Client Growth Rate (%)", value: data.vipClientGrowth.value, change: data.vipClientGrowth.change, formula: "Growth rate of clients marked as VIP" },
    { name: "Top Source Growth Rate (%)", value: data.topSourceGrowth.value, change: data.topSourceGrowth.change, formula: `Growth of '${data.topSourceGrowth.source}'` },
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
            const changeValue = metric.change;
            const changeIsPositive = changeValue >= 0;

            return (
                <div key={metric.name} className="rounded-lg border bg-background/50 p-4 flex flex-col justify-between">
                <div>
                    <p className="text-sm font-medium text-muted-foreground">{metric.name}</p>
                    <p className={cn(
                      "text-2xl font-bold mt-1 flex items-center gap-1",
                      isPositive ? "text-green-600" : "text-red-600"
                    )}>
                      {isPositive ? <ArrowUp className="h-5 w-5" /> : <ArrowDown className="h-5 w-5" />}
                      {Math.abs(metric.value).toFixed(1)}%
                    </p>
                </div>
                <div className="mt-2 pt-2 border-t space-y-1">
                    {metric.change != null && (
                        <div className="flex items-center text-xs">
                             <span
                                className={cn(
                                    "flex items-center gap-1 font-semibold",
                                    changeIsPositive ? "text-green-600" : "text-red-600"
                                )}
                            >
                                {changeIsPositive ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                                {Math.abs(changeValue).toFixed(1)}%
                            </span>
                            <span className="ml-1 text-muted-foreground">From {previousPeriodLabel}</span>
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
                <GrowthMetricsChart data={data.timeSeries} activeMetrics={activeMetrics} onMetricToggle={handleMetricToggle} />
            </Suspense>
        </CardContent>
      )}
    </Card>
  );
}
