
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
import { useToast } from '@/hooks/use-toast';

const formatCurrency = (value: number) => `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

interface FinancialMetricsProps {
    date: DateRange | undefined;
    selectedSources: string[];
}

export function FinancialMetrics({ date, selectedSources }: FinancialMetricsProps) {
    const [showChart, setShowChart] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [metrics, setMetrics] = useState<FinancialMetricData | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        async function fetchData() {
            if (!date?.from || !date?.to || selectedSources.length === 0) return;
            setIsLoading(true);
            try {
                const query = new URLSearchParams({
                    from: date.from.toISOString(),
                    to: date.to.toISOString(),
                    sources: selectedSources.join(','),
                });
                const res = await fetch(`/api/analytics/financial-metrics?${query.toString()}`);
                if (!res.ok) {
                    const errorData = await res.json();
                    throw new Error(errorData.error || 'Failed to fetch financial metrics');
                }
                const data: FinancialMetricData = await res.json();
                setMetrics(data);
            } catch (e) {
                console.error("Error fetching financial metrics:", e);
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: (e as Error).message || "Could not load financial metrics.",
                });
                setMetrics(null);
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, [date, selectedSources, toast]);
    

    const previousPeriodLabel = useMemo(() => {
        if (!date?.from || !date?.to) return "previous period";
        const duration = differenceInDays(date.to, date.from);
        const prevTo = subDays(date.from, 1);
        const prevFrom = subDays(prevTo, duration);
        return `from ${format(prevFrom, 'MMM d')} to ${format(prevTo, 'MMM d')}`;
    }, [date]);
    
    const metricsToShow = useMemo(() => {
        if (!metrics) return [];
        return [
            { name: "Total Revenue", data: metrics.totalRevenue, formula: "Sum of all order amounts" },
            { name: "Total Expenses", data: metrics.totalExpenses, formula: "Sum of all business expenses", invertColor: true },
            { name: "Net Profit", data: metrics.netProfit, formula: "Total Revenue - Total Expenses" },
            { name: "Profit Margin (%)", data: metrics.profitMargin, formula: "((Revenue - Expenses) / Revenue) * 100", isPercentage: true },
            { name: "Gross Margin (%)", data: metrics.grossMargin, formula: "((Revenue - Salary) / Revenue) * 100", isPercentage: true },
            { name: "Client Acquisition Cost (CAC)", data: metrics.cac, formula: "Marketing Costs / New Clients", invertColor: true },
            { name: "Customer Lifetime Value (CLTV)", data: metrics.cltv, formula: "AOV × Repeat Purchase Rate × Avg. Lifespan" },
            { name: "Average Order Value (AOV)", data: metrics.aov, formula: "Total Revenue / Number of Orders" },
        ];
    }, [metrics]);

    const renderMetricCard = (metric: (typeof metricsToShow)[0]) => {
        const { name, data, formula, invertColor, isPercentage } = metric;
        const { value, change, previousPeriodChange, previousValue } = data;

        const currentChangeType = change >= 0 ? "increase" : "decrease";
        const isCurrentPositive = invertColor ? currentChangeType === "decrease" : currentChangeType === "increase";

        const prevChangeType = previousPeriodChange >= 0 ? "increase" : "decrease";
        const isPrevPositive = invertColor ? prevChangeType === "decrease" : prevChangeType === "increase";
        
        let displayValue: string, displayPreviousValue: string;
        
        if (isPercentage) {
            displayValue = `${value.toFixed(1)}%`;
            displayPreviousValue = `${previousValue.toFixed(1)}%`;
        } else {
            displayValue = formatCurrency(value);
            displayPreviousValue = formatCurrency(previousValue);
        }

        return (
            <div key={name} className="rounded-lg border bg-background/50 p-4 flex flex-col justify-between">
                <div>
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-muted-foreground">{name}</p>
                        {change != null && (
                            <span className={cn("flex items-center gap-1 text-xs font-semibold", isCurrentPositive ? "text-green-600" : "text-red-600")}>
                                {currentChangeType === "increase" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                                {`${Math.abs(change).toFixed(1)}%`}
                            </span>
                        )}
                    </div>
                    <p className="text-2xl font-bold mt-1">{displayValue}</p>
                </div>
                <div className="mt-2 pt-2 border-t space-y-1 text-xs">
                     <p className={cn("flex items-center gap-1 font-semibold", isPrevPositive ? "text-green-600" : "text-red-600")}>
                        {prevChangeType === "increase" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                        {`${Math.abs(previousPeriodChange).toFixed(1)}%`}
                    </p>
                    <p className="text-muted-foreground">from {displayPreviousValue} ({previousPeriodLabel})</p>
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
        
        if (!metrics) {
            return <p className="text-muted-foreground">Could not load financial data for the selected period.</p>
        }

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {metricsToShow.map(renderMetricCard)}
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
