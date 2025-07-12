
"use client";

import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import { ChartContainer, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

const chartData = [
  { month: "Jan", revisions: 2.2, completionRate: 95 },
  { month: "Feb", revisions: 2.0, completionRate: 97 },
  { month: "Mar", revisions: 1.9, completionRate: 98 },
  { month: "Apr", revisions: 1.7, completionRate: 99 },
  { month: "May", revisions: 1.6, completionRate: 97 },
  { month: "Jun", revisions: 1.8, completionRate: 96 },
];

const chartConfig = {
    revisions: { label: "Revisions per Project", color: "hsl(var(--chart-1))" },
    completionRate: { label: "Order Completion Rate (%)", color: "hsl(var(--chart-2))" },
} satisfies ChartConfig;

interface ProjectMetricsChartProps {
    activeMetrics: Record<string, boolean>;
    onMetricToggle: (metric: string) => void;
}

export default function ProjectMetricsChart({ activeMetrics, onMetricToggle }: ProjectMetricsChartProps) {
    return (
        <Card>
            <CardHeader>
                 <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <CardTitle>Project & Delivery Trend</CardTitle>
                        <CardDescription>Monthly trends for key project metrics.</CardDescription>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                        {Object.keys(chartConfig).map((metric) => (
                            <div key={metric} className="flex items-center gap-2">
                                <Checkbox
                                    id={`project-metric-${metric}`}
                                    checked={activeMetrics[metric as keyof typeof activeMetrics]}
                                    onCheckedChange={() => onMetricToggle(metric as keyof typeof activeMetrics)}
                                    style={{
                                        '--chart-color': chartConfig[metric as keyof typeof chartConfig].color,
                                    } as React.CSSProperties}
                                    className="data-[state=checked]:bg-[var(--chart-color)] data-[state=checked]:border-[var(--chart-color)] border-muted-foreground"
                                />
                                <Label htmlFor={`project-metric-${metric}`} className="capitalize">
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
                                valueFormatter={(value, name) => typeof name === 'string' && name.includes('Rate') ? `${value}%` : (value as number).toFixed(1)}
                            />}
                        />
                        {activeMetrics.revisions && <Line yAxisId="left" dataKey="revisions" type="monotone" stroke="var(--color-revisions)" strokeWidth={2} dot={true} />}
                        {activeMetrics.completionRate && <Line yAxisId="right" dataKey="completionRate" type="monotone" stroke="var(--color-completionRate)" strokeWidth={2} dot={true} />}
                    </LineChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}
