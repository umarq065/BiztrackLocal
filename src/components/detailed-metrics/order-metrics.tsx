
"use client";

import { useState, lazy, Suspense, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { format, subDays, differenceInDays } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, ArrowUp, ArrowDown, EyeOff, BarChart, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { OrderCountAnalytics } from "@/lib/services/analyticsService";

// Placeholder data for metrics not yet connected
const otherOrderMetricsData = [
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
  const [analyticsData, setAnalyticsData] = useState<OrderCountAnalytics | null>(null);

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
            setAnalyticsData(data);
        } catch(e) {
            console.error("Error fetching order count:", e);
            setAnalyticsData(null);
        } finally {
            setIsLoading(false);
        }
    }
    fetchData();
  }, [from, to]);
  
  const dynamicMetrics = useMemo(() => {
      if (!analyticsData) return {
          totalOrders: { value: 0, growth: 0, prevPeriodGrowth: 0, prevValue: 0 },
          newBuyerOrders: { value: 0, growth: 0, prevPeriodGrowth: 0, prevValue: 0 },
          repeatBuyerOrders: { value: 0, growth: 0, prevPeriodGrowth: 0, prevValue: 0 },
      };

      return {
          totalOrders: {
              value: analyticsData.currentPeriodOrders.total,
              growth: calculateGrowth(analyticsData.currentPeriodOrders.total, analyticsData.previousPeriodOrders.total),
              prevPeriodGrowth: calculateGrowth(analyticsData.previousPeriodOrders.total, analyticsData.periodBeforePreviousOrders.total),
              prevValue: analyticsData.previousPeriodOrders.total,
          },
          newBuyerOrders: {
              value: analyticsData.currentPeriodOrders.fromNewBuyers,
              growth: calculateGrowth(analyticsData.currentPeriodOrders.fromNewBuyers, analyticsData.previousPeriodOrders.fromNewBuyers),
              prevPeriodGrowth: calculateGrowth(analyticsData.previousPeriodOrders.fromNewBuyers, analyticsData.periodBeforePreviousOrders.fromNewBuyers),
              prevValue: analyticsData.previousPeriodOrders.fromNewBuyers,
          },
          repeatBuyerOrders: {
              value: analyticsData.currentPeriodOrders.fromRepeatBuyers,
              growth: calculateGrowth(analyticsData.currentPeriodOrders.fromRepeatBuyers, analyticsData.previousPeriodOrders.fromRepeatBuyers),
              prevPeriodGrowth: calculateGrowth(analyticsData.previousPeriodOrders.fromRepeatBuyers, analyticsData.periodBeforePreviousOrders.fromRepeatBuyers),
              prevValue: analyticsData.previousPeriodOrders.fromRepeatBuyers,
          },
      }
  }, [analyticsData]);

  const previousPeriodDateRange = (() => {
    if (!from || !to) return "previous period";
    const fromDate = new Date(from.replace(/-/g, '/'));
    const toDate = new Date(to.replace(/-/g, '/'));
    const duration = differenceInDays(toDate, fromDate);
    const prevTo = subDays(fromDate, 1);
    const prevFrom = subDays(prevTo, duration);
    return `from ${format(prevFrom, 'MMM d')} - ${format(prevTo, 'MMM d, yyyy')}`;
  })();
  
  const renderMetricCard = (
      name: string,
      metricData: { value: number, growth: number, prevPeriodGrowth: number, prevValue: number },
      formula: string,
      invertColor = false
    ) => {
        const isGrowthPositive = !invertColor ? metricData.growth >= 0 : metricData.growth < 0;
        const isPrevGrowthPositive = !invertColor ? metricData.prevPeriodGrowth >= 0 : metricData.prevPeriodGrowth < 0;
        
        return (
             <div key={name} className="rounded-lg border bg-background/50 p-4 flex flex-col justify-between">
                <div>
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-muted-foreground">{name}</p>
                         <span
                            className={cn(
                                "flex items-center gap-1 text-xs font-semibold",
                                isGrowthPositive ? "text-green-600" : "text-red-600"
                            )}
                        >
                            (
                            {metricData.growth >= 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                            {`${Math.abs(metricData.growth).toFixed(1)}%`}
                            )
                        </span>
                    </div>
                    <p className="text-2xl font-bold mt-1">{metricData.value.toLocaleString()}</p>
                </div>
                <div className="mt-2 pt-2 border-t space-y-1 text-xs">
                     <p className={cn("flex items-center gap-1 font-semibold", isPrevGrowthPositive ? "text-green-600" : "text-red-600")}>
                        {isPrevGrowthPositive ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                        {metricData.prevPeriodGrowth.toFixed(1)}%
                    </p>
                    <p className="text-muted-foreground">from {metricData.prevValue.toLocaleString()} ({previousPeriodDateRange})</p>
                    <p className="text-muted-foreground pt-1">{formula}</p>
                </div>
            </div>
        );
    }

  const renderContent = () => {
      if (isLoading) {
          return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-lg border bg-background/50 p-4 flex flex-col justify-between min-h-[180px]">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-8 w-1/2 mt-1" />
                  <div className="mt-2 pt-2 border-t space-y-1">
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-4 w-full" />
                  </div>
                </div>
              ))}
            </div>
          )
      }
      
      const metricsToShow = [
        { name: "Total Orders", data: dynamicMetrics.totalOrders, formula: "Total number of completed orders" },
        { name: "Orders From New Buyers", data: dynamicMetrics.newBuyerOrders, formula: "Orders from clients making their first purchase in this period" },
        { name: "Orders From Repeat Buyers", data: dynamicMetrics.repeatBuyerOrders, formula: "Orders from clients who have purchased before this period" },
      ];
      
       return (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {metricsToShow.map(m => renderMetricCard(m.name, m.data, m.formula))}

            {otherOrderMetricsData.map((metric) => {
              const isPositive = metric.invertColor ? metric.changeType === "decrease" : metric.changeType === "increase";
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
                        <p className="text-muted-foreground">from {metric.previousValue} (from Jul 19 - Jul 28, 2025)</p>
                        <p className="text-muted-foreground pt-1">{metric.formula}</p>
                    </div>
                  </div>
              )
            })}
        </div>
      )
  };


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
        {renderContent()}
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
