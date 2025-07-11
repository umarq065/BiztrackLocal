"use client";

import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import { ChartContainer, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

const chartData = [
  { month: "Jan", leadConversionRate: 15.2, winRate: 60 },
  { month: "Feb", leadConversionRate: 16.5, winRate: 62 },
  { month: "Mar", leadConversionRate: 14.8, winRate: 58 },
  { month: "Apr", leadConversionRate: 17.5, winRate: 68 },
  { month: "May", leadConversionRate: 18.0, winRate: 66 },
  { month: "Jun", leadConversionRate: 18.5, winRate: 65 },
];

const chartConfig = {
    leadConversionRate: { label: "Lead Conversion Rate", color: "hsl(var(--chart-1))" },
    winRate: { label: "Win Rate", color: "hsl(var(--chart-2))" },
} satisfies ChartConfig;

interface SalesMetricsChartProps {
    activeMetrics: Record<string, boolean>;
    onMetricToggle: (metric: string) => void;
}

export default function SalesMetricsChart({ activeMetrics, onMetricToggle }: SalesMetricsChartProps) {
    return (
        <Card>
            <CardHeader>
                 <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <CardTitle>Sales & Conversion Trend</CardTitle>
                        <CardDescription>Monthly trends for key sales metrics.</CardDescription>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                        {Object.keys(chartConfig).map((metric) => (
                            <div key={metric} className="flex items-center gap-2">
                                <Checkbox
                                    id={`sales-metric-${metric}`}
                                    checked={activeMetrics[metric as keyof typeof activeMetrics]}
                                    onCheckedChange={() => onMetricToggle(metric as keyof typeof activeMetrics)}
                                    style={{
                                        '--chart-color': chartConfig[metric as keyof typeof chartConfig].color,
                                    } as React.CSSProperties}
                                    className="data-[state=checked]:bg-[var(--chart-color)] data-[state=checked]:border-[var(--chart-color)] border-muted-foreground"
                                />
                                <Label htmlFor={`sales-metric-${metric}`} className="capitalize">
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
                        {activeMetrics.leadConversionRate && <Line dataKey="leadConversionRate" type="monotone" stroke="var(--color-leadConversionRate)" strokeWidth={2} dot={true} />}
                        {activeMetrics.winRate && <Line dataKey="winRate" type="monotone" stroke="var(--color-winRate)" strokeWidth={2} dot={true} />}
                    </LineChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}
