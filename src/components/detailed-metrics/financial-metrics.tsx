
"use client";

import { useState, lazy, Suspense, useEffect, useMemo } from 'react';
import type { DateRange } from "react-day-picker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUp, ArrowDown, BarChart, EyeOff, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { format, subDays, differenceInDays } from 'date-fns';

// Placeholder for other financial metrics (dummy data)
const otherFinancialMetrics = [
    { name: "Total Expenses", value: "$50,000", formula: "Sum of all business expenses", change: "-5", changeType: "decrease" as const, previousValue: "$52,500" },
    { name: "Net Profit", value: "$50,000", formula: "Total Revenue - Total Expenses", change: "+15", changeType: "increase" as const, previousValue: "$37,500" },
    { name: "Profit Margin (%)", value: "50%", formula: "((Revenue - Expenses) / Revenue) * 100", change: "+2", changeType: "increase" as const, previousValue: "48" },
    { name: "Gross Margin (%)", value: "60%", formula: "((Revenue - Salary) / Revenue) * 100", change: "+3", changeType: "increase" as const, previousValue: "57" },
    { name: "Client Acquisition Cost (CAC)", value: "$100", formula: "Marketing Costs / New Clients", change: "-10", changeType: "decrease" as const, previousValue: "$110" },
    { name: "Customer Lifetime Value (CLTV)", value: "$1,000", formula: "AOV × Repeat Purchase Rate × Avg. Lifespan", change: "+5", changeType: "increase" as const, previousValue: "$950" },
    { name: "Average Order Value (AOV)", value: "$100", formula: "Total Revenue / Number of Orders", change: "+12", changeType: "increase" as const, previousValue: "$88" },
];

const formatCurrency = (value: number) => `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function FinancialMetrics({ date }: { date: DateRange | undefined }) {
    const [showChart, setShowChart] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const previousPeriodLabel = useMemo(() => {
        if (!date?.from || !date?.to) return "previous period";
        const from = date.from;
        const to = date.to;
        const duration = differenceInDays(to, from);
        const prevTo = subDays(from, 1);
        const prevFrom = subDays(prevTo, duration);
        return `from ${format(prevFrom, 'MMM d')} - ${format(prevTo, 'MMM d, yyyy')}`;
    },[date]);

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {Array.from({length: 8}).map((_, i) => <Skeleton key={i} className="h-[180px] w-full" />)}
                </div>
            )
        }
        
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {otherFinancialMetrics.map((metric) => {
                    const isPositive = metric.changeType === "increase";
                    return (
                        <div key={metric.name} className="rounded-lg border bg-background/50 p-4 flex flex-col justify-between">
                            <div>
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium text-muted-foreground">{metric.name}</p>
                                    {metric.change && (
                                        <span className={cn("flex items-center gap-1 text-xs font-semibold", isPositive ? "text-green-600" : "text-red-600")}>
                                            {isPositive ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                                            {metric.change}%
                                        </span>
                                    )}
                                </div>
                                <p className="text-2xl font-bold mt-1">{metric.value}</p>
                            </div>
                            <div className="mt-2 pt-2 border-t space-y-1 text-xs">
                                {metric.change && metric.previousValue !== undefined && (
                                    <div className={cn("flex items-center gap-1 font-semibold", isPositive ? "text-green-600" : "text-red-600")}>
                                        {isPositive ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />} {metric.change}% 
                                        <p className="text-muted-foreground"> from {metric.previousValue} {previousPeriodLabel}</p>
                                    </div>
                                )}
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
