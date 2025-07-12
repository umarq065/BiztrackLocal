
"use client";

import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartConfig } from "@/components/ui/chart";
import { CompetitorYearlyData } from '@/lib/data/yearly-stats-data';

interface MyOrdersVsCompetitorAvgChartProps {
    myOrders: number;
    competitors: CompetitorYearlyData[];
}

const chartConfig = {
  myOrders: { label: "My Orders", color: "hsl(var(--chart-1))" },
  competitorAvg: { label: "Competitor Avg.", color: "hsl(var(--chart-2))" },
} satisfies ChartConfig;

export default function MyOrdersVsCompetitorAvgChart({ myOrders, competitors }: MyOrdersVsCompetitorAvgChartProps) {
    const chartData = useMemo(() => {
        const competitorAvg = competitors.reduce((acc, curr) => acc + curr.totalOrders, 0) / competitors.length;
        return [
            { name: "My Orders", value: myOrders, fill: "var(--color-myOrders)" },
            { name: "Competitor Avg.", value: Math.round(competitorAvg), fill: "var(--color-competitorAvg)" },
        ];
    }, [myOrders, competitors]);

    return (
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <BarChart
                data={chartData}
                layout="vertical"
                margin={{ left: 10, right: 50 }}
            >
                <CartesianGrid horizontal={false} />
                <YAxis
                    dataKey="name"
                    type="category"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                    width={100}
                    className="font-medium"
                />
                <XAxis dataKey="value" type="number" hide />
                <Bar dataKey="value" radius={5}>
                    <LabelList
                        dataKey="value"
                        position="right"
                        offset={8}
                        className="fill-foreground font-semibold"
                        fontSize={14}
                    />
                </Bar>
            </BarChart>
        </ChartContainer>
    );
}
