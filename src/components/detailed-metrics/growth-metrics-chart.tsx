
"use client";

import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

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
        label: "Revenue Growth",
        color: "hsl(var(--chart-1))",
    },
    profitGrowth: {
        label: "Profit Growth",
        color: "hsl(var(--chart-2))",
    },
    clientGrowth: {
        label: "Client Growth",
        color: "hsl(var(--chart-3))",
    },
} satisfies ChartConfig;

interface GrowthMetricsChartProps {
    activeMetrics: Record<string, boolean>;
    onMetricToggle: (metric: string) => void;
}

export default function GrowthMetricsChart({ activeMetrics, onMetricToggle }: GrowthMetricsChartProps) {
    return (
        <Card>
            <CardHeader>
                 <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <CardTitle>Growth Metrics Trend</CardTitle>
                        <CardDescription>Monthly growth trends for key metrics.</CardDescription>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                        {Object.keys(chartConfig).map((metric) => (
                            <div key={metric} className="flex items-center gap-2">
                                <Checkbox
                                    id={`growth-metric-${metric}`}
                                    checked={activeMetrics[metric as keyof typeof activeMetrics]}
                                    onCheckedChange={() => onMetricToggle(metric as keyof typeof activeMetrics)}
                                    style={{
                                        '--chart-color': chartConfig[metric as keyof typeof chartConfig].color,
                                    } as React.CSSProperties}
                                    className="data-[state=checked]:bg-[var(--chart-color)] data-[state=checked]:border-[var(--chart-color)] border-muted-foreground"
                                />
                                <Label htmlFor={`growth-metric-${metric}`} className="capitalize">
                                    {chartConfig[metric as keyof typeof chartConfig].label}
                                </Label>
                            </div>
                        ))}
                    </div>
                </div>
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
                        {activeMetrics.revenueGrowth && <Line dataKey="revenueGrowth" type="monotone" stroke="var(--color-revenueGrowth)" strokeWidth={2} dot={true} />}
                        {activeMetrics.profitGrowth && <Line dataKey="profitGrowth" type="monotone" stroke="var(--color-profitGrowth)" strokeWidth={2} dot={true} />}
                        {activeMetrics.clientGrowth && <Line dataKey="clientGrowth" type="monotone" stroke="var(--color-clientGrowth)" strokeWidth={2} dot={true} />}
                    </LineChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}
