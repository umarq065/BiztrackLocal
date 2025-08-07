
"use client";

import { useState, lazy, Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { format, subDays, differenceInDays } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, ArrowUp, ArrowDown, EyeOff, BarChart, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { OrderCountAnalytics } from "@/lib/services/analyticsService";

// Placeholder data - replace with dynamic data later
const otherOrderMetricsData = [
    { name: "Orders From New Buyers", value: "850", formula: "Orders from clients making their first purchase", change: 20.1, previousValue: "708", changeType: "increase" as const },
    { name: "Orders From Repeat Buyers", value: "400", formula: "Orders from clients who have purchased before", change: 8.5, previousValue: "368", changeType: "increase" as const },
    { name: "Average Order Value", value: "$125.50", formula: "Total Revenue / Total Orders", change: -2.5, previousValue: "$128.72", changeType: "decrease" as const },
    { name: "Average Rating", value: "4.8 / 5.0", formula: "Average of all order ratings", change: 0.1, previousValue: "4.7", changeType: "increase" as const },
    { name: "Cancelled Orders", value: "35", formula: "Total number of cancelled orders", change: 5.1, previousValue: "33", changeType: "increase" as const, invertColor: true },
];

const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) {
        return current > 0 ? 100 : 0;
    }
    return ((current - previous) / previous) * 100;
};

export function OrderMetrics() {
  const [showChart, setShowChart] = useState(false);
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [orderCountData, setOrderCountData] = useState<OrderCountAnalytics | null>(null);

  const from = searchParams.get('from');
  const to = searchParams.get('to');

  useEffect(() => {
    async function fetchData() {
        if (!from || !to) return;
        setIsLoading(true);
        try {
            const res = await fetch(`/api/analytics/order-count?from=${from}&to=${to}`);
            if (!res.ok) throw new Error('Failed to fetch order count');
            const data = await res.json();
            setOrderCountData(data);
        } catch(e) {
            console.error("Error fetching order count:", e);
            setOrderCountData(null);
        } finally {
            setIsLoading(false);
        }
    }
    fetchData();
  }, [from, to]);
  
  const totalOrdersMetric = {
    currentPeriodCount: orderCountData?.currentPeriodOrders ?? 0,
    growthVsPrevious: orderCountData ? calculateGrowth(orderCountData.currentPeriodOrders, orderCountData.previousPeriodOrders) : 0,
    previousPeriodCount: orderCountData?.previousPeriodOrders ?? 0,
    previousPeriodGrowth: orderCountData ? calculateGrowth(orderCountData.previousPeriodOrders, orderCountData.periodBeforePreviousOrders) : 0,
  };

  const isGrowthPositive = totalOrdersMetric.growthVsPrevious >= 0;
  const isPreviousGrowthPositive = totalOrdersMetric.previousPeriodGrowth >= 0;

  const previousPeriodDateRange = (() => {
    if (!from || !to) return "previous period";
    const fromDate = new Date(from.replace(/-/g, '/'));
    const toDate = new Date(to.replace(/-/g, '/'));
    const duration = differenceInDays(toDate, fromDate);
    const prevTo = subDays(fromDate, 1);
    const prevFrom = subDays(prevTo, duration);
    return `from ${format(prevFrom, 'MMM d')} - ${format(prevTo, 'MMM d, yyyy')}`;
  })();

  const renderTotalOrdersCard = () => {
    if (isLoading) {
        return (
             <div className="rounded-lg border bg-background/50 p-4 flex flex-col justify-between min-h-[180px]">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-8 w-1/2 mt-1" />
                <div className="mt-2 pt-2 border-t space-y-1">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                </div>
            </div>
        )
    }
    return (
        <div className="rounded-lg border bg-background/50 p-4 flex flex-col justify-between">
            <div>
                <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
                    <span
                        className={cn(
                            "flex items-center gap-1 text-xs font-semibold",
                            isGrowthPositive ? "text-green-600" : "text-red-600"
                        )}
                    >
                        (
                        {isGrowthPositive ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                        {`${Math.abs(totalOrdersMetric.growthVsPrevious).toFixed(1)}%`}
                        )
                    </span>
                </div>
                <p className="text-2xl font-bold mt-1">{totalOrdersMetric.currentPeriodCount.toLocaleString()}</p>
            </div>
            <div className="mt-2 pt-2 border-t space-y-1 text-xs">
                <p className={cn("flex items-center gap-1 font-semibold", isPreviousGrowthPositive ? "text-green-600" : "text-red-600")}>
                    {isPreviousGrowthPositive ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                    {totalOrdersMetric.previousPeriodGrowth.toFixed(1)}%
                </p>
                <p className="text-muted-foreground">from {totalOrdersMetric.previousPeriodCount.toLocaleString()} ({previousPeriodDateRange})</p>
                <p className="text-muted-foreground pt-1">Total number of completed orders</p>
            </div>
        </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="h-6 w-6 text-primary" />
          <span>Order Metrics</span>
        </CardTitle>
        <Button variant="outline" size="sm" onClick={() => setShowChart(!showChart)} disabled>
            {showChart ? <EyeOff className="mr-2 h-4 w-4" /> : <BarChart className="mr-2 h-4 w-4" />}
            {showChart ? "Hide Graph" : "Show Graph"}
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {renderTotalOrdersCard()}
          {otherOrderMetricsData.map((metric) => {
            const isPositive = metric.invertColor ? metric.changeType === "decrease" : metric.changeType === "increase";
            const isCurrency = metric.value.includes("$");
            const previousValueDisplay = metric.previousValue;
            const dummyDateRange = "(from Jul 19 - Jul 28, 2025)";

            return (
                <div key={metric.name} className="rounded-lg border bg-background/50 p-4 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-muted-foreground">{metric.name}</p>
                            {metric.change && (
                                <span
                                    className={cn(
                                        "flex items-center gap-1 text-xs font-semibold",
                                        isPositive ? "text-green-600" : "text-red-600"
                                    )}
                                >
                                    (
                                    {metric.changeType === "increase" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                                    {metric.name === "Average Rating" ? metric.change.toFixed(1) : `${Math.abs(metric.change).toFixed(1)}%`}
                                    )
                                </span>
                            )}
                        </div>
                        <p className="text-2xl font-bold mt-1">{metric.value}</p>
                    </div>
                    <div className="mt-2 pt-2 border-t space-y-1 text-xs">
                        {metric.change && (
                            <p className={cn("flex items-center gap-1 font-semibold", isPositive ? "text-green-600" : "text-red-600")}>
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
