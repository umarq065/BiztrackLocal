"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from "@/components/ui/chart";
import { type TopClient } from "@/lib/placeholder-data";

interface TopClientsChartProps {
    data: TopClient[];
    totalRevenue: number;
}

const chartConfig = {
    amount: {
        label: "Amount",
        color: "hsl(var(--chart-1))",
    },
} satisfies ChartConfig;

export default function TopClientsChart({ data, totalRevenue }: TopClientsChartProps) {
    const formatter = (value: number) => {
        const percentage = totalRevenue > 0 ? ((value / totalRevenue) * 100).toFixed(1) : 0;
        return `$${value.toLocaleString()} (${percentage}%)`;
    };

    return (
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <BarChart
                data={data}
                layout="vertical"
                margin={{ top: 5, right: 100, left: 20, bottom: 5 }}
                accessibilityLayer
            >
                <CartesianGrid horizontal={false} />
                <YAxis
                    dataKey="name"
                    type="category"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                    className="text-sm"
                    width={80}
                />
                <XAxis dataKey="amount" type="number" hide />
                <Tooltip
                    cursor={{ fill: 'hsl(var(--muted))' }}
                    content={<ChartTooltipContent indicator="dot" />}
                />
                <Bar dataKey="amount" fill="var(--color-amount)" radius={4}>
                    <LabelList
                        dataKey="amount"
                        position="right"
                        offset={8}
                        className="fill-foreground"
                        formatter={formatter}
                    />
                </Bar>
            </BarChart>
        </ChartContainer>
    );
}
