
"use client";

import * as React from "react";
import { useState, lazy, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, ArrowUp, ArrowDown, BarChart, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { FinancialMetricData } from "@/lib/services/analyticsService";
import { format, subDays, differenceInDays } from 'date-fns';


const FinancialValueChart = lazy(() => import("@/components/detailed-metrics/financial-value-chart"));
const FinancialPercentageChart = lazy(() => import("@/components/detailed-metrics/financial-percentage-chart"));

const formatCurrency = (value: number) => `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function FinancialMetrics() {
  const [showChart, setShowChart] = useState(false);
  const [activePercentageMetrics, setActivePercentageMetrics] = useState({
    profitMargin: true,
    grossMargin: true,
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [financialMetricsData, setFinancialMetricsData] = useState<FinancialMetricData | null>(null);
  const searchParams = useSearchParams();

  const handlePercentageMetricToggle = (metric: string) => {
    setActivePercentageMetrics((prev) => ({ ...prev, [metric]: !prev[metric] }));
  };
  
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  
  const { previousPeriodLabel } = React.useMemo(() => {
    if (!from || !to) return { previousPeriodLabel: "previous period" };
    const fromDate = new Date(from.replace(/-/g, '/'));
    const toDate = new Date(to.replace(/-/g, '/'));
    const duration = differenceInDays(toDate, fromDate);

    const prevTo = subDays(fromDate, 1);
    const prevFrom = subDays(prevTo, duration);
    
    return {
        previousPeriodLabel: `from ${format(prevFrom, 'MMM d')} - ${format(prevTo, 'MMM d, yyyy')}`,
    }
  }, [from, to]);

  React.useEffect(() => {
    async function fetchData() {
        const fromParam = searchParams.get('from');
        const toParam = searchParams.get('to');
        
        setIsLoading(true);
        try {
            const res = await fetch(`/api/analytics/financials?from=${fromParam}&to=${toParam}`);
            if (!res.ok) throw new Error('Failed to fetch financial metrics');
            const data = await res.json();
            setFinancialMetricsData(data);
        } catch(e) {
            console.error("Error fetching financial metrics:", e);
            setFinancialMetricsData(null);
        } finally {
            setIsLoading(false);
        }
    }
    fetchData();
  }, [searchParams]);
  
  if (isLoading) {
    return (
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({length: 8}).map((_, i) => <Skeleton key={i} className="h-[180px] w-full" />)}
       </div>
    )
  }

  if (!financialMetricsData) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-6 w-6 text-primary" />
                    <span>Financial Metrics</span>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p>Could not load financial metrics. Please select a valid date range.</p>
            </CardContent>
        </Card>
    );
  }
  
  const metricsToShow = [
    { name: "Total Revenue", data: financialMetricsData.totalRevenue, formula: "Sum of all income from services" },
    { name: "Total Expenses", data: financialMetricsData.totalExpenses, formula: "Sum of all business expenses", invertColor: true },
    { name: "Net Profit", data: financialMetricsData.netProfit, formula: "Total Revenue - Total Expenses" },
    { name: "Profit Margin (%)", data: financialMetricsData.profitMargin, formula: "((Revenue - Expenses) / Revenue) * 100", isPercentage: true },
    { name: "Gross Margin (%)", data: financialMetricsData.grossMargin, formula: "((Revenue - Salary) / Revenue) * 100", isPercentage: true },
    { name: "Client Acquisition Cost (CAC)", data: financialMetricsData.cac, formula: "Marketing Costs / New Clients", invertColor: true },
    { name: "Customer Lifetime Value (CLTV)", data: { value: 0, change: 0, previousValue: 0, previousPeriodChange: 0 }, formula: "AOV × Repeat Purchase Rate × Avg. Lifespan" },
    { name: "Average Order Value (AOV)", data: { value: 0, change: 0, previousValue: 0, previousPeriodChange: 0 }, formula: "Total Revenue / Number of Orders" },
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-6 w-6 text-primary" />
          <span>Financial Metrics</span>
        </CardTitle>
        <Button variant="outline" size="sm" onClick={() => setShowChart(!showChart)} disabled>
            {showChart ? <EyeOff className="mr-2 h-4 w-4" /> : <BarChart className="mr-2 h-4 w-4" />}
            {showChart ? "Hide Graphs" : "Show Graphs"}
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {metricsToShow.map((metric) => {
            const { value, change, previousValue, previousPeriodChange } = metric.data;
            const isPositive = metric.invertColor ? change < 0 : change >= 0;
            const displayValue = metric.isPercentage ? `${value.toFixed(1)}%` : formatCurrency(value);
            
            return (
                <div key={metric.name} className="rounded-lg border bg-background/50 p-4 flex flex-col justify-between min-h-[160px]">
                    <div>
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-muted-foreground">{metric.name}</p>
                             {change != null && (
                                <span className={cn(
                                    "flex items-center gap-1 text-xs font-semibold",
                                    isPositive ? "text-green-600" : "text-red-600"
                                )}>
                                    {change >= 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                                    {`${Math.abs(change).toFixed(1)}%`}
                                </span>
                            )}
                        </div>
                        <p className="text-2xl font-bold mt-1">{displayValue}</p>
                    </div>
                    <div className="mt-2 pt-2 border-t space-y-1">
                        {previousPeriodChange != null && previousValue != null ? (
                            <div className="flex items-center text-xs flex-wrap">
                                <span className={cn("font-semibold", (metric.isPercentage || previousValue >= 0) ? "text-foreground" : "text-red-600")}>
                                   {metric.isPercentage ? `${previousValue.toFixed(1)}%` : formatCurrency(previousValue)}
                                </span>
                                <span className={cn(
                                    "ml-1 flex items-center gap-0.5",
                                    (metric.invertColor ? previousPeriodChange < 0 : previousPeriodChange >= 0) ? "text-green-600" : "text-red-600"
                                )}>
                                    ({previousPeriodChange >= 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}{Math.abs(previousPeriodChange).toFixed(1)}%)
                                </span>
                                <span className="ml-1 text-muted-foreground">{previousPeriodLabel}</span>
                            </div>
                        ) : (
                             <p className="text-xs text-muted-foreground">{metric.formula}</p>
                        )}
                    </div>
                </div>
            )
          })}
        </div>
      </CardContent>
       {showChart && (
        <CardContent className="space-y-6">
             <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
                <FinancialValueChart data={financialMetricsData.timeSeries} />
            </Suspense>
            <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
                <FinancialPercentageChart 
                  data={financialMetricsData.timeSeries}
                  activeMetrics={activePercentageMetrics}
                  onMetricToggle={handlePercentageMetricToggle}
                />
            </Suspense>
        </CardContent>
      )}
    </Card>
  );
}
