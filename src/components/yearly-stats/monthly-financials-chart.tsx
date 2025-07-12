
"use client";

import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import {
  ChartContainer,
  ChartTooltipContent,
  ChartLegend,
  type ChartConfig
} from "@/components/ui/chart";
import { MonthlyFinancials } from '@/lib/data/yearly-stats-data';

interface MonthlyFinancialsChartProps {
    data: MonthlyFinancials[];
}

const chartConfig = {
  revenue: { label: "Revenue", color: "hsl(var(--chart-1))" },
  expenses: { label: "Expenses", color: "hsl(var(--chart-2))" },
  profit: { label: "Profit", color: "hsl(var(--chart-3))" },
} satisfies ChartConfig;

export default function MonthlyFinancialsChart({ data }: MonthlyFinancialsChartProps) {
    const { totalRevenue, avgRevenue, totalExpenses, avgExpenses, totalProfit, avgProfit } = useMemo(() => {
        const totalRev = data.reduce((acc, curr) => acc + curr.revenue, 0);
        const avgRev = data.length > 0 ? totalRev / data.length : 0;
        
        const totalExp = data.reduce((acc, curr) => acc + curr.expenses, 0);
        const avgExp = data.length > 0 ? totalExp / data.length : 0;

        const totalProf = data.reduce((acc, curr) => acc + curr.profit, 0);
        const avgProf = data.length > 0 ? totalProf / data.length : 0;
        
        return {
            totalRevenue: totalRev,
            avgRevenue: avgRev,
            totalExpenses: totalExp,
            avgExpenses: avgExp,
            totalProfit: totalProf,
            avgProfit: avgProf,
        };
    }, [data]);

    const CustomLegend = (props: any) => {
      const { payload } = props;
      const formatCurrency = (value: number) => `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
      
      const statsMap = {
          revenue: { total: totalRevenue, avg: avgRevenue },
          expenses: { total: totalExpenses, avg: avgExpenses },
          profit: { total: totalProfit, avg: avgProfit },
      }

      return (
        <div className="flex justify-center gap-6 pt-4 flex-wrap">
          {payload.map((entry: any, index: number) => {
            const key = entry.value as keyof typeof statsMap;
            const stats = statsMap[key];

            return (
                <div key={`item-${index}`} className="flex items-center space-x-2 text-sm">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="text-muted-foreground">{entry.payload.label}:</span>
                  <span className="font-semibold">{formatCurrency(stats.total)} (Total)</span>
                  <span className="font-semibold text-muted-foreground/80">/</span>
                  <span className="font-semibold">{formatCurrency(stats.avg)} (Avg)</span>
                </div>
            );
          })}
        </div>
      );
    }
    
    return (
        <ChartContainer config={chartConfig} className="h-[400px] w-full">
            <BarChart data={data} margin={{ top: 20, right: 20, left: 10, bottom: 20 }}>
                <CartesianGrid vertical={false} />
                <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                />
                <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => `$${value / 1000}k`}
                />
                <Tooltip
                    cursor={false}
                    content={<ChartTooltipContent
                        indicator="dot"
                        valueFormatter={(value) => `$${Number(value).toLocaleString()}`}
                    />}
                />
                <ChartLegend content={<CustomLegend />} />
                <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} />
                <Bar dataKey="expenses" fill="var(--color-expenses)" radius={4} />
                <Bar dataKey="profit" fill="var(--color-profit)" radius={4} />
            </BarChart>
        </ChartContainer>
    );
}
