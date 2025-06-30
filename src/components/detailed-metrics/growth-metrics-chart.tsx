
"use client";

import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, type ChartConfig } from "@/components/ui/chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const chartData = [
  { month: "Jan", revenueGrowth: 2.1, profitGrowth: 1.5, clientGrowth: 5 },
  { month: "Feb", revenueGrowth: 2.5, profitGrowth: 2.0, clientGrowth: 7 },
  { month: "Mar", revenueGrowth: 1.8, profitGrowth: 1.2, clientGrowth: 4 },
  { month: "Apr", revenueGrowth: 3.0, profitGrowth: 2.5, clientGrowth: 10 },
  { month: "May", revenueGrowth: 2.8, profitGrowth: 2.2, clientGrowth: 8 },
  { month: "Jun", revenueGrowth: 3.5, profitGrowth: 3.0, clientGrowth: 12 },
];

const chartConfig = {
    revenueGrowth: {
        label: "Revenue Growth (%)",
        color: "hsl(var(--chart-1))",
    },
    profitGrowth: {
        label: "Profit Growth (%)",
        color: "hsl(var(--chart-2))",
    },
    clientGrowth: {
        label: "Client Growth (%)",
        color: "hsl(var(--chart-3))",
    },
} satisfies ChartConfig;

export default function GrowthMetricsChart() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Growth Metrics Trend</CardTitle>
                <CardDescription>Monthly growth trends for key metrics.</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                    <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
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
                            tickFormatter={(value) => `${value}%`}
                        />
                        <Tooltip
                            cursor={false}
                            content={<ChartTooltipContent
                                indicator="dot"
                                valueFormatter={(value) => `${value.toFixed(1)}%`}
                            />}
                        />
                         <ChartLegend content={<ChartLegendContent />} />
                        <Line dataKey="revenueGrowth" type="monotone" stroke="var(--color-revenueGrowth)" strokeWidth={2} dot={true} />
                        <Line dataKey="profitGrowth" type="monotone" stroke="var(--color-profitGrowth)" strokeWidth={2} dot={true} />
                        <Line dataKey="clientGrowth" type="monotone" stroke="var(--color-clientGrowth)" strokeWidth={2} dot={true} />
                    </LineChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}
