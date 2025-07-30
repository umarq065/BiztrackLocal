
"use client";

import { useMemo, useState } from 'react';
import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar, BarChart, Dot } from 'recharts';
import {
  ChartContainer,
  ChartTooltipContent,
  ChartLegend,
  type ChartConfig
} from "@/components/ui/chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { type YearlyStatsData } from '@/lib/data/yearly-stats-data';
import { Button } from '@/components/ui/button';
import { BarChart2, LineChartIcon, BookText } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '../ui/separator';

interface MonthlyRevenueVsTargetChartProps {
    allYearlyData: YearlyStatsData;
    selectedYears: number[];
}

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const baseChartColors = {
  revenue: "hsl(var(--chart-1))",
  target: "hsl(var(--chart-5))",
};

const generateColor = (index: number): string => {
    const hue = (index * 137.508) % 360; // Use golden angle approximation
    return `hsl(${hue}, 70%, 50%)`;
};

const sanitizeKey = (key: string) => key.replace(/[^a-zA-Z0-9_]/g, '');

const baseMetrics = Object.keys(baseChartColors);

const CustomDotWithNote = (props: any) => {
  const { cx, cy, payload } = props;
  if (payload.notes && payload.notes.length > 0) {
    return (
      <Dot
        cx={cx}
        cy={cy}
        r={5}
        fill="hsl(var(--primary))"
        stroke="hsl(var(--background))"
        strokeWidth={2}
      />
    );
  }
  return null;
};

