
"use client";

import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar, BarChart } from 'recharts';
import { ChartContainer, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

const chartData = [
  { month: "Jan", cpl: 35.0, romi: 320 },
  { month: "Feb", cpl: 32.5, romi: 380 },
  { month: "Mar", cpl: 30.0, romi: 400 },
  { month: "Apr", cpl: 28.5, romi: 425 },
  { month: "May", cpl: 27.0, romi: 440 },
  { month: "Jun", cpl: 25.5, romi: 450 },
];

const chartConfig = {
    cpl: { label: "Cost per Lead (CPL)", color: "hsl(var(--chart-1))" },
    romi: { label: "Marketing ROI (ROMI %)", color: "hsl(var(--chart-2))" },
} satisfies ChartConfig;

interface MarketingMetricsChartProps {
    activeMetrics: Record<string, boolean>;
    onMetricToggle: (metric: string) => void;
}

export default function MarketingMetricsChart({ activeMetrics, onMetricToggle }: MarketingMetricsChartProps) {
    return (
        <Card>
            <CardHeader>
                 <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <CardTitle>Marketing Metrics Trend</CardTitle>
                        <CardDescription>Monthly trends for key marketing metrics.</CardDescription>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                        {Object.keys(chartConfig).map((metric) => (
                            <div key={metric} className="flex items-center gap-2">
                                <Checkbox
                                    id={`marketing-metric-${metric}`}
                                    checked={activeMetrics[metric as keyof typeof activeMetrics]}
                                    onCheckedChange={() => onMetricToggle(metric as keyof typeof activeMetrics)}
                                    style={{
                                        '--chart-color': chartConfig[metric as keyof typeof chartConfig].color,
                                    } as React.CSSProperties}
                                    className="data-[state=checked]:bg-[var(--chart-color)] data-[state=checked]:border-[var(--chart-color)] border-muted-foreground"
                                />
                                <Label htmlFor={`marketing-metric-${metric}`} className="capitalize">
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
                            yAxisId="left"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            tickFormatter={(value) => `$${value}`}
                        />
                         <YAxis
                            yAxisId="right"
                            orientation="right"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            tickFormatter={(value) => `${value}%`}
                        />
                        <Tooltip
                            cursor={false}
                            content={<ChartTooltipContent
                                indicator="dot"
                                valueFormatter={(value, name) => typeof name === 'string' && name.includes('CPL') ? `$${(value as number).toFixed(2)}` : `${value}%`}
                            />}
                        />
                        {activeMetrics.cpl && <Line yAxisId="left" dataKey="cpl" type="monotone" stroke="var(--color-cpl)" strokeWidth={2} dot={true} />}
                        {activeMetrics.romi && <Line yAxisId="right" dataKey="romi" type="monotone" stroke="var(--color-romi)" strokeWidth={2} dot={true} />}
                    </LineChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}
