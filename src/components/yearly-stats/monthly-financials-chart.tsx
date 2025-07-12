
"use client";

import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
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
                <ChartLegend content={<ChartLegendContent />} />
                <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} />
                <Bar dataKey="expenses" fill="var(--color-expenses)" radius={4} />
                <Bar dataKey="profit" fill="var(--color-profit)" radius={4} />
            </BarChart>
        </ChartContainer>
    );
}
