
"use client";

import { useState, lazy, Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, ArrowUp, ArrowDown, BarChart, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const FinancialValueChart = lazy(() => import("@/components/detailed-metrics/financial-value-chart"));
const FinancialPercentageChart = lazy(() => import("@/components/detailed-metrics/financial-percentage-chart"));

const financialMetrics = [
  { name: "Total Revenue", value: "$45,231.89", formula: "Sum of all income from services", change: "+12.5%", changeType: "increase" as const },
  { name: "Total Expenses", value: "$10,543.00", formula: "Sum of all business expenses", change: "+8.2%", changeType: "increase" as const, invertColor: true },
  { name: "Net Profit", value: "$34,688.89", formula: "Total Revenue - Total Expenses", change: "+14.1%", changeType: "increase" as const },
  { name: "Profit Margin (%)", value: "76.7%", formula: "(Net Profit / Total Revenue) × 100", change: "+1.8%", changeType: "increase" as const },
  { name: "Gross Margin (%)", value: "85.2%", formula: "((Revenue - Cost of Services Sold) / Revenue) × 100", change: "-0.5%", changeType: "decrease" as const },
  { name: "Client Acquisition Cost (CAC)", value: "$150.25", formula: "Total Sales & Marketing Costs / Number of New Clients", change: "+5.0%", changeType: "increase" as const, invertColor: true },
  { name: "Customer Lifetime Value (CLTV)", value: "$2,540.75", formula: "AOV × Repeat Purchase Rate × Avg. Client Lifespan", change: "+20.3%", changeType: "increase" as const },
  { name: "Average Order Value (AOV)", value: "$131.50", formula: "Total Revenue / Number of Orders", change: "-3.2%", changeType: "decrease" as const },
];

export function FinancialMetrics() {
  const [showChart, setShowChart] = useState(false);
  const [activePercentageMetrics, setActivePercentageMetrics] = useState({
    profitMargin: true,
    grossMargin: true,
  });

  const handlePercentageMetricToggle = (metric: string) => {
    setActivePercentageMetrics((prev) => ({ ...prev, [metric]: !prev[metric] }));
  };


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
                <FinancialValueChart />
            </Suspense>
            <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
                <FinancialPercentageChart 
                  activeMetrics={activePercentageMetrics}
                  onMetricToggle={handlePercentageMetricToggle}
                />
            </Suspense>
        </CardContent>
      )}
    </Card>
  );
}
