

"use client";

import { useState, lazy, Suspense, useEffect, useMemo } from 'react';
import type { DateRange } from "react-day-picker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUp, ArrowDown, BarChart, EyeOff, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { format, subDays, differenceInDays } from 'date-fns';
import type { FinancialMetricData } from '@/lib/services/analyticsService';

const otherFinancialMetrics = [
    { name: "Client Acquisition Cost (CAC)", value: "$100", formula: "Marketing Costs / New Clients", change: -10, previousValue: "$110", changeType: "decrease" as const },
    { name: "Customer Lifetime Value (CLTV)", value: "$1,000", formula: "AOV × Repeat Purchase Rate × Avg. Lifespan", change: 5, previousValue: "$950", changeType: "increase" as const },
    { name: "Average Order Value (AOV)", value: "$100", formula: "Total Revenue / Number of Orders", change: 12, previousValue: "$88", changeType: "increase" as const },
];

const formatCurrency = (value: number) => `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function FinancialMetrics({ date }: { date: DateRange | undefined }) {
    const [showChart, setShowChart] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [metrics, setMetrics] = useState<FinancialMetricData | null>(null);

    const previousPeriodLabel = useMemo(() => {
        if (!date?.from || !date?.to) return "previous period";
        const duration = differenceInDays(date.to, date.from);
        const prevTo = subDays(date.from, 1);
        const prevFrom = subDays(prevTo, duration);
        return `from ${format(prevFrom, 'MMM d')} to ${format(prevTo, 'MMM d')}`;
    }, [date]);
    
    useEffect(() => {
        async function fetchMetrics() {
            if (!date?.from || !date?.to) return;
            setIsLoading(true);
            try {
                const query = new URLSearchParams({
                    from: date.from.toISOString(),
                    to: date.to.toISOString()
                });
                const res = await fetch(`/api/analytics/financial-metrics?${query.toString()}`);
                if (!res.ok) throw new Error('Failed to fetch financial metrics');
                const data = await res.json();
                setMetrics(data);
            } catch (e) {
                console.error("Error fetching financial metrics:", e);
                setMetrics(null);
            } finally {
                setIsLoading(false);
            }
        }
        fetchMetrics();
    }, [date]);

    const metricsToShow = useMemo(() => {
        if (!metrics) return [];
        return [
            { name: "Total Revenue", data: metrics.totalRevenue, formula: "Sum of all order amounts" },
            { name: "Total Expenses", data: metrics.totalExpenses, formula: "Sum of all business expenses", invertColor: true },
            { name: "Net Profit", data: metrics.netProfit, formula: "Total Revenue - Total Expenses" },
            { name: "Profit Margin (%)", data: metrics.profitMargin, formula: "((Revenue - Expenses) / Revenue) * 100", isPercentage: true },
            { name: "Gross Margin (%)", data: metrics.grossMargin, formula: "((Revenue - Salary) / Revenue) * 100", isPercentage: true },
        ];
    }, [metrics]);

    const renderMetricCard = (metric: (typeof metricsToShow)[0]) => {
        const { name, data, formula, invertColor, isPercentage } = metric;
        const { value, change, previousValue } = data;

        const changeType = change >= 0 ? "increase" : "decrease";
        const isPositive = invertColor ? changeType === "decrease" : changeType === "increase";

        const displayValue = isPercentage ? `${value.toFixed(1)}%` : formatCurrency(value);
        const displayPrevValue = isPercentage ? `${previousValue.toFixed(1)}%` : formatCurrency(previousValue);

        return (
            <div key={name} className="rounded-lg border bg-background/50 p-4 flex flex-col justify-between">
                <div>
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-muted-foreground">{name}</p>
                        {change != null && (
                            <span className={cn("flex items-center gap-1 text-xs font-semibold", isPositive ? "text-green-600" : "text-red-600")}>
                                (
                                {changeType === "increase" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                                {`${Math.abs(change).toFixed(1)}%`}
                                )
                            </span>
                        )}
                    </div>
                    <p className="text-2xl font-bold mt-1">{displayValue}</p>
                </div>
                <div className="mt-2 pt-2 border-t space-y-1 text-xs">
                     <p className="text-muted-foreground">vs. {displayPrevValue} ({previousPeriodLabel})</p>
                    <p className="text-muted-foreground pt-1">{formula}</p>
                </div>
            </div>
        );
    }

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-[180px] w-full" />)}
                </div>
            )
        }

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {metricsToShow.map(renderMetricCard)}
                {otherFinancialMetrics.map((metric) => {
                    const isPositive = metric.changeType === "increase";
                    return (
                        <div key={metric.name} className="rounded-lg border bg-background/50 p-4 flex flex-col justify-between opacity-50">
                            <div>
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium text-muted-foreground">{metric.name}</p>
                                    <span className={cn("flex items-center gap-1 text-xs font-semibold", isPositive ? "text-green-600" : "text-red-600")}>
                                        (
                                        {isPositive ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                                        {metric.change}%
                                        )
                                    </span>
                                </div>
                                <p className="text-2xl font-bold mt-1">{metric.value}</p>
                            </div>
                            <div className="mt-2 pt-2 border-t space-y-1 text-xs">
                                <p className="text-muted-foreground">vs. {metric.previousValue} ({previousPeriodLabel})</p>
                                <p className="text-muted-foreground pt-1">{metric.formula}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        )
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-6 w-6 text-primary" />
                    Financial Metrics
                </CardTitle>
                <Button variant="outline" size="sm" onClick={() => setShowChart(!showChart)} disabled>
                    {showChart ? <EyeOff className="mr-2 h-4 w-4" /> : <BarChart className="mr-2 h-4 w-4" />} {showChart ? "Hide Graph" : "Show Graph"}
                </Button>
            </CardHeader>
            <CardContent>
                {renderContent()}
            </CardContent>
        </Card>
    );
}
