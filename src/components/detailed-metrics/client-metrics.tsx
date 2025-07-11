"use client";

import { useState, lazy, Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, ArrowUp, ArrowDown, BarChart, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const ClientMetricsChart = lazy(() => import("@/components/detailed-metrics/client-metrics-chart"));

const clientMetrics = [
    { name: "Total Clients", value: "125", formula: "Total unique clients in period", change: "+15", changeType: "increase" as const },
    { name: "New Clients", value: "30", formula: "Clients with their first order in period", change: "+5", changeType: "increase" as const },
    { name: "Repeat Orders", value: "95", formula: "Orders from existing clients", change: "+12%", changeType: "increase" as const },
    { name: "Client Retention Rate (%)", value: "85%", formula: "((End Clients - New) / Start Clients) × 100", change: "+2.0%", changeType: "increase" as const },
    { name: "Repeat Purchase Rate (%)", value: "34%", formula: "(Repeat Clients / Total Clients) × 100", change: "-1.5%", changeType: "decrease" as const },
    { name: "Client Satisfaction (CSAT)", value: "92%", formula: "(Positive Ratings / Total Ratings) × 100", change: "+3.0%", changeType: "increase" as const },
    { name: "Average Rating", value: "4.8 / 5.0", formula: "Sum of ratings / Number of rated orders", change: "+0.1", changeType: "increase" as const },
    { name: "Cancelled Orders", value: "12", formula: "Total orders marked as cancelled", change: "+2", changeType: "increase" as const, invertColor: true },
];

export function ClientMetrics() {
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {clientMetrics.map((metric) => {
            const isPositive = (metric as any).invertColor ? metric.changeType === "decrease" : metric.changeType === "increase";
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
                            <span className="ml-1 text-muted-foreground">vs selected period</span>
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
