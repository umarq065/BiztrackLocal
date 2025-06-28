
"use client";

import StatCard from "@/components/dashboard/stat-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowDown, ArrowUp } from "lucide-react";

interface ExpensesKpiCardsProps {
    totalExpenses: number;
    totalExpensesChange: { value: string; type: "increase" | "decrease" } | null;
    avgDailyBurn: number;
    avgDailyBurnChange: { value: string; type: "increase" | "decrease" } | null;
    previousPeriodDescription: string;
    topSpendingCategory: { name: string; amount: number };
    largestSingleExpense: { type: string; amount: number };
    momExpenseGrowth: { value: string; type: "increase" | "decrease" } | null;
    totalRecurringCost: number;
    fixedCostRatio: { value: string };
}

export function ExpensesKpiCards({
    totalExpenses,
    totalExpensesChange,
    avgDailyBurn,
    avgDailyBurnChange,
    previousPeriodDescription,
    topSpendingCategory,
    largestSingleExpense,
    momExpenseGrowth,
    totalRecurringCost,
    fixedCostRatio,
}: ExpensesKpiCardsProps) {
    return (
        <>
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Total Expenses</CardTitle>
                        <CardDescription>Total for the selected period.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-4xl font-bold">${totalExpenses.toFixed(2)}</p>
                        {totalExpensesChange && (
                            <div className="text-xs text-muted-foreground mt-1 flex items-center">
                                <span className={cn(
                                    "flex items-center gap-1 font-medium",
                                    totalExpensesChange.type === 'increase' ? 'text-red-600' : 'text-green-600'
                                )}>
                                    {totalExpensesChange.type === 'increase' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                                    {totalExpensesChange.value}%
                                </span>
                                <span className="ml-1">{previousPeriodDescription}</span>
                            </div>
                        )}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Avg. Daily Burn</CardTitle>
                        <CardDescription>Average daily cost to run the business.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-4xl font-bold">${avgDailyBurn.toFixed(2)}</p>
                        {avgDailyBurnChange && (
                            <div className="text-xs text-muted-foreground mt-1 flex items-center">
                                <span className={cn(
                                    "flex items-center gap-1 font-medium",
                                    avgDailyBurnChange.type === 'increase' ? 'text-red-600' : 'text-green-600'
                                )}>
                                    {avgDailyBurnChange.type === 'increase' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                                    {avgDailyBurnChange.value}%
                                </span>
                                <span className="ml-1">{previousPeriodDescription}</span>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <h2 className="text-xl font-semibold mb-[-8px] mt-4">Expense Analysis</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <StatCard
                    icon="BarChart"
                    title="Top Spending Category"
                    value={topSpendingCategory.name}
                    description={`$${topSpendingCategory.amount.toFixed(2)} of total`}
                />
                 <StatCard
                    icon="CreditCard"
                    title="Largest Single Expense"
                    value={`$${largestSingleExpense.amount.toFixed(2)}`}
                    description={`(${largestSingleExpense.type})`}
                />
                <StatCard
                    icon="TrendingUp"
                    title="Period-over-Period Growth"
                    value={momExpenseGrowth ? (
                        <div className={cn("flex items-center", momExpenseGrowth.type === 'increase' ? 'text-red-600' : 'text-green-600')}>
                            {momExpenseGrowth.type === 'increase' ? <ArrowUp className="h-6 w-6 mr-1" /> : <ArrowDown className="h-6 w-6 mr-1" />}
                            <span>{momExpenseGrowth.value}%</span>
                        </div>
                    ) : 'N/A'}
                    description={previousPeriodDescription}
                    invertChangeColor
                />
                <StatCard
                    icon="Repeat"
                    title="Total Recurring Costs"
                    value={`$${totalRecurringCost.toFixed(2)} / month`}
                    description="Based on current month's recurring expenses"
                />
                <StatCard
                    icon="Percent"
                    title="Fixed Cost Ratio"
                    value={fixedCostRatio.value}
                    description="of total spending in period is recurring"
                />
            </div>
        </>
    );
}
