
"use client";

import { useMemo } from 'react';
import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig
} from "@/components/ui/chart";
import { MonthlyFinancials } from '@/lib/data/yearly-stats-data';

interface MonthlyRevenueVsTargetChartProps {
    monthlyFinancials: MonthlyFinancials[];
    monthlyTargetRevenue: number[];
}

const chartConfig = {
  revenue: { label: "Actual Revenue", color: "hsl(var(--chart-1))" },
  target: { label: "Target Revenue", color: "hsl(var(--chart-5))" },
} satisfies ChartConfig;

export default function MonthlyRevenueVsTargetChart({ monthlyFinancials, monthlyTargetRevenue }: MonthlyRevenueVsTargetChartProps) {

    const chartData = useMemo(() => {
        return monthlyFinancials.map((data, index) => ({
            month: data.month,
            revenue: data.revenue,
            target: monthlyTargetRevenue[index],
        }));
    }, [monthlyFinancials, monthlyTargetRevenue]);

    return (
        <ChartContainer config={chartConfig} className="h-[400px] w-full">
            <LineChart data={chartData} margin={{ top: 20, right: 20, left: 10, bottom: 20 }}>
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
                <Line
                    dataKey="revenue"
                    type="monotone"
                    stroke="var(--color-revenue)"
                    strokeWidth={2}
                    dot={true}
                />
                <Line
                    dataKey="target"
                    type="monotone"
                    stroke="var(--color-target)"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                />
            </LineChart>
        </ChartContainer>
    );
}