export default function MonthlyRevenueVsTargetChart({ allYearlyData, selectedYears }: MonthlyRevenueVsTargetChartProps) {
    const [chartType, setChartType] = useState<'bar' | 'line'>('line');
    const [activeMetrics, setActiveMetrics] = useState<Record<string, boolean>>({
        revenue: true,
        target: true,
    });
    
    const { chartData, chartConfig, legendStats, isYoy } = useMemo(() => {
        const yoy = selectedYears.length > 1;
        const yearsWithData = selectedYears.filter(year => allYearlyData[year]);
        
        const data: { month: string; notes?: any[]; [key: string]: any }[] = months.map((month, index) => ({ 
            month, 
            notes: yearsWithData.flatMap(year => allYearlyData[year]?.monthlyFinancials[index]?.notes || [])
        }));

        const config: ChartConfig = {};
        const legendData: Record<string, { label: string; total: number; avg: number; year?: number }> = {};

        if (yearsWithData.length === 0) {
            return { chartData: [], chartConfig: {}, legendStats: {}, isYoy: yoy };
        }

        const currentSysYear = new Date().getFullYear();
        const currentSysMonth = new Date().getMonth(); // 0-11
        let colorCounter = 0;

        yearsWithData.forEach((year, yearIndex) => {
            const yearData = allYearlyData[year];
            if (!yearData || !yearData.monthlyFinancials) return;

            Object.keys(baseChartColors).forEach((metric, metricIndex) => {
                const baseKey = sanitizeKey(metric);
                const key = yoy ? `${baseKey}_${year}` : baseKey;
                const label = yoy ? `${metric.charAt(0).toUpperCase() + metric.slice(1)} ${year}` : `${metric.charAt(0).toUpperCase() + metric.slice(1)}`;
                
                let color: string;
                 if (!yoy) {
                    color = metric === 'revenue' ? baseChartColors.revenue : baseChartColors.target;
                } else {
                    color = generateColor(colorCounter++);
                }
                
                config[key] = { 
                    label: label, 
                    color: color
                };

                let total = 0;
                const sourceData = metric === 'revenue' 
                    ? (yearData.monthlyFinancials || []).map(f => f.revenue) 
                    : (yearData.monthlyFinancials || []).map(f => f.monthlyTargetRevenue || 0);

                sourceData.forEach((val, monthIndex) => {
                    data[monthIndex][key] = val;
                    total += val;
                });
                
                let monthsForAvg = 12;
                if (year === currentSysYear) {
                    monthsForAvg = currentSysMonth + 1;
                } else if (year > currentSysYear) {
                    monthsForAvg = 0;
                }
                const avg = monthsForAvg > 0 ? Math.round(total / monthsForAvg) : 0;
                
                legendData[key] = {
                    label: label,
                    total: total,
                    avg,
                    year: yoy ? year : undefined,
                };
            });
        });
        
        return { chartData: data, chartConfig: config, legendStats: legendData, isYoy: yoy };
    }, [selectedYears, allYearlyData]);

    const handleMetricToggle = (metric: string) => {
        setActiveMetrics(prev => ({ ...prev, [metric]: !prev[metric] }));
    };

    const activeChartKeys = useMemo(() => {
        return Object.keys(chartConfig).filter(key => {
            const baseMetric = baseMetrics.find(bm => key.startsWith(bm));
            return baseMetric && activeMetrics[baseMetric];
        });
    }, [chartConfig, activeMetrics]);

    const CustomTooltipWithNotes = (props: any) => {
        const { active, payload, label } = props;
        if (active && payload && payload.length) {
            const notes = payload[0].payload.notes;
            return (
                <div className="z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md max-w-sm">
                    <p className="font-medium">{label}</p>
                    {payload.map((pld: any) => (
                        <div key={pld.dataKey} className="flex items-center justify-between">
                            <div className="flex items-center">
                                <span className="mr-2 h-2.5 w-2.5 shrink-0 rounded-[2px]" style={{ backgroundColor: pld.color || pld.stroke || pld.fill }} />
                                <span>{chartConfig[pld.dataKey as keyof typeof chartConfig]?.label}:</span>
                            </div>
                            <span className="ml-4 font-mono font-medium">${Number(pld.value).toLocaleString()}</span>
                        </div>
                    ))}
                    {notes && notes.length > 0 && (
                        <>
                            <Separator className="my-2" />
                            {notes.map((note: any, index: number) => (
                                <div key={index} className="flex items-start gap-2 text-muted-foreground mt-1">
                                    <BookText className="size-4 shrink-0 mt-0.5 text-primary" />
                                    <div className="flex flex-col">
                                        <p className="font-semibold text-foreground">{note.title}</p>
                                        <p className="text-xs whitespace-pre-wrap">{note.content}</p>
                                    </div>
                                </div>
                            ))}
                        </>
                    )}
                </div>
            );
        }
        return null;
    };

    const CustomLegend = (props: any) => {
      const { payload } = props;
      const formatCurrency = (value: number) => `$${value.toLocaleString()}`;
      const activePayload = payload.filter((p: any) => activeChartKeys.includes(p.value));
      
      return (
        <div className="flex justify-center gap-4 pt-4 flex-wrap">
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
                            <span>Total: <span className="font-medium text-foreground/90">{formatCurrency(stats.total)}</span></span>
                            <span>Avg: <span className="font-medium text-foreground/90">{formatCurrency(stats.avg)}</span></span>
                        </div>
                    </div>
                </div>
            );
          })}
        </div>
      );
    }
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Monthly Revenue vs. Target Revenue</CardTitle>
                <CardDescription>A line graph comparing your actual monthly revenue against your target revenue for the year.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                    <div className="md:col-span-1">
                        <div className="space-y-4">
                            <div className="flex items-center gap-1">
                                <Button
                                    variant={chartType === 'bar' ? 'secondary' : 'ghost'}
                                    size="sm"
                                    className="w-full justify-center"
                                    onClick={() => setChartType('bar')}
                                    aria-label="Switch to Bar Chart"
                                >
                                    <BarChart2 className="h-4 w-4" />
                                    <span className="ml-2">Bar</span>
                                </Button>
                                <Button
                                    variant={chartType === 'line' ? 'secondary' : 'ghost'}
                                    size="sm"
                                    className="w-full justify-center"
                                    onClick={() => setChartType('line')}
                                    aria-label="Switch to Line Chart"
                                >
                                    <LineChartIcon className="h-4 w-4" />
                                    <span className="ml-2">Line</span>
                                </Button>
                            </div>
                            <div>
                                <h4 className="font-semibold mb-2 mt-4">Display Metrics</h4>
                                <div className="space-y-2 rounded-md border p-2">
                                    {baseMetrics.map((metric) => (
                                        <div key={metric} className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted/50">
                                            <Checkbox
                                                id={`metric-revenue-${metric}`}
                                                checked={!!activeMetrics[metric]}
                                                onCheckedChange={() => handleMetricToggle(metric)}
                                            />
                                            <Label htmlFor={`metric-revenue-${metric}`} className="flex-1 cursor-pointer font-normal capitalize">
                                                {metric}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="md:col-span-4">
                        <ChartContainer config={chartConfig} className="w-full min-h-[400px]">
                            {chartType === 'bar' ? (
                                <BarChart data={chartData} margin={{ top: 20, right: 20, left: 10, bottom: 5 }}>
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
                                        tickFormatter={(value) => `$${value / 1000}k`}
                                    />
                                    <Tooltip
                                        cursor={false}
                                        content={<CustomTooltipWithNotes />}
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
                                        tickFormatter={(value) => `$${value / 1000}k`}
                                    />
                                    <Tooltip
                                        cursor={false}
                                        content={<CustomTooltipWithNotes />}
                                    />
                                    <ChartLegend content={<CustomLegend />} />
                                    {activeChartKeys.map(key => (
                                        <Line key={key} dataKey={key} type="monotone" stroke={`var(--color-${key})`} strokeWidth={2} dot={<CustomDotWithNote />} />
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
