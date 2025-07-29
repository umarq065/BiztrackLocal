
"use client";

import { useMemo, useState, useEffect } from 'react';
import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar, BarChart } from 'recharts';
import {
  ChartContainer,
  ChartTooltipContent,
  ChartLegend,
  type ChartConfig
} from "@/components/ui/chart";
import { type YearlyStatsData, type SingleYearData } from '@/lib/data/yearly-stats-data';
import { Button } from '@/components/ui/button';
import { BarChart2, LineChartIcon } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '../ui/skeleton';
import { cn } from '@/lib/utils';

interface MyOrdersVsCompetitorAvgChartProps {
    allYearlyData: YearlyStatsData;
    selectedYears: number[];
}

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const colorVariants: {[key: number]: string} = {
    0: "hsl(var(--chart-1))",
    1: "hsl(var(--chart-2))",
    2: "hsl(var(--chart-3))",
    3: "hsl(var(--chart-4))",
    4: "hsl(var(--chart-5))",
};


const sanitizeKey = (key: string) => key.replace(/[^a-zA-Z0-9_]/g, '');

const baseMetrics = ['My Orders', 'Competitor Avg.'];

export default function MyOrdersVsCompetitorAvgChart({ allYearlyData, selectedYears }: MyOrdersVsCompetitorAvgChartProps) {
    const [chartType, setChartType] = useState<'bar' | 'line'>('bar');
    const [activeMetrics, setActiveMetrics] = useState<Record<string, boolean>>({
        'My Orders': true,
        'Competitor Avg.': true,
    });
    
    const { chartData, chartConfig, legendStats, isYoy, isLoading } = useMemo(() => {
        const yearsWithData = selectedYears.filter(year => allYearlyData[year]);
        if (yearsWithData.length === 0 || Object.keys(allYearlyData).length === 0) {
            return { chartData: [], chartConfig: {}, legendStats: {}, isYoy: false, isLoading: true };
        }

        const yoy = yearsWithData.length > 1;
        const data: { month: string; [key: string]: string | number }[] = months.map((month) => ({ month }));
        const config: ChartConfig = {};
        const legendData: Record<string, { label: string; total: number; avg: number; year?: number }> = {};
        
        const currentSysYear = new Date().getFullYear();
        const currentSysMonth = new Date().getMonth(); // 0-11

        yearsWithData.forEach((year, yearIndex) => {
            const yearData = allYearlyData[year];
            if (!yearData) return;
            
            const metrics: Record<string, number[]> = { 'My Orders': yearData.monthlyOrders, 'Competitor Avg.': [] };
            
            months.forEach((_, monthIndex) => {
                const competitorTotalForMonth = (yearData.competitors || []).reduce((sum, comp) => sum + comp.monthlyOrders[monthIndex], 0);
                metrics['Competitor Avg.'].push(yearData.competitors.length > 0 ? Math.round(competitorTotalForMonth / yearData.competitors.length) : 0);
            });
            
            Object.entries(metrics).forEach(([metricName, monthlyValues], metricIndex) => {
                const baseKey = sanitizeKey(metricName);
                const key = yoy ? `${baseKey}_${year}` : baseKey;
                const label = yoy ? `${metricName} ${year}` : metricName;
                const colorIndex = (metricIndex * yearsWithData.length + yearIndex) % Object.keys(colorVariants).length;

                config[key] = { label, color: colorVariants[colorIndex] };

                monthlyValues.forEach((value, monthIndex) => {
                    data[monthIndex][key] = value;
                });
                
                const total = monthlyValues.reduce((s, c) => s + c, 0);

                let monthsForAvg = 12;
                if (year === currentSysYear) {
                    monthsForAvg = currentSysMonth + 1;
                } else if (year > currentSysYear) {
                    monthsForAvg = 0; // Don't show average for future years
                }
                const avg = monthsForAvg > 0 ? Math.round(total / monthsForAvg) : 0;
                
                legendData[key] = { label, total, avg, year: yoy ? year : undefined };
            });
        });
        
        if (yoy) {
            const totalMyOrders = Object.entries(legendData)
                .filter(([key, _]) => key.startsWith('MyOrders'))
                .reduce((sum, [, val]) => sum + val.total, 0);

            const totalCompetitorOrders = Object.entries(legendData)
                .filter(([key, _]) => key.startsWith('CompetitorAvg'))
                .reduce((sum, [, val]) => sum + val.total, 0);

            const totalMonths = yearsWithData.reduce((acc, year) => {
                 if (year < currentSysYear) return acc + 12;
                 if (year === currentSysYear) return acc + (currentSysMonth + 1);
                 return acc;
            }, 0)
            
            const avgMyOrders = totalMonths > 0 ? Math.round(totalMyOrders / totalMonths) : 0;
            const avgCompetitorOrders = totalMonths > 0 ? Math.round(totalCompetitorOrders / totalMonths) : 0;

            legendData['total_my_orders'] = { label: 'Total My Orders', total: totalMyOrders, avg: avgMyOrders };
            legendData['total_competitor_avg'] = { label: 'Total Competitor Avg.', total: totalCompetitorOrders, avg: avgCompetitorOrders };
        }
        
        return { chartData: data, chartConfig: config, legendStats: legendData, isYoy: yoy, isLoading: false };

    }, [selectedYears, allYearlyData]);

    const handleMetricToggle = (metric: string) => {
        setActiveMetrics(prev => ({ ...prev, [metric]: !prev[metric] }));
    };

    const activeChartKeys = useMemo(() => {
        return Object.keys(chartConfig).filter(key => {
            const baseMetric = baseMetrics.find(bm => key.startsWith(sanitizeKey(bm)));
            return baseMetric && activeMetrics[baseMetric];
        });
    }, [chartConfig, activeMetrics]);

    const ChartTooltipContentCustom = (
        <ChartTooltipContent
            indicator="dot"
            labelClassName="font-semibold"
            nameKey="name"
        />
    );

    const CustomLegend = (props: any) => {
      const { payload } = props;
      const formatNumber = (value: number) => value.toLocaleString();
      const activePayload = payload.filter((p: any) => activeChartKeys.includes(p.value));

      return (
        <div className="flex flex-col items-center gap-4 pt-4">
            <div className="flex justify-center gap-4 flex-wrap">
              {activePayload.map((entry: any, index: number) => {
                const key = entry.value as keyof typeof legendStats;
                const stats = legendStats[key];
                if (!stats) return null;

                return (
                    <div key={`item-${index}`} className="flex items-center space-x-2 rounded-lg border bg-background/50 px-4 py-2">
                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: entry.color }} />
                        <div className="flex flex-col text-sm">
                            <span className="font-semibold text-foreground">{stats.label}</span>
                            <div className="flex gap-2 text-muted-foreground">
                                <span>Total: <span className="font-medium text-foreground/90">{formatNumber(stats.total)}</span></span>
                                <span>Avg: <span className="font-medium text-foreground/90">{formatNumber(stats.avg)}</span></span>
                            </div>
                        </div>
                    </div>
                );
              })}
            </div>
            {isYoy && (
                <div className="flex justify-center gap-4 flex-wrap border-t pt-4 mt-4 w-full">
                    {legendStats.total_my_orders && activeMetrics['My Orders'] && (
                        <div className="flex items-center space-x-2 rounded-lg border bg-background/50 px-4 py-2">
                            <div className="flex flex-col text-sm">
                                <span className="font-semibold text-foreground">{legendStats.total_my_orders.label}</span>
                                <div className="flex gap-2 text-muted-foreground">
                                    <span>Total: <span className="font-medium text-foreground/90">{formatNumber(legendStats.total_my_orders.total)}</span></span>
                                    <span>Avg: <span className="font-medium text-foreground/90">{formatNumber(legendStats.total_my_orders.avg)}</span></span>
                                </div>
                            </div>
                        </div>
                    )}
                     {legendStats.total_competitor_avg && activeMetrics['Competitor Avg.'] && (
                        <div className="flex items-center space-x-2 rounded-lg border bg-background/50 px-4 py-2">
                            <div className="flex flex-col text-sm">
                                <span className="font-semibold text-foreground">{legendStats.total_competitor_avg.label}</span>
                                <div className="flex gap-2 text-muted-foreground">
                                    <span>Total: <span className="font-medium text-foreground/90">{formatNumber(legendStats.total_competitor_avg.total)}</span></span>
                                    <span>Avg: <span className="font-medium text-foreground/90">{formatNumber(legendStats.total_competitor_avg.avg)}</span></span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
      );
    }

    if (isLoading) {
        return <Skeleton className="h-[500px] lg:col-span-2" />;
    }

    return (
        <Card className="lg:col-span-2">
            <CardHeader className="flex flex-col items-start justify-between gap-y-4 md:flex-row md:items-center">
                <div>
                    <CardTitle>My Orders vs. Average Competitor Orders (Monthly)</CardTitle>
                    <CardDescription>A comparison of your monthly orders against the average of your competitors.</CardDescription>
                </div>
                <div className="flex items-center gap-1">
                    <Button
                        variant={chartType === 'bar' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setChartType('bar')}
                        aria-label="Switch to Bar Chart"
                    >
                        <BarChart2 className="h-4 w-4" />
                        <span className="ml-2 hidden sm:inline">Bar</span>
                    </Button>
                    <Button
                        variant={chartType === 'line' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setChartType('line')}
                        aria-label="Switch to Line Chart"
                    >
                        <LineChartIcon className="h-4 w-4" />
                        <span className="ml-2 hidden sm:inline">Line</span>
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                    <div className="md:col-span-1">
                        <div className="space-y-4">
                            <div>
                                <h4 className="font-semibold mb-2">Display Metrics</h4>
                                <div className="space-y-2 rounded-md border p-2">
                                    {baseMetrics.map((metric) => (
                                        <div key={metric} className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted/50">
                                            <Checkbox
                                                id={`metric-avg-${metric}`}
                                                checked={!!activeMetrics[metric]}
                                                onCheckedChange={() => handleMetricToggle(metric)}
                                            />
                                            <Label htmlFor={`metric-avg-${metric}`} className="flex-1 cursor-pointer font-normal">
                                                {metric}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="md:col-span-4">
                        <ChartContainer config={chartConfig} className={cn("w-full", selectedYears.length > 1 ? "min-h-[500px]" : "min-h-[400px]")}>
                            {chartType === 'bar' ? (
                                <BarChart
                                    data={chartData}
                                    margin={{ top: 20, right: 20, left: 10, bottom: 5 }}
                                >
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
                                    />
                                    <Tooltip
                                        cursor={false}
                                        content={ChartTooltipContentCustom}
                                    />
                                    <ChartLegend content={<CustomLegend />} />
                                    {activeChartKeys.map(key => (
                                        <Bar key={key} dataKey={key} fill={`var(--color-${key})`} radius={4} />
                                    ))}
                                </BarChart>
                            ) : (
                                 <LineChart data={chartData} margin={{ top: 20, right: 20, left: 10, bottom: 5 }}>
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
                                    />
                                    <Tooltip
                                        cursor={false}
                                        content={ChartTooltipContentCustom}
                                    />
                                    <ChartLegend content={<CustomLegend />} />
                                    {activeChartKeys.map(key => (
                                        <Line key={key} dataKey={key} type="monotone" stroke={`var(--color-${key})`} strokeWidth={2} dot={true} />
                                    ))}
                                </LineChart>
                            )}
                        </ChartContainer>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
