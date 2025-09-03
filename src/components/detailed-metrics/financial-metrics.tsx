
"use client";

import * as React from "react";
import { useState, lazy, Suspense, useEffect, useMemo } from "react";
import type { DateRange } from "react-day-picker";
import { format, subDays, differenceInDays, parseISO } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, ArrowUp, ArrowDown, BarChart, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { FinancialMetricData } from "@/lib/services/analyticsService";

const FinancialValueChart = lazy(() => import("@/components/detailed-metrics/financial-value-chart"));
const FinancialPercentageChart = lazy(() => import("@/components/detailed-metrics/financial-percentage-chart"));

const formatCurrency = (value: number) => `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function FinancialMetrics({ date }: { date: DateRange | undefined }) {
  const [showChart, setShowChart] = useState(false);
  const [activePercentageMetrics, setActivePercentageMetrics] = useState({
    profitMargin: true,
    grossMargin: true,
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [financialMetricsData, setFinancialMetricsData] = useState<FinancialMetricData | null>(null);

  const handlePercentageMetricToggle = (metric: string) => {
    setActivePercentageMetrics((prev) => ({ ...prev, [metric]: !prev[metric] }));
  };
  
  useEffect(() => {
    async function fetchData() {
        if (!date?.from || !date.to) {
            setIsLoading(false);
            setFinancialMetricsData(null);
            return;
        }
        setIsLoading(true);
        const query = new URLSearchParams({ 
            from: date.from.toISOString(), 
            to: date.to.toISOString() 
        });

        try {
            const res = await fetch(`/api/analytics/financials?${query.toString()}`);
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
  }, [date]);
  
  const previousPeriodLabel = useMemo(() => {
    if (!date?.from || !date?.to) return "previous period";
    const from = date.from;
    const to = date.to;
    const duration = differenceInDays(to, from);
    const prevTo = subDays(from, 1);
    const prevFrom = subDays(prevTo, duration);
    return `from ${format(prevFrom, 'MMM d')} to ${format(prevTo, 'MMM d, yyyy')}`;
  }, [date]);

  const metricsToShow = useMemo(() => {
    if (!financialMetricsData) return [];
    return [
        { name: "Total Revenue", data: financialMetricsData.totalRevenue, formula: "Sum of all income from services" },
        { name: "Total Expenses", data: financialMetricsData.totalExpenses, formula: "Sum of all business expenses", options: { invertColor: true } },
        { name: "Net Profit", data: financialMetricsData.netProfit, formula: "Total Revenue - Total Expenses" },
        { name: "Profit Margin (%)", data: financialMetricsData.profitMargin, formula: "((Revenue - Expenses) / Revenue) * 100", options: { isPercentage: true } },
        { name: "Gross Margin (%)", data: financialMetricsData.grossMargin, formula: "((Revenue - Salary) / Revenue) * 100", options: { isPercentage: true } },
        { name: "Client Acquisition Cost (CAC)", data: financialMetricsData.cac, formula: "Marketing Costs / New Clients", options: { invertColor: true } },
        { name: "Customer Lifetime Value (CLTV)", data: financialMetricsData.cltv, formula: "AOV × Repeat Purchase Rate × Avg. Lifespan" },
        { name: "Average Order Value (AOV)", data: financialMetricsData.aov, formula: "Total Revenue / Number of Orders" },
    ];
  }, [financialMetricsData]);
  
  if (isLoading) {
    return (
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({length: 8}).map((_, i) => <Skeleton key={i} className="h-[180px] w-full" />)}
       </div>
    );
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

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-6 w-6 text-primary" />
          <span>Financial Metrics</span>
        </Title>
        <Button variant="outline" size="sm" onClick={() => setShowChart(!showChart)} disabled={!financialMetricsData.timeSeries || financialMetricsData.timeSeries.length === 0}>
            {showChart ? <EyeOff className="mr-2 h-4 w-4" /> : <BarChart className="mr-2 h-4 w-4" />}
            {showChart ? "Hide Graphs" : "Show Graphs"}
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {metricsToShow.map((metric) => {
            const { name, data: metricData, formula, options } = metric;
            const isPercentage = options?.isPercentage || false;
            const invertColor = options?.invertColor || false;
            
            if (!metricData) {
                return (
                    <div key={name} className="rounded-lg border bg-background/50 p-4 flex flex-col justify-between min-h-[160px]">
                        <p className="text-sm font-medium text-muted-foreground">{name}</p>
                        <p className="text-2xl font-bold mt-1 text-muted-foreground">--</p>
                        <div className="mt-2 pt-2 border-t space-y-1">
                            <p className="text-xs text-muted-foreground">{formula}</p>
                        </div>
                    </div>
                );
            }
            
            const { value, change, previousValue } = metricData;
            const isPositive = invertColor ? change < 0 : change >= 0;
            const displayValue = isPercentage ? `${value.toFixed(1)}%` : formatCurrency(value);

            return (
                <div key={name} className="rounded-lg border bg-background/50 p-4 flex flex-col justify-between min-h-[160px]">
                    <div>
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-muted-foreground">{name}</p>
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
                        {previousValue != null ? (
                            <>
                                <p className="text-xs text-muted-foreground">
                                    vs. {isPercentage ? `${previousValue.toFixed(1)}%` : formatCurrency(previousValue)}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {previousPeriodLabel}
                                </p>
                                <p className="text-xs text-muted-foreground pt-1">{formula}</p>
                            </>
                        ) : (
                            <p className="text-xs text-muted-foreground">{formula}</p>
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
