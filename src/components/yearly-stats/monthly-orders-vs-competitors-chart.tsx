
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
import { CompetitorYearlyData } from '@/lib/data/yearly-stats-data';

interface MonthlyOrdersVsCompetitorsChartProps {
    myOrders: number[];
    competitors: CompetitorYearlyData[];
}

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const chartColors = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export default function MonthlyOrdersVsCompetitorsChart({ myOrders, competitors }: MonthlyOrdersVsCompetitorsChartProps) {
    const { chartData, chartConfig } = useMemo(() => {
        const data = months.map((month, index) => {
            const entry: { month: string; [key: string]: string | number } = { month };
            entry['My Orders'] = myOrders[index];
            competitors.forEach(c => {
                entry[c.name] = c.monthlyOrders[index];
            });
            return entry;
        });

        const config: ChartConfig = {
            'My Orders': { label: 'My Orders', color: chartColors[0] },
        };
        competitors.forEach((c, i) => {
            config[c.name] = {
                label: c.name,
                color: chartColors[(i + 1) % chartColors.length]
            };
        });

        return { chartData: data, chartConfig: config };
    }, [myOrders, competitors]);

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
                />
                <Tooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="dot" />}
                />
                <ChartLegend content={<ChartLegendContent />} />
                <Line
                    dataKey="My Orders"
                    type="monotone"
                    strokeWidth={2}
                    stroke={`var(--color-My Orders)`}
                    dot={true}
                />
                {competitors.map(c => (
                    <Line
                        key={c.id}
                        dataKey={c.name}
                        type="monotone"
                        strokeWidth={2}
                        stroke={`var(--color-${c.name})`}
                        dot={false}
                        strokeDasharray="3 3"
                    />
                ))}
            </LineChart>
        </ChartContainer>
    );
}
