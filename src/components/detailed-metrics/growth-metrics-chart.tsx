
"use client";

import { useMemo, useState } from 'react';
import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Dot, BarChart, Bar } from 'recharts';
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '../ui/separator';
import { BookText, BarChart2, LineChartIcon } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import type { GrowthMetricTimeSeries } from '@/lib/services/analyticsService';
import { format, parseISO, startOfWeek, startOfMonth, getQuarter, getYear, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, eachQuarterOfInterval, eachYearOfInterval, endOfWeek, isSameMonth, endOfMonth, endOfQuarter, endOfYear, sub } from "date-fns";

const chartConfig = {
    revenueGrowth: { label: "Revenue Growth", color: "hsl(var(--chart-1))" },
    profitGrowth: { label: "Profit Growth", color: "hsl(var(--chart-2))" },
    clientGrowth: { label: "Client Growth", color: "hsl(var(--chart-3))" },
    aovGrowth: { label: "AOV Growth", color: "hsl(var(--chart-4))" },
    highValueClientGrowth: { label: "High-Value Client Growth", color: "hsl(var(--chart-5))" },
    sourceGrowth: { label: "Source/Gig Growth", color: "hsl(var(--primary))" },
} satisfies ChartConfig;

interface GrowthMetricsChartProps {
    data: GrowthMetricTimeSeries[];
    activeMetrics: Record<string, boolean>;
    onMetricToggle: (metric: string) => void;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const notes = payload[0].payload.notes;
    return (
      <div className="z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md max-w-sm">
        <p className="font-medium">{label}</p>
        {payload.map((pld: any) => (
          pld.value ? (
            <div key={pld.dataKey} className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="mr-2 h-2.5 w-2.5 shrink-0 rounded-[2px]" style={{ backgroundColor: pld.color || pld.stroke || pld.fill }} />
                <span>{chartConfig[pld.dataKey as keyof typeof chartConfig]?.label}:</span>
              </div>
              <span className="ml-4 font-mono font-medium">{pld.value.toFixed(1)}%</span>
            </div>
          ) : null
        ))}
        {notes && notes.length > 0 && (
          <>
            <Separator className="my-2" />
            {notes.map((note: any, index: number) => (
                <div key={index} className="flex items-start gap-2 text-muted-foreground mt-2">
                    <BookText className="size-4 shrink-0 mt-0.5 text-primary" />
                    <div className="flex flex-col">
                        <p className="font-semibold text-foreground">{format(parseISO(note.date), 'MMM d, yyyy')}: {note.title}</p>
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

const CustomDot = (props: any) => {
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

type ChartView = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export default function GrowthMetricsChart({ data, activeMetrics, onMetricToggle }: GrowthMetricsChartProps) {
    const [chartType, setChartType] = useState<'line' | 'bar'>('line');
    const [chartView, setChartView] = useState<ChartView>('monthly');

    const aggregatedData = useMemo(() => {
        if (!data || data.length === 0) return [];
        
        const dataByDate = data.reduce((acc, item) => {
            acc[item.date] = item;
            return acc;
        }, {} as Record<string, typeof data[0]>);

        const firstDataPointDate = parseISO(data[0].date);
        const lastDataPointDate = parseISO(data[data.length - 1].date);
        
        let intervalDates: Date[] = [];
        if (firstDataPointDate > lastDataPointDate) return [];

        const interval = { start: firstDataPointDate, end: lastDataPointDate };
        
        switch (chartView) {
            case 'daily': intervalDates = eachDayOfInterval(interval); break;
            case 'weekly': intervalDates = eachWeekOfInterval(interval, { weekStartsOn: 1 }); break;
            case 'monthly': intervalDates = eachMonthOfInterval(interval); break;
            case 'quarterly': intervalDates = eachQuarterOfInterval(interval); break;
            case 'yearly': intervalDates = eachYearOfInterval(interval); break;
        }

        const result = intervalDates.map(intervalDate => {
            let key = '';
            let endOfPeriod: Date;
            switch(chartView) {
                case 'daily': key = format(intervalDate, 'yyyy-MM-dd'); endOfPeriod = intervalDate; break;
                case 'weekly': key = format(intervalDate, 'yyyy-MM-dd'); endOfPeriod = endOfWeek(intervalDate, { weekStartsOn: 1 }); break;
                case 'monthly': key = format(intervalDate, 'yyyy-MM-dd'); endOfPeriod = endOfMonth(intervalDate); break;
                case 'quarterly': key = format(intervalDate, 'yyyy-MM-dd'); endOfPeriod = endOfQuarter(intervalDate); break;
                case 'yearly': key = format(intervalDate, 'yyyy-MM-dd'); endOfPeriod = endOfYear(intervalDate); break;
                default: key = format(intervalDate, 'yyyy-MM-dd'); endOfPeriod = intervalDate; break;
            }
            
            const daysInPeriod = eachDayOfInterval({start: intervalDate, end: endOfPeriod});
            const periodData = daysInPeriod.map(d => dataByDate[format(d, 'yyyy-MM-dd')]).filter(Boolean);

            const totals = periodData.reduce((acc, item) => {
                acc.revenue += item.totalRevenue;
                acc.netProfit += item.netProfit;
                acc.newClients += item.newClients;
                acc.totalOrders += item.totalOrders;
                acc.notes.push(...item.notes);
                return acc;
            }, { revenue: 0, netProfit: 0, newClients: 0, totalOrders: 0, notes: [] as any[] });
            
            return { date: key, ...totals };
        });
        
        const finalResult = result.map((item, index) => {
             let prevItem: typeof item | null = null;
             if (index > 0) {
                 prevItem = result[index-1];
             } else {
                 const prevDate = sub(parseISO(item.date), {
                     days: chartView === 'daily' ? 1 : 0,
                     weeks: chartView === 'weekly' ? 1 : 0,
                     months: chartView === 'monthly' ? 1 : 0,
                     quarters: chartView === 'quarterly' ? 1 : 0,
                     years: chartView === 'yearly' ? 1 : 0
                 });
                 const prevDateKey = format(prevDate, 'yyyy-MM-dd');
                 const prevItemData = dataByDate[prevDateKey];
                 if(prevItemData) {
                    prevItem = {
                        date: prevDateKey,
                        revenue: prevItemData.totalRevenue,
                        netProfit: prevItemData.netProfit,
                        newClients: prevItemData.newClients,
                        totalOrders: prevItemData.totalOrders,
                        notes: prevItemData.notes
                    };
                 }
             }

            const calculateGrowth = (current: number, prev: number) => {
                if (prev === 0) return current > 0 ? 100 : 0;
                return ((current - prev) / prev) * 100;
            };

            const revenueGrowth = prevItem ? calculateGrowth(item.revenue, prevItem.revenue) : 0;
            const profitGrowth = prevItem ? calculateGrowth(item.netProfit, prevItem.netProfit) : 0;
            
            const currentAOV = item.totalOrders > 0 ? item.revenue / item.totalOrders : 0;
            const prevAOV = prevItem && prevItem.totalOrders > 0 ? prevItem.revenue / prevItem.totalOrders : 0;
            const aovGrowth = prevItem ? calculateGrowth(currentAOV, prevAOV) : 0;

            return {
                ...item,
                revenueGrowth: isFinite(revenueGrowth) ? revenueGrowth : 0,
                profitGrowth: isFinite(profitGrowth) ? profitGrowth : 0,
                aovGrowth: isFinite(aovGrowth) ? aovGrowth : 0,
                clientGrowth: item.newClients, 
            };
        });
        
        return finalResult.filter(item => parseISO(item.date) >= firstDataPointDate);
    }, [data, chartView]);

    const tickFormatter = (value: string) => {
        try {
            const date = parseISO(value);
            switch (chartView) {
                case 'daily': return format(date, 'MMM d');
                case 'weekly': {
                    const start = startOfWeek(date, { weekStartsOn: 1 });
                    const end = endOfWeek(date, { weekStartsOn: 1 });
                    if (isSameMonth(start, end)) {
                        return `${format(start, 'MMM d')} - ${format(end, 'd')}`;
                    }
                    return `${format(start, 'MMM d')} - ${format(end, 'MMM d')}`;
                }
                case 'monthly': return format(date, 'MMM yyyy');
                case 'quarterly': return `Q${getQuarter(date)} ${getYear(date)}`;
                case 'yearly': return getYear(date).toString();
                default: return value;
            }
        } catch (e) {
            return value;
        }
    };

    return (
        <Card>
            <CardHeader>
                 <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <CardTitle>Growth Metrics Trend</CardTitle>
                        <CardDescription>Trends for key growth metrics based on the selected period.</CardDescription>
                    </div>
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center space-x-2">
                            <Label htmlFor="chart-type-toggle" className="text-sm font-normal">Line</Label>
                            <Switch
                                id="chart-type-toggle"
                                checked={chartType === 'bar'}
                                onCheckedChange={(checked) => setChartType(checked ? 'bar' : 'line')}
                                aria-label="Toggle between line and bar chart"
                            />
                            <Label htmlFor="chart-type-toggle" className="text-sm font-normal">Bar</Label>
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
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm mt-4">
                    {Object.keys(chartConfig).map((metric) => (
                        <div key={metric} className="flex items-center gap-2">
                            <Checkbox
                                id={`growth-metric-${metric}`}
                                checked={activeMetrics[metric as keyof typeof activeMetrics]}
                                onCheckedChange={() => onMetricToggle(metric as keyof typeof activeMetrics)}
                                style={{
                                    '--chart-color': chartConfig[metric as keyof typeof chartConfig].color,
                                } as React.CSSProperties}
                                className="data-[state=checked]:bg-[var(--chart-color)] data-[state=checked]:border-[var(--chart-color)] border-muted-foreground"
                            />
                            <Label htmlFor={`growth-metric-${metric}`} className="capitalize">
                                {chartConfig[metric as keyof typeof chartConfig].label}
                            </Label>
                        </div>
                    ))}
                </div>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                    {chartType === 'line' ? (
                        <LineChart data={aggregatedData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                            <CartesianGrid vertical={false} />
                            <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={tickFormatter} />
                            <YAxis tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => `${value}%`} />
                            <Tooltip cursor={false} content={<CustomTooltip />} />
                            {Object.keys(activeMetrics).filter(k => activeMetrics[k as keyof typeof activeMetrics]).map(key => (
                                <Line key={key} dataKey={key} type="monotone" stroke={`var(--color-${key})`} strokeWidth={2} dot={<CustomDot />} />
                            ))}
                        </LineChart>
                    ) : (
                        <BarChart data={aggregatedData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                            <CartesianGrid vertical={false} />
                            <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={tickFormatter} />
                            <YAxis tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => `${value}%`} />
                            <Tooltip cursor={false} content={<CustomTooltip />} />
                            {Object.keys(activeMetrics).filter(k => activeMetrics[k as keyof typeof activeMetrics]).map(key => (
                                <Bar key={key} dataKey={key} fill={`var(--color-${key})`} radius={4} />
                            ))}
                        </BarChart>
                    )}
                </ChartContainer>
            </CardContent>
        </Card>
    );
}
