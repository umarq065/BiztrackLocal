
"use client";

import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import type { RevenueDataPoint } from '@/lib/services/analyticsService';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { BarChart2, LineChartIcon } from 'lucide-react';
import { format, startOfWeek, startOfMonth, getQuarter, getYear, parseISO, startOfYear } from "date-fns";

const chartConfig = {
    growthRate: { label: "Revenue Growth (%)", color: "hsl(var(--chart-1))" },
} satisfies ChartConfig;

type ChartView = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

const calculateGrowth = (current?: number, previous?: number) => {
    if (previous === undefined || previous === null || current === undefined || current === null) return 0;
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
};

export default function GrowthMetricsChart({ timeSeries }: { timeSeries: { currentRevenue: RevenueDataPoint[], previousRevenue: RevenueDataPoint[] } }) {
    const [chartType, setChartType] = useState<'bar' | 'line'>('bar');
    const [chartView, setChartView] = useState<ChartView>('monthly');

    const aggregatedData = useMemo(() => {
        const aggregate = (data: RevenueDataPoint[], view: ChartView) => {
            const map = new Map<string, number>();
            data.forEach(item => {
                const itemDate = parseISO(item.date);
                let key = '';
                switch (view) {
                    case 'weekly': key = format(startOfWeek(itemDate, { weekStartsOn: 1 }), 'yyyy-MM-dd'); break;
                    case 'monthly': key = format(startOfMonth(itemDate), 'yyyy-MM-dd'); break;
                    case 'quarterly': key = `${getYear(itemDate)}-Q${getQuarter(itemDate)}`; break;
                    case 'yearly': key = getYear(itemDate).toString(); break;
                    default: key = item.date; break;
                }
                map.set(key, (map.get(key) || 0) + item.revenue);
            });
            return map;
        };

        const currentAggregated = aggregate(timeSeries.currentRevenue, chartView);
        const previousAggregated = aggregate(timeSeries.previousRevenue, chartView);

        const allKeys = new Set([...currentAggregated.keys(), ...previousAggregated.keys()]);
        const sortedKeys = Array.from(allKeys).sort((a,b) => new Date(a).getTime() - new Date(b).getTime());

        return sortedKeys.map(key => ({
            date: key,
            growthRate: calculateGrowth(currentAggregated.get(key), previousAggregated.get(key)),
        }));

    }, [timeSeries, chartView]);

    const tickFormatter = (value: string) => {
        try {
            switch (chartView) {
                case 'weekly': return `W/C ${format(parseISO(value), "MMM d")}`;
                case 'monthly': return format(parseISO(value), "MMM yyyy");
                case 'quarterly':
                case 'yearly': return value;
                default: return format(parseISO(value), "MMM d");
            }
        } catch (e) {
            return value;
        }
    };
    
    const Chart = chartType === 'bar' ? BarChart : LineChart;
    const ChartComponent = chartType === 'bar' ? Bar : Line;

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <CardTitle>Revenue Growth Trend</CardTitle>
                        <CardDescription>Percentage growth of revenue compared to the previous period.</CardDescription>
                    </div>
                     <div className="flex items-center gap-4">
                         <div className="flex items-center gap-1">
                            <Button variant={chartType === 'bar' ? 'secondary' : 'ghost'} size="sm" onClick={() => setChartType('bar')}>
                                <BarChart2 className="h-4 w-4" />
                            </Button>
                            <Button variant={chartType === 'line' ? 'secondary' : 'ghost'} size="sm" onClick={() => setChartType('line')}>
                                <LineChartIcon className="h-4 w-4" />
                            </Button>
                        </div>
                        <Select value={chartView} onValueChange={(v) => setChartView(v as ChartView)}>
                            <SelectTrigger className="w-[120px]">
                                <SelectValue placeholder="Select view" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="daily">Daily</SelectItem>
                                <SelectItem value="weekly">Weekly</SelectItem>
                                <SelectItem value="monthly">Monthly</SelectItem>
                                <SelectItem value="quarterly">Quarterly</SelectItem>
                                <SelectItem value="yearly">Yearly</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                    <Chart data={aggregatedData}>
                        <CartesianGrid vertical={false} />
                        <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={tickFormatter} />
                        <YAxis tickFormatter={(value) => `${value.toFixed(0)}%`} />
                        <Tooltip
                            content={
                                <ChartTooltipContent
                                    formatter={(value) => [`${(value as number).toFixed(2)}%`, "Growth"]}
                                    indicator="dot"
                                />
                            }
                        />
                        <Legend />
                        <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                         <ChartComponent 
                            dataKey="growthRate" 
                            fill="var(--color-growthRate)" 
                            stroke="var(--color-growthRate)" 
                            radius={chartType === 'bar' ? 4 : undefined} 
                        />
                    </Chart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}