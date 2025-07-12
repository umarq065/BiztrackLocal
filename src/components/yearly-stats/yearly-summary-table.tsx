
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { type YearlyStatsData } from '@/lib/data/yearly-stats-data';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';

interface YearlySummaryTableProps {
    allYearlyData: YearlyStatsData;
}

const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const formatCurrency = (value: number) => {
    return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function YearlySummaryTable({ allYearlyData }: YearlySummaryTableProps) {
    const availableYears = useMemo(() => Object.keys(allYearlyData).map(Number).sort((a,b) => b-a), [allYearlyData]);
    const [selectedYear, setSelectedYear] = useState(availableYears[0]);
    const [sortAsc, setSortAsc] = useState(true);

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

        return data.sort((a, b) => sortAsc ? a.index - b.index : b.index - a.index);

    }, [selectedYear, allYearlyData, sortAsc]);

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Yearly Summary</CardTitle>
                    <CardDescription>A monthly breakdown of key performance indicators for the selected year.</CardDescription>
                </div>
                 <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
                    <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        {availableYears.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                    </SelectContent>
                </Select>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>
                                <Button variant="ghost" onClick={() => setSortAsc(!sortAsc)} className="-ml-4">
                                    Month {sortAsc ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />}
                                </Button>
                            </TableHead>
                            <TableHead>Total Income</TableHead>
                            <TableHead>Orders</TableHead>
                            <TableHead>Avg. Comp. Orders</TableHead>
                            <TableHead>Expenses</TableHead>
                            <TableHead>Net Profit</TableHead>
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
