
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
    growthRate: { label: "Net Profit Growth (%)", color: "hsl(var(--chart-3))" },
} satisfies ChartConfig;

type ChartView = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

const calculateGrowth = (current?: number, previous?: number) => {
    if (previous === undefined || previous === null || current === undefined || current === null) return 0;
    // If previous was zero
    if (previous === 0) {
      // and current is also zero, growth is 0%
      if (current === 0) return 0;
      // and current is positive, it's infinite growth (show as 100% or a large number)
      if (current > 0) return 100;
       // and current is negative, it's infinite negative growth (show as -100%)
      return -100;
    }
    // Standard growth calculation
    return ((current - previous) / previous) * 100;
};

export default function NetProfitGrowthChart({ timeSeries }: { timeSeries: {date: string; netProfit: number}[] }) {
    const [chartType, setChartType] = useState<'bar' | 'line'>('line');
    const [chartView, setChartView] = useState<ChartView>('monthly');

    const aggregatedData = useMemo(() => {
        if (!timeSeries || timeSeries.length === 0) {
            return [];
        }

        const aggregate = (data: {date: string; netProfit: number}[], view: ChartView) => {
            const map = new Map<string, number>();
            data.forEach(item => {
                const itemDate = parseISO(item.date);
                let key = '';
                switch (view) {
                    case 'daily': key = item.date; break;
                    case 'weekly': key = format(startOfWeek(itemDate, { weekStartsOn: 1 }), 'yyyy-MM-dd'); break;
                    case 'monthly': key = format(startOfMonth(itemDate), 'yyyy-MM-dd'); break;
                    case 'quarterly': key = `${getYear(itemDate)}-Q${getQuarter(itemDate)}`; break;
                    case 'yearly': key = getYear(itemDate).toString(); break;
                    default: key = item.date; break;
                }
                map.set(key, (map.get(key) || 0) + item.netProfit);
            });
            return Array.from(map.entries())
                        .map(([date, netProfit]) => ({ date, netProfit }))
                        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        };

        const currentAggregated = aggregate(timeSeries, chartView);
        
        return currentAggregated.map((item, index) => {
            const previousItem = index > 0 ? currentAggregated[index - 1] : { netProfit: undefined };
            return {
                date: item.date,
                netProfit: item.netProfit,
                previousNetProfit: previousItem?.netProfit,
                growthRate: calculateGrowth(item.netProfit, previousItem?.netProfit),
            };
        });

    }, [timeSeries, chartView]);

    const tickFormatter = (value: string) => {
        try {
            switch (chartView) {
                case 'daily': return format(parseISO(value), "MMM d");
                case 'weekly': return `W/C ${format(parseISO(value), "MMM d")}`;
                case 'monthly': return format(parseISO(value), "MMM yyyy");
                case 'quarterly': return value;
                case 'yearly': return value;
                default: return value;
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
                        <CardTitle>Net Profit Growth Trend</CardTitle>
                        <CardDescription>Percentage growth of net profit compared to the previous interval.</CardDescription>
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
                                    formatter={(value, name, props) => {
                                        const { payload } = props;
                                        const netProfit = payload?.netProfit as number | undefined;
                                        const prevNetProfit = payload?.previousNetProfit as number | undefined;
                                        const details = `(Current: $${netProfit?.toFixed(0)}, Prev: $${prevNetProfit?.toFixed(0)})`;
                                        return [`${(value as number).toFixed(2)}% ${details}`, "Growth"];
                                    }}
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
