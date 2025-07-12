
"use client";

import { useMemo, useState } from 'react';
import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar, BarChart } from 'recharts';
import {
  ChartContainer,
  ChartTooltipContent,
  ChartLegend,
  type ChartConfig
} from "@/components/ui/chart";
import { type YearlyStatsData } from '@/lib/data/yearly-stats-data';
import { Button } from '@/components/ui/button';
import { BarChart2, LineChartIcon } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface MonthlyRevenueVsTargetChartProps {
    allYearlyData: YearlyStatsData;
}

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const yoyChartColors = [
    "#8884d8", "#82ca9d", "#ffc658",
    "#ff7300", "#387908", "#0088FE",
    "#00C49F", "#FFBB28", "#FF8042",
    "#d0ed57", "#ffc0cb", "#8a2be2"
];

const baseChartColors = {
  revenue: "hsl(var(--chart-1))",
  target: "hsl(var(--chart-5))",
};

const sanitizeKey = (key: string) => key.replace(/[^a-zA-Z0-9_]/g, '');

export default function MonthlyRevenueVsTargetChart({ allYearlyData }: MonthlyRevenueVsTargetChartProps) {
    const [chartType, setChartType] = useState<'bar' | 'line'>('line');
    const availableYears = useMemo(() => Object.keys(allYearlyData).map(Number).sort((a,b) => a - b), [allYearlyData]);
    const [isYoY, setIsYoY] = useState(false);
    const [startYear, setStartYear] = useState(availableYears[0]);
    const [endYear, setEndYear] = useState(availableYears[availableYears.length - 1]);
    
    const latestYear = availableYears[availableYears.length - 1];

    const { chartData, chartConfig, legendStats } = useMemo(() => {
        const data: { month: string; [key: string]: string | number }[] = months.map((month) => ({ month }));
        const config: ChartConfig = {};
        const legendData: Record<string, { label: string; total: number; avg: number; }> = {};
        
        if (isYoY) {
            const selectedYears = availableYears.filter(y => y >= startYear && y <= endYear);
            let colorIndex = 0;

            selectedYears.forEach((year) => {
                const yearData = allYearlyData[year];
                
                Object.keys(baseChartColors).forEach((metric) => {
                    const key = sanitizeKey(`${metric}_${year}`);
                    config[key] = { 
                        label: `${metric.charAt(0).toUpperCase() + metric.slice(1)} ${year}`, 
                        color: yoyChartColors[colorIndex % yoyChartColors.length]
                    };
                    colorIndex++;
                    
                    let total = 0;
                    const sourceData = metric === 'revenue' ? yearData.monthlyFinancials.map(f => f.revenue) : yearData.monthlyTargetRevenue;

                    sourceData.forEach((val, monthIndex) => {
                        const metricValue = val;
                        data[monthIndex][key] = metricValue;
                        total += metricValue;
                    });

                    legendData[key] = {
                        label: `${metric.charAt(0).toUpperCase() + metric.slice(1)} ${year}`,
                        total: total,
                        avg: Math.round(total / 12),
                    };
                });
            });

        } else {
            // Single Year
            const yearData = allYearlyData[latestYear];
            Object.keys(baseChartColors).forEach(metric => {
                const key = sanitizeKey(metric);
                config[key] = { 
                    label: metric.charAt(0).toUpperCase() + metric.slice(1), 
                    color: baseChartColors[metric as keyof typeof baseChartColors] 
                };
                let total = 0;
                const sourceData = metric === 'revenue' ? yearData.monthlyFinancials.map(f => f.revenue) : yearData.monthlyTargetRevenue;

                sourceData.forEach((val, monthIndex) => {
                    const metricValue = val;
                    data[monthIndex][key] = metricValue;
                    total += metricValue;
                });
                legendData[key] = {
                    label: metric.charAt(0).toUpperCase() + metric.slice(1),
                    total: total,
                    avg: Math.round(total / 12),
                };
            });
        }
        
        return { chartData: data, chartConfig: config, legendStats: legendData };

    }, [isYoY, startYear, endYear, allYearlyData, availableYears, latestYear]);

    const CustomLegend = (props: any) => {
      const { payload } = props;
      const formatCurrency = (value: number) => `$${value.toLocaleString()}`;
      
      return (
        <div className="flex justify-center gap-4 pt-4 flex-wrap">
          {payload.map((entry: any, index: number) => {
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
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
             <div className="md:col-span-1">
                <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                        <Checkbox id="yoy-revenue-target-checkbox" checked={isYoY} onCheckedChange={(checked) => setIsYoY(!!checked)} />
                        <Label htmlFor="yoy-revenue-target-checkbox" className="font-semibold">Year-over-Year</Label>
                    </div>
                    
                    {isYoY && (
                        <div className="space-y-2">
                            <Label>From</Label>
                            <Select value={String(startYear)} onValueChange={(v) => setStartYear(Number(v))}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {availableYears.map(y => <SelectItem key={y} value={String(y)} disabled={y > endYear}>{y}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <Label>To</Label>
                             <Select value={String(endYear)} onValueChange={(v) => setEndYear(Number(v))}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {availableYears.map(y => <SelectItem key={y} value={String(y)} disabled={y < startYear}>{y}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
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
                                content={<ChartTooltipContent
                                    indicator="dot"
                                    valueFormatter={(value) => `$${Number(value).toLocaleString()}`}
                                />}
                            />
                            <ChartLegend content={<CustomLegend />} />
                            {Object.keys(chartConfig).map(key => (
                                <Bar key={key} dataKey={key} fill={`var(--color-${key})`} radius={isYoY ? 0 : 4} />
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
                                content={<ChartTooltipContent
                                    indicator="dot"
                                    valueFormatter={(value) => `$${Number(value).toLocaleString()}`}
                                />}
                            />
                            <ChartLegend content={<CustomLegend />} />
                            {Object.keys(chartConfig).map(key => (
                                <Line key={key} dataKey={key} type="monotone" stroke={`var(--color-${key})`} strokeWidth={2} dot={true} />
                            ))}
                        </LineChart>
                    )}
                </ChartContainer>
            </div>
        </div>
    );
}
