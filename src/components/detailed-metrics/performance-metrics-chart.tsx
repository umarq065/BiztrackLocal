
"use client";

import { useMemo, useState } from 'react';
import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Dot } from 'recharts';
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '../ui/separator';
import { BookText } from 'lucide-react';
import type { PerformanceMetricTimeSeries } from '@/lib/services/analyticsService';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, parseISO, startOfWeek, startOfMonth, getQuarter, getYear, startOfYear } from "date-fns";

const chartConfig = {
    impressions: { label: "Impressions", color: "hsl(var(--chart-1))" },
    clicks: { label: "Clicks", color: "hsl(var(--chart-2))" },
    messages: { label: "Messages", color: "hsl(var(--chart-3))" },
    ctr: { label: "CTR (%)", color: "hsl(var(--chart-4))" },
} satisfies ChartConfig;

type ChartView = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

interface PerformanceMetricsChartProps {
    data: PerformanceMetricTimeSeries[];
    activeMetrics: Record<string, boolean>;
    onMetricToggle: (metric: string) => void;
    chartView: ChartView;
    onChartViewChange: (view: ChartView) => void;
}

const CustomTooltipWithNotes = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const notes = payload[0].payload.note ? (Array.isArray(payload[0].payload.note) ? payload[0].payload.note : [payload[0].payload.note]) : [];
    
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
              <span className="ml-4 font-mono font-medium">
                {typeof pld.dataKey === 'string' && pld.dataKey.includes('ctr') ? `${pld.value.toFixed(2)}%` : pld.value.toLocaleString()}
              </span>
            </div>
          ) : null
        ))}
         {notes && notes.length > 0 && (
          <>
            <Separator className="my-2" />
            {notes.map((note: any, index: number) => (
              note && note.date && (
                <div key={index} className="flex flex-col items-start gap-1 text-muted-foreground mt-1">
                    <div className="flex items-center gap-2">
                      <BookText className="size-4 shrink-0 text-primary" />
                      <span className="font-semibold text-foreground">{format(parseISO(note.date), "MMM d, yyyy")}</span>
                    </div>
                    <div className="pl-6">
                      <p className="font-semibold text-foreground">{note.title}</p>
                      <p className="text-xs whitespace-pre-wrap">{note.content}</p>
                    </div>
                </div>
              )
            ))}
          </>
        )}
      </div>
    );
  }
  return null;
};

const CustomDotWithNote = (props: any) => {
  const { cx, cy, payload } = props;
  if (payload.note && payload.note.length > 0) {
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

export default function PerformanceMetricsChart({ data, activeMetrics, onMetricToggle, chartView, onChartViewChange }: PerformanceMetricsChartProps) {
    const yAxisIds = {
        impressions: 'left',
        clicks: 'right',
        messages: 'right',
        ctr: 'percentage',
    };
    
    const aggregatedData = useMemo(() => {
        if (!data || data.length === 0) return [];
        const dataMap = new Map<string, any>();

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

            const existing = dataMap.get(key) || { date: key, impressions: 0, clicks: 0, messages: 0, note: [] };
            existing.impressions += item.impressions;
            existing.clicks += item.clicks;
            existing.messages += item.messages;
            if (item.note) {
                existing.note.push(...item.note);
            }
            dataMap.set(key, existing);
        });

        const result = Array.from(dataMap.values()).map(item => ({
            ...item,
            ctr: item.impressions > 0 ? (item.clicks / item.impressions) * 100 : 0,
        }));
        
        return result.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
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

    return (
        <Card>
            <CardHeader>
                 <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <CardTitle>Performance Metrics Trend</CardTitle>
                        <CardDescription>Monthly trends for key performance metrics.</CardDescription>
                    </div>
                     <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                        <Select value={chartView} onValueChange={(value) => onChartViewChange(value as ChartView)}>
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
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                            {Object.keys(chartConfig).map((metric) => (
                                <div key={metric} className="flex items-center gap-2">
                                    <Checkbox
                                        id={`performance-metric-${metric}`}
                                        checked={activeMetrics[metric as keyof typeof activeMetrics]}
                                        onCheckedChange={() => onMetricToggle(metric as keyof typeof activeMetrics)}
                                        style={{
                                            '--chart-color': chartConfig[metric as keyof typeof chartConfig].color,
                                        } as React.CSSProperties}
                                        className="data-[state=checked]:bg-[var(--chart-color)] data-[state=checked]:border-[var(--chart-color)] border-muted-foreground"
                                    />
                                    <Label htmlFor={`performance-metric-${metric}`} className="capitalize">
                                        {chartConfig[metric as keyof typeof chartConfig].label}
                                    </Label>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                    <LineChart data={aggregatedData} margin={{ top: 5, right: 40, left: 10, bottom: 5 }}>
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey="date"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            tickFormatter={tickFormatter}
                        />
                        <YAxis
                            yAxisId="left"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            tickFormatter={(value) => value > 1000 ? `${value/1000}k` : value}
                        />
                         <YAxis
                            yAxisId="right"
                            orientation="right"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                        />
                        <YAxis
                            yAxisId="percentage"
                            orientation="right"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            tickFormatter={(value) => `${value.toFixed(1)}%`}
                            className="translate-x-6"
                        />
                        <Tooltip
                            cursor={false}
                            content={<CustomTooltipWithNotes />}
                        />
                        {Object.keys(activeMetrics).filter(k => activeMetrics[k as keyof typeof activeMetrics]).map(key => (
                           <Line key={key} yAxisId={yAxisIds[key as keyof typeof yAxisIds]} dataKey={key} type="monotone" stroke={`var(--color-${key})`} strokeWidth={2} dot={<CustomDotWithNote />} />
                        ))}
                    </LineChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}
