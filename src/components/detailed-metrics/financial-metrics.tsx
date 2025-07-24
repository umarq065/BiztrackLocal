
"use client";

import { useState, lazy, Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, ArrowUp, ArrowDown, BarChart, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { FinancialMetricData } from "@/lib/services/analyticsService";

const FinancialValueChart = lazy(() => import("@/components/detailed-metrics/financial-value-chart"));
const FinancialPercentageChart = lazy(() => import("@/components/detailed-metrics/financial-percentage-chart"));

interface FinancialMetricsProps {
    data: FinancialMetricData;
}

const formatCurrency = (value: number) => `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function FinancialMetrics({ data }: FinancialMetricsProps) {
  const [showChart, setShowChart] = useState(false);
  const [activePercentageMetrics, setActivePercentageMetrics] = useState({
    profitMargin: true,
    grossMargin: true,
  });

  const handlePercentageMetricToggle = (metric: string) => {
    setActivePercentageMetrics((prev) => ({ ...prev, [metric]: !prev[metric] }));
  };

  const financialMetrics = [
    { name: "Total Revenue", value: formatCurrency(data.totalRevenue.value), formula: "Sum of all income from services", change: `${data.totalRevenue.change.toFixed(1)}%`, changeType: data.totalRevenue.change >= 0 ? "increase" : "decrease" as const },
    { name: "Total Expenses", value: formatCurrency(data.totalExpenses.value), formula: "Sum of all business expenses", change: `${data.totalExpenses.change.toFixed(1)}%`, changeType: data.totalExpenses.change >= 0 ? "increase" : "decrease" as const, invertColor: true },
    { name: "Net Profit", value: formatCurrency(data.netProfit.value), formula: "Total Revenue - Total Expenses", change: `${data.netProfit.change.toFixed(1)}%`, changeType: data.netProfit.change >= 0 ? "increase" : "decrease" as const },
    { name: "Profit Margin (%)", value: `${data.profitMargin.value.toFixed(1)}%`, formula: "(Net Profit / Total Revenue) × 100", change: `${data.profitMargin.change.toFixed(1)}%`, changeType: data.profitMargin.change >= 0 ? "increase" : "decrease" as const },
    { name: "Gross Margin (%)", value: `${data.grossMargin.value.toFixed(1)}%`, formula: "((Revenue - Cost of Services) / Revenue) × 100", change: `${data.grossMargin.change.toFixed(1)}%`, changeType: data.grossMargin.change >= 0 ? "increase" : "decrease" as const },
    { name: "Client Acquisition Cost (CAC)", value: formatCurrency(data.cac.value), formula: "Sales & Marketing Costs / New Clients", change: `${data.cac.change.toFixed(1)}%`, changeType: data.cac.change >= 0 ? "increase" : "decrease" as const, invertColor: true },
    { name: "Customer Lifetime Value (CLTV)", value: formatCurrency(data.cltv.value), formula: "AOV × Repeat Purchase Rate × Avg. Lifespan", change: `${data.cltv.change.toFixed(1)}%`, changeType: data.cltv.change >= 0 ? "increase" : "decrease" as const },
    { name: "Average Order Value (AOV)", value: formatCurrency(data.aov.value), formula: "Total Revenue / Number of Orders", change: `${data.aov.change.toFixed(1)}%`, changeType: data.aov.change >= 0 ? "increase" : "decrease" as const },
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-6 w-6 text-primary" />
          <span>Financial Metrics</span>
        </CardTitle>
        <Button variant="outline" size="sm" onClick={() => setShowChart(!showChart)}>
            {showChart ? <EyeOff className="mr-2 h-4 w-4" /> : <BarChart className="mr-2 h-4 w-4" />}
            {showChart ? "Hide Graphs" : "Show Graphs"}
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {financialMetrics.map((metric) => {
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
        <CardContent className="space-y-6">
             <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
                <FinancialValueChart data={data.timeSeries} />
            </Suspense>
            <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
                <FinancialPercentageChart 
                  data={data.timeSeries}
                  activeMetrics={activePercentageMetrics}
                  onMetricToggle={handlePercentageMetricToggle}
                />
            </Suspense>
        </CardContent>
      )}
    </Card>
  );
}
