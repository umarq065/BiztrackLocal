
"use client";

import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { type YearlyStatsData } from '@/lib/data/yearly-stats-data';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';

interface YearlySummaryTableProps {
    allYearlyData: YearlyStatsData;
    selectedYear: number;
}

type SortKey = keyof ReturnType<typeof useMemo<any[], any>>[0];

const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const formatCurrency = (value: number) => {
    return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function YearlySummaryTable({ allYearlyData, selectedYear }: YearlySummaryTableProps) {
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'ascending' | 'descending' }>({
        key: 'index',
        direction: 'ascending',
    });

    const tableData = useMemo(() => {
        const yearData = allYearlyData[selectedYear];
        if (!yearData) return [];

        const data = months.map((month, index) => {
            const financials = yearData.monthlyFinancials[index];
            const myOrders = yearData.monthlyOrders[index];
            const competitorAvgOrders = yearData.competitors.length > 0 
                ? yearData.competitors.reduce((sum, comp) => sum + comp.monthlyOrders[index], 0) / yearData.competitors.length
                : 0;
            
            const prevMonthRevenue = index > 0 ? yearData.monthlyFinancials[index - 1].revenue : 0;
            let perfChange: { value: number; type: 'increase' | 'decrease' } | null = null;

            if (prevMonthRevenue > 0) {
                const change = ((financials.revenue - prevMonthRevenue) / prevMonthRevenue) * 100;
                perfChange = { value: change, type: change >= 0 ? 'increase' : 'decrease' };
            }

            return {
                month,
                index,
                totalIncome: financials.revenue,
                orders: myOrders,
                avgCompOrders: competitorAvgOrders,
                expenses: financials.expenses,
                netProfit: financials.profit,
                perfVsPrevMonth: perfChange,
            };
        });

        if (sortConfig.key) {
            data.sort((a, b) => {
                const aVal = a[sortConfig.key as keyof typeof a];
                const bVal = b[sortConfig.key as keyof typeof b];
                
                if (typeof aVal === 'number' && typeof bVal === 'number') {
                     if (aVal < bVal) return sortConfig.direction === 'ascending' ? -1 : 1;
                     if (aVal > bVal) return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                
                // Fallback for non-numeric or equal values
                return 0;
            });
        }
        
        return data;

    }, [selectedYear, allYearlyData, sortConfig]);

    const requestSort = (key: SortKey) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const getSortIndicator = (key: SortKey) => {
        if (sortConfig.key !== key) return null;
        return sortConfig.direction === 'ascending' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />;
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Yearly Summary for {selectedYear}</CardTitle>
                    <CardDescription>A monthly breakdown of key performance indicators.</CardDescription>
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>
                                <Button variant="ghost" onClick={() => requestSort('index')} className="-ml-4">
                                    Month {getSortIndicator('index')}
                                </Button>
                            </TableHead>
                             <TableHead>
                                <Button variant="ghost" onClick={() => requestSort('totalIncome')} className="-ml-4">
                                    Total Income {getSortIndicator('totalIncome')}
                                </Button>
                            </TableHead>
                            <TableHead>
                                <Button variant="ghost" onClick={() => requestSort('orders')} className="-ml-4">
                                    Orders {getSortIndicator('orders')}
                                </Button>
                            </TableHead>
                            <TableHead>
                                <Button variant="ghost" onClick={() => requestSort('avgCompOrders')} className="-ml-4">
                                    Avg. Comp. Orders {getSortIndicator('avgCompOrders')}
                                </Button>
                            </TableHead>
                            <TableHead>
                                <Button variant="ghost" onClick={() => requestSort('expenses')} className="-ml-4">
                                    Expenses {getSortIndicator('expenses')}
                                </Button>
                            </TableHead>
                            <TableHead>
                                <Button variant="ghost" onClick={() => requestSort('netProfit')} className="-ml-4">
                                    Net Profit {getSortIndicator('netProfit')}
                                </Button>
                            </TableHead>
                            <TableHead>Perf. vs Prev. Month</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {tableData.map(row => (
                            <TableRow key={row.month}>
                                <TableCell className="font-medium">{row.month}</TableCell>
                                <TableCell>{formatCurrency(row.totalIncome)}</TableCell>
                                <TableCell>{row.orders}</TableCell>
                                <TableCell>{row.avgCompOrders.toFixed(1)}</TableCell>
                                <TableCell>{formatCurrency(row.expenses)}</TableCell>
                                <TableCell className={cn("font-medium", row.netProfit > 0 ? "text-green-600" : "text-red-600")}>
                                    {formatCurrency(row.netProfit)}
                                </TableCell>
                                <TableCell>
                                    {row.perfVsPrevMonth ? (
                                        <span className={cn(
                                            "flex items-center gap-1 font-semibold",
                                            row.perfVsPrevMonth.type === "increase" ? "text-green-600" : "text-red-600"
                                        )}>
                                            {row.perfVsPrevMonth.type === "increase" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                                            {row.perfVsPrevMonth.value.toFixed(1)}%
                                        </span>
                                    ) : (
                                        <span className="text-muted-foreground">N/A</span>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
