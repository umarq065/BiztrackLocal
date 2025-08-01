
"use client";

import { useState, lazy, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { format, subDays, differenceInDays } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, ArrowUp, ArrowDown, BarChart, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { ClientMetricData } from "@/lib/services/analyticsService";

const ClientMetricsChart = lazy(() => import("@/components/detailed-metrics/client-metrics-chart"));

interface ClientMetricsProps {
    data: ClientMetricData;
}

export function ClientMetrics({ data }: ClientMetricsProps) {
  const searchParams = useSearchParams();
  const [showChart, setShowChart] = useState(false);
  const [activeMetrics, setActiveMetrics] = useState({
    totalClients: true,
    newClients: true,
    retentionRate: false,
    csat: false,
  });

  const handleMetricToggle = (metric: keyof typeof activeMetrics) => {
    setActiveMetrics((prev) => ({ ...prev, [metric]: !prev[metric] }));
  };
  
  const fromParam = searchParams.get('from');
  const toParam = searchParams.get('to');
  
  const previousPeriodLabel = (() => {
    if (!fromParam || !toParam) return "previous period";
    const from = new Date(fromParam.replace(/-/g, '/'));
    const to = new Date(toParam.replace(/-/g, '/'));
    const duration = differenceInDays(to, from);
    const prevTo = subDays(from, 1);
    const prevFrom = subDays(prevTo, duration);
    return `from ${format(prevFrom, 'MMM d')} - ${format(prevTo, 'MMM d, yyyy')}`;
  })();

  const clientMetrics = [
    { name: "Total Clients", value: data.totalClients.value.toLocaleString(), formula: "Total unique clients in period", change: `${data.totalClients.change.toFixed(1)}%`, changeType: data.totalClients.change >= 0 ? "increase" : "decrease" as const },
    { name: "New Clients", value: data.newClients.value.toLocaleString(), formula: "Clients with their first order in period", change: `${data.newClients.change.toFixed(1)}%`, changeType: data.newClients.change >= 0 ? "increase" : "decrease" as const },
    { name: "Repeat Clients", value: data.repeatClients.value.toLocaleString(), formula: "Clients with more than one order in period", change: `${data.repeatClients.change.toFixed(1)}%`, changeType: data.repeatClients.change >= 0 ? "increase" : "decrease" as const },
    { name: "Repeat Purchase Rate (%)", value: `${data.repeatPurchaseRate.value.toFixed(1)}%`, formula: "(Number of Customers Who Purchased More Than Once/Total Number of Customers)×100", change: `${data.repeatPurchaseRate.change.toFixed(1)}%`, changeType: data.repeatPurchaseRate.change >= 0 ? "increase" : "decrease" as const },
    { name: "Client Retention Rate (%)", value: `${data.retentionRate.value.toFixed(1)}%`, formula: "((End Clients - New) / Start Clients) × 100", change: `${data.retentionRate.change.toFixed(1)}%`, changeType: data.retentionRate.change >= 0 ? "increase" : "decrease" as const },
    { name: "Avg. Lifespan of Repeat Customer", value: `${data.avgLifespan.value.toFixed(1)} months`, formula: "Avg. time between first & last order of churned repeat clients", change: `${data.avgLifespan.change.toFixed(1)}%`, changeType: data.avgLifespan.change >= 0 ? "increase" : "decrease" as const },
    { name: "Client Satisfaction (CSAT)", value: `${data.csat.value.toFixed(1)}%`, formula: "(Positive Ratings / Total Ratings) × 100", change: `${data.csat.change.toFixed(1)}%`, changeType: data.csat.change >= 0 ? "increase" : "decrease" as const },
    { name: "Average Rating", value: `${data.avgRating.value.toFixed(2)} / 5.0`, formula: "Sum of ratings / Number of rated orders", change: data.avgRating.change.toFixed(2), changeType: data.avgRating.change >= 0 ? "increase" : "decrease" as const },
    { name: "Cancelled Orders", value: data.cancelledOrders.value.toLocaleString(), formula: "Total orders marked as cancelled", change: `${data.cancelledOrders.change.toFixed(1)}%`, changeType: data.cancelledOrders.change >= 0 ? "increase" : "decrease" as const, invertColor: true },
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" />
          <span>Client Metrics</span>
        </CardTitle>
        <Button variant="outline" size="sm" onClick={() => setShowChart(!showChart)}>
            {showChart ? <EyeOff className="mr-2 h-4 w-4" /> : <BarChart className="mr-2 h-4 w-4" />}
            {showChart ? "Hide Graph" : "Show Graph"}
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clientMetrics.map((metric) => {
            const isPositive = metric.invertColor ? metric.changeType === "decrease" : metric.changeType === "increase";
            return (
                <div key={metric.name} className="rounded-lg border bg-background/50 p-4 flex flex-col justify-between">
                <div>
                    <p className="text-sm font-medium text-muted-foreground">{metric.name}</p>
                    <p className="text-2xl font-bold mt-1">{metric.value}</p>
                </div>
                <div className="mt-2 pt-2 border-t space-y-1">
                    {metric.change && (
                        <div className="flex items-center text-xs">
                            <span
                                className={cn(
                                    "flex items-center gap-1 font-semibold",
                                    isPositive ? "text-green-600" : "text-red-600"
                                )}
                            >
                                {metric.changeType === "increase" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                                {metric.change}
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
                <ClientMetricsChart activeMetrics={activeMetrics} onMetricToggle={handleMetricToggle} />
            </Suspense>
        </CardContent>
      )}
    </Card>
  );
}
