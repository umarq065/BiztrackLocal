
"use client";

import { useState, lazy, Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Megaphone, ArrowUp, ArrowDown, EyeOff, BarChart } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const MarketingMetricsChart = lazy(() => import("@/components/detailed-metrics/marketing-metrics-chart"));

const marketingMetrics = [
    { name: "Cost per Lead (CPL)", value: "$25.50", formula: "Total Marketing Spend / Number of Leads Generated", change: -5.0, changeType: "decrease" as const, invertColor: true },
    { name: "Marketing ROI (ROMI)", value: "450%", formula: "((Revenue from Marketing - Marketing Cost) / Marketing Cost) × 100", change: 50, changeType: "increase" as const },
];

export function MarketingMetrics() {
  const [showChart, setShowChart] = useState(false);
  const [activeMetrics, setActiveMetrics] = useState({
    cpl: true,
    romi: false,
  });

  const handleMetricToggle = (metric: keyof typeof activeMetrics) => {
    setActiveMetrics((prev) => ({ ...prev, [metric]: !prev[metric] }));
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Megaphone className="h-6 w-6 text-primary" />
          <span>Marketing Metrics</span>
        </CardTitle>
         <Button variant="outline" size="sm" onClick={() => setShowChart(!showChart)}>
            {showChart ? <EyeOff className="mr-2 h-4 w-4" /> : <BarChart className="mr-2 h-4 w-4" />}
            {showChart ? "Hide Graph" : "Show Graph"}
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
          {marketingMetrics.map((metric) => {
            const isPositive = metric.invertColor ? metric.changeType === "decrease" : metric.changeType === "increase";
            return (
                <div key={metric.name} className="rounded-lg border bg-background/50 p-4 flex flex-col justify-between">
                <div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-muted-foreground">{metric.name}</p>
                       {metric.change != null && (
                          <span className={cn("flex items-center gap-1 text-xs font-semibold", isPositive ? "text-green-600" : "text-red-600")}>
                              {metric.changeType === "increase" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                              {`${Math.abs(metric.change).toFixed(1)}%`}
                          </span>
                      )}
                    </div>
                    <p className="text-2xl font-bold mt-1">{metric.value}</p>
                </div>
                <div className="mt-2 pt-2 border-t space-y-1 text-xs">
                    <p className="text-muted-foreground pt-1">{metric.formula}</p>
                </div>
                </div>
            )
          })}
        </div>
      </CardContent>
      {showChart && (
        <CardContent>
             <Suspense fallback={<Skeleton className="h-[300px] w-full" />}>
                <MarketingMetricsChart activeMetrics={activeMetrics} onMetricToggle={handleMetricToggle} />
            </Suspense>
        </CardContent>
      )}
    </Card>
  );
}
