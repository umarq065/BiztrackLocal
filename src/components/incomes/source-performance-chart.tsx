
"use client";

import { format } from "date-fns";
import { Line, LineChart, Tooltip, XAxis, YAxis, CartesianGrid, Bar, BarChart } from "recharts";
import { ChartContainer, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";

interface SourcePerformanceChartProps {
    data: any[];
    config: ChartConfig;
    activeMetrics: Record<string, boolean>;
    showComparison: boolean;
    chartType: 'line' | 'bar';
}

export function SourcePerformanceChart({ data, config, activeMetrics, showComparison, chartType }: SourcePerformanceChartProps) {
    if (!data || data.length === 0) {
        return (
            <div className="flex h-[300px] w-full items-center justify-center rounded-lg border">
                <p className="text-muted-foreground">No data to display chart.</p>
            </div>
        );
    }
    return (
        <ChartContainer config={config} className="h-[300px] w-full">
           {chartType === 'line' ? (
                <LineChart accessibilityLayer data={data} margin={{ top: 20, right: 20, left: 10, bottom: 0 }}>
                    <CartesianGrid vertical={false} />
                    <XAxis
                        dataKey="date"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        tickFormatter={(value) => format(new Date(value.replace(/-/g, '/')), "MMM d")}
                    />
                    <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                    <Tooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                    {activeMetrics.impressions && <Line dataKey="impressions" type="natural" stroke="var(--color-impressions)" strokeWidth={2} dot={false} />}
                    {showComparison && activeMetrics.impressions && <Line dataKey="prevImpressions" type="natural" stroke="var(--color-impressions)" strokeWidth={2} dot={false} strokeDasharray="3 3"/>}
                    
                    {activeMetrics.clicks && <Line dataKey="clicks" type="natural" stroke="var(--color-clicks)" strokeWidth={2} dot={false} />}
                    {showComparison && activeMetrics.clicks && <Line dataKey="prevClicks" type="natural" stroke="var(--color-clicks)" strokeWidth={2} dot={false} strokeDasharray="3 3"/>}
                    
                    {activeMetrics.orders && <Line dataKey="orders" type="natural" stroke="var(--color-orders)" strokeWidth={2} dot={false} />}
                    {showComparison && activeMetrics.orders && <Line dataKey="prevOrders" type="natural" stroke="var(--color-orders)" strokeWidth={2} dot={false} strokeDasharray="3 3"/>}
                    
                    {activeMetrics.messages && <Line dataKey="messages" type="natural" stroke="var(--color-messages)" strokeWidth={2} dot={false} />}
                    {showComparison && activeMetrics.messages && <Line dataKey="prevMessages" type="natural" stroke="var(--color-messages)" strokeWidth={2} dot={false} strokeDasharray="3 3"/>}
                </LineChart>
            ) : (
                 <BarChart accessibilityLayer data={data} margin={{ top: 20, right: 20, left: 10, bottom: 0 }}>
                    <CartesianGrid vertical={false} />
                    <XAxis
                        dataKey="date"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        tickFormatter={(value) => format(new Date(value.replace(/-/g, '/')), "MMM d")}
                    />
                    <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                    <Tooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                    {activeMetrics.impressions && <Bar dataKey="impressions" fill="var(--color-impressions)" radius={4} />}
                    {showComparison && activeMetrics.impressions && <Bar dataKey="prevImpressions" fill="var(--color-impressions)" radius={4} fillOpacity={0.4} />}
                    
                    {activeMetrics.clicks && <Bar dataKey="clicks" fill="var(--color-clicks)" radius={4} />}
                    {showComparison && activeMetrics.clicks && <Bar dataKey="prevClicks" fill="var(--color-clicks)" radius={4} fillOpacity={0.4} />}
                    
                    {activeMetrics.orders && <Bar dataKey="orders" fill="var(--color-orders)" radius={4} />}
                    {showComparison && activeMetrics.orders && <Bar dataKey="prevOrders" fill="var(--color-orders)" radius={4} fillOpacity={0.4} />}
                    
                    {activeMetrics.messages && <Bar dataKey="messages" fill="var(--color-messages)" radius={4} />}
                    {showComparison && activeMetrics.messages && <Bar dataKey="prevMessages" fill="var(--color-messages)" radius={4} fillOpacity={0.4} />}
                </BarChart>
            )}
        </ChartContainer>
    );
}
