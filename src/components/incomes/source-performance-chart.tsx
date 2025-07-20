
"use client";

import { useMemo } from "react";
import { format, parseISO, startOfWeek, startOfMonth, getQuarter, getYear, startOfYear } from "date-fns";
import { Line, LineChart, Tooltip, XAxis, YAxis, CartesianGrid, Bar, BarChart } from "recharts";
import { ChartContainer, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";

interface ChartDataPoint {
    date: string;
    impressions?: number;
    clicks?: number;
    orders?: number;
    messages?: number;
    prevImpressions?: number;
    prevClicks?: number;
    prevOrders?: number;
    prevMessages?: number;
}

interface SourcePerformanceChartProps {
    data: ChartDataPoint[];
    config: ChartConfig;
    activeMetrics: Record<string, boolean>;
    showComparison: boolean;
    chartType: 'line' | 'bar';
    chartView: string;
}

export function SourcePerformanceChart({ data, config, activeMetrics, showComparison, chartType, chartView }: SourcePerformanceChartProps) {
    
    const aggregatedData = useMemo(() => {
        if (!data || data.length === 0) return [];
        
        const dataMap = new Map<string, ChartDataPoint>();
        
        data.forEach(item => {
            const itemDate = parseISO(item.date);
            let key = '';

            switch(chartView) {
                case 'weekly': key = format(startOfWeek(itemDate, { weekStartsOn: 1 }), 'yyyy-MM-dd'); break;
                case 'monthly': key = format(startOfMonth(itemDate), 'yyyy-MM-dd'); break;
                case 'quarterly': key = `${getYear(itemDate)}-Q${getQuarter(itemDate)}`; break;
                case 'yearly': key = format(startOfYear(itemDate), 'yyyy'); break;
                default: key = item.date; break;
            }

            const existing = dataMap.get(key) || { date: key };
            dataMap.set(key, {
                ...existing,
                impressions: (existing.impressions || 0) + (item.impressions || 0),
                clicks: (existing.clicks || 0) + (item.clicks || 0),
                orders: (existing.orders || 0) + (item.orders || 0),
                messages: (existing.messages || 0) + (item.messages || 0),
                prevImpressions: (existing.prevImpressions || 0) + (item.prevImpressions || 0),
                prevClicks: (existing.prevClicks || 0) + (item.prevClicks || 0),
                prevOrders: (existing.prevOrders || 0) + (item.prevOrders || 0),
                prevMessages: (existing.prevMessages || 0) + (item.prevMessages || 0),
            });
        });
        
        return Array.from(dataMap.values()).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    }, [data, chartView]);

    const tickFormatter = (value: string) => {
        try {
            switch (chartView) {
                case 'weekly': return `W/C ${format(parseISO(value), "MMM d")}`;
                case 'monthly': return format(parseISO(value), "MMM yyyy");
                case 'quarterly': return value;
                case 'yearly': return value;
                default: return format(parseISO(value), "MMM d");
            }
        } catch (e) {
            return value;
        }
    };

    if (!aggregatedData || aggregatedData.length === 0) {
        return (
            <div className="flex h-[300px] w-full items-center justify-center rounded-lg border">
                <p className="text-muted-foreground">No data to display chart for the selected period.</p>
            </div>
        );
    }
    
    return (
        <ChartContainer config={config} className="h-[300px] w-full">
           {chartType === 'line' ? (
                <LineChart accessibilityLayer data={aggregatedData} margin={{ top: 20, right: 20, left: 10, bottom: 0 }}>
                    <CartesianGrid vertical={false} />
                    <XAxis
                        dataKey="date"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        tickFormatter={tickFormatter}
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
                 <BarChart accessibilityLayer data={aggregatedData} margin={{ top: 20, right: 20, left: 10, bottom: 0 }}>
                    <CartesianGrid vertical={false} />
                    <XAxis
                        dataKey="date"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        tickFormatter={tickFormatter}
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
