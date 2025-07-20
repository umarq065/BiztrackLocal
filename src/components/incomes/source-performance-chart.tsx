
"use client";

import { useMemo } from "react";
import { format, parseISO, startOfWeek, startOfMonth, getQuarter, getYear, startOfYear } from "date-fns";
import { Line, LineChart, Tooltip, XAxis, YAxis, CartesianGrid, Bar, BarChart, Area, AreaChart } from "recharts";
import { ChartContainer, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";

interface ChartDataPoint {
    date: string;
    impressions?: number;
    clicks?: number;
    orders?: number;
    messages?: number;
    revenue?: number;
    ctr?: number;
    prevImpressions?: number;
    prevClicks?: number;
    prevOrders?: number;
    prevMessages?: number;
    prevRevenue?: number;
    prevCtr?: number;
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
            
            const impressions = (existing.impressions || 0) + (item.impressions || 0);
            const clicks = (existing.clicks || 0) + (item.clicks || 0);
            const prevImpressions = (existing.prevImpressions || 0) + (item.prevImpressions || 0);
            const prevClicks = (existing.prevClicks || 0) + (item.prevClicks || 0);
            
            dataMap.set(key, {
                ...existing,
                impressions,
                clicks,
                orders: (existing.orders || 0) + (item.orders || 0),
                messages: (existing.messages || 0) + (item.messages || 0),
                revenue: (existing.revenue || 0) + (item.revenue || 0),
                ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
                prevImpressions,
                prevClicks,
                prevOrders: (existing.prevOrders || 0) + (item.prevOrders || 0),
                prevMessages: (existing.prevMessages || 0) + (item.prevMessages || 0),
                prevRevenue: (existing.prevRevenue || 0) + (item.prevRevenue || 0),
                prevCtr: prevImpressions > 0 ? (prevClicks / prevImpressions) * 100 : 0,
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
    
    const yAxisIds = {
        revenue: 'left',
        impressions: 'right',
        clicks: 'right',
        orders: 'right',
        messages: 'right',
        ctr: 'percentage',
    };

    const valueFormatter = (value: number, name: string) => {
        if (name.toLowerCase().includes('revenue')) {
            return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
        if (name.toLowerCase().includes('ctr')) {
            return `${value.toFixed(2)}%`;
        }
        return value.toLocaleString();
    };
    
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
                    <YAxis yAxisId="left" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => `$${value/1000}k`} />
                    <YAxis yAxisId="right" orientation="right" tickLine={false} axisLine={false} tickMargin={8} />
                    <YAxis yAxisId="percentage" orientation="right" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => `${value}%`} className="translate-x-6" />

                    <Tooltip 
                        cursor={false} 
                        content={<ChartTooltipContent 
                            indicator="dot" 
                            formatter={(value, name) => [valueFormatter(value, name as string), config[name as string]?.label]}
                        />} 
                    />
                    {Object.keys(activeMetrics).filter(k => activeMetrics[k]).map(key => {
                        const yAxisId = yAxisIds[key as keyof typeof yAxisIds];
                        return (
                          <Line key={key} yAxisId={yAxisId} dataKey={key} type="natural" stroke={`var(--color-${key})`} strokeWidth={2} dot={false} />
                        );
                    })}
                     {showComparison && Object.keys(activeMetrics).filter(k => activeMetrics[k]).map(key => {
                        const yAxisId = yAxisIds[key as keyof typeof yAxisIds];
                        const prevKey = `prev${key.charAt(0).toUpperCase() + key.slice(1)}`;
                        return (
                           <Line key={prevKey} yAxisId={yAxisId} dataKey={prevKey} type="natural" stroke={`var(--color-${key})`} strokeWidth={2} dot={false} strokeDasharray="3 3"/>
                        )
                    })}
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
                    <YAxis yAxisId="left" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => `$${value/1000}k`} />
                    <YAxis yAxisId="right" orientation="right" tickLine={false} axisLine={false} tickMargin={8} />
                     <YAxis yAxisId="percentage" orientation="right" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => `${value}%`} className="translate-x-6" />
                    <Tooltip cursor={false} content={<ChartTooltipContent indicator="dot" formatter={(value, name) => [valueFormatter(value, name as string), config[name as string]?.label]} />} />
                    
                    {Object.keys(activeMetrics).filter(k => activeMetrics[k]).map(key => {
                        const yAxisId = yAxisIds[key as keyof typeof yAxisIds];
                        return (
                            <Bar key={key} yAxisId={yAxisId} dataKey={key} fill={`var(--color-${key})`} radius={4} />
                        )
                    })}
                    {showComparison && Object.keys(activeMetrics).filter(k => activeMetrics[k]).map(key => {
                        const yAxisId = yAxisIds[key as keyof typeof yAxisIds];
                        const prevKey = `prev${key.charAt(0).toUpperCase() + key.slice(1)}`;
                        return (
                            <Bar key={prevKey} yAxisId={yAxisId} dataKey={prevKey} fill={`var(--color-${key})`} radius={4} fillOpacity={0.4}/>
                        )
                    })}
                </BarChart>
            )}
        </ChartContainer>
    );
}
