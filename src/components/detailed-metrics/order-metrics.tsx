
"use client";

import { useState, lazy, Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, ArrowUp, ArrowDown, EyeOff, BarChart } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

// Placeholder data - replace with dynamic data later
const orderMetricsData = [
    { name: "Total Orders", value: "1,250", formula: "Total number of completed orders", change: 15.2, previousValue: "1,085", changeType: "increase" as const },
    { name: "Orders From New Buyers", value: "850", formula: "Orders from clients making their first purchase", change: 20.1, previousValue: "708", changeType: "increase" as const },
    { name: "Orders From Repeat Buyers", value: "400", formula: "Orders from clients who have purchased before", change: 8.5, previousValue: "368", changeType: "increase" as const },
    { name: "Average Order Value", value: "$125.50", formula: "Total Revenue / Total Orders", change: -2.5, previousValue: "$128.72", changeType: "decrease" as const },
    { name: "Average Rating", value: "4.8 / 5.0", formula: "Average of all order ratings", change: 0.1, previousValue: "4.7", changeType: "increase" as const },
    { name: "Cancelled Orders", value: "35", formula: "Total number of cancelled orders", change: 5.1, previousValue: "33", changeType: "increase" as const, invertColor: true },
];

export function OrderMetrics() {
  const [showChart, setShowChart] = useState(false);
  // Add chart state if needed in the future
  // const [activeMetrics, setActiveMetrics] = useState({});
  // const handleMetricToggle = (metric: string) => {};

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="h-6 w-6 text-primary" />
          <span>Order Metrics</span>
        </CardTitle>
        {/* Button to toggle chart - disabled for now */}
        <Button variant="outline" size="sm" onClick={() => setShowChart(!showChart)} disabled>
            {showChart ? <EyeOff className="mr-2 h-4 w-4" /> : <BarChart className="mr-2 h-4 w-4" />}
            {showChart ? "Hide Graph" : "Show Graph"}
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {orderMetricsData.map((metric) => {
            const isPositive = metric.invertColor ? metric.changeType === "decrease" : metric.changeType === "increase";
            const isCurrency = metric.value.includes("$");
            const previousValueDisplay = isCurrency ? metric.previousValue : metric.previousValue;
            const dummyDateRange = "(from Jul 19 - Jul 28, 2025)";

            return (
                <div key={metric.name} className="rounded-lg border bg-background/50 p-4 flex flex-col justify-between">
                <div>
                    <p className="text-sm font-medium text-muted-foreground">{metric.name}</p>
                    <p className="text-2xl font-bold mt-1">{metric.value}</p>
                </div>
                <div className="mt-2 pt-2 border-t space-y-1 text-xs">
                    {metric.change && (
                        <p
                            className={cn(
                                "flex items-center gap-1 font-semibold",
                                isPositive ? "text-green-600" : "text-red-600"
                            )}
                        >
                            {metric.changeType === "increase" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                            {metric.name === "Average Rating" ? metric.change.toFixed(1) : `${metric.change.toFixed(1)}%`}
                        </p>
                    )}
                    <p className="text-muted-foreground">from {previousValueDisplay} {dummyDateRange}</p>
                    <p className="text-muted-foreground pt-1">{metric.formula}</p>
                </div>
                </div>
            )
          })}
        </div>
      </CardContent>
      {/* Placeholder for chart if it's implemented later */}
      {showChart && (
        <CardContent>
             <Suspense fallback={<Skeleton className="h-[300px] w-full" />}>
                {/* <OrderMetricsChart activeMetrics={activeMetrics} onMetricToggle={handleMetricToggle} /> */}
            </Suspense>
        </CardContent>
      )}
    </Card>
  );
}
