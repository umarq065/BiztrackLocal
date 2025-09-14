

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
import { format, parse, startOfWeek, startOfMonth, getQuarter, getYear, startOfQuarter, startOfYear, endOfWeek, endOfMonth, endOfQuarter, endOfYear } from "date-fns";

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
    const note = payload[0].payload.note;
    return (
      <div className="z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md">
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
        {note && (
          <>
            <Separator className="my-2" />
            <div className="flex items-start gap-2 text-muted-foreground">
              <BookText className="size-4 shrink-0 mt-0.5" />
              <p className="font-medium">{note}</p>
            </div>
          </>
        )}
      </div>
    );
  }
  return null;
};

const CustomDot = (props: any) => {
  const { cx, cy, payload } = props;
  if (payload.note) {
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

type ChartView = 'monthly' | 'quarterly' | 'yearly';

export default function GrowthMetricsChart({ data, activeMetrics, onMetricToggle }: GrowthMetricsChartProps) {
    const [chartType, setChartType] = useState<'line' | 'bar'>('line');
    const [chartView, setChartView] = useState<ChartView>('monthly');

    const aggregatedData = useMemo(() => {
        if (!data || data.length === 0) return [];
        const dataMap = new Map<string, any>();
        
        data.forEach(item => {
            const itemDate = parse(item.month, 'MMM', new Date());

            if (isNaN(itemDate.getTime())) return;

            let key = '';
            switch(chartView) {
                case 'quarterly': key = `Q${getQuarter(itemDate)} ${getYear(itemDate)}`; break;
                case 'yearly': key = getYear(itemDate).toString(); break;
                default: key = item.month; break; // monthly
            }

            const existing = dataMap.get(key) || { month: key, count: 0 };
            Object.keys(chartConfig).forEach(metricKey => {
                const itemValue = item[metricKey as keyof GrowthMetricTimeSeries] || 0;
                existing[metricKey] = (existing[metricKey] || 0) + (typeof itemValue === 'number' ? itemValue : 0);
            });
            existing.count++;
            dataMap.set(key, existing);
        });
        
        // Average the growth rates for quarterly/yearly views
        dataMap.forEach((value, key) => {
             if (value.count > 1) {
                Object.keys(chartConfig).forEach(metricKey => {
                    if (value[metricKey]) {
                        value[metricKey] /= value.count;
                    }
                });
             }
        });

        const result = Array.from(dataMap.values());
        
        if (chartView === 'monthly') return result;
        if (chartView === 'yearly') return result.sort((a,b) => a.month.localeCompare(b.month));
        
        // Sort quarters correctly
        return result.sort((a, b) => {
            const [aQ, aY] = a.month.split(' ');
            const [bQ, bY] = b.month.split(' ');
            if (aY !== bY) return aY.localeCompare(bY);
            return aQ.localeCompare(bQ);
        });

    }, [data, chartView]);

    const tickFormatter = (value: string) => {
        try {
            switch (chartView) {
                case 'quarterly': return value;
                case 'yearly': return value;
                default: return value; // Monthly
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
                            <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={tickFormatter} />
                            <YAxis tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => `${value}%`} />
                            <Tooltip cursor={false} content={<CustomTooltip />} />
                            {Object.keys(activeMetrics).filter(k => activeMetrics[k as keyof typeof activeMetrics]).map(key => (
                                <Line key={key} dataKey={key} stroke={`var(--color-${key})`} strokeWidth={2} dot={<CustomDot />} />
                            ))}
                        </LineChart>
                    ) : (
                        <BarChart data={aggregatedData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                            <CartesianGrid vertical={false} />
                            <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={tickFormatter} />
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
