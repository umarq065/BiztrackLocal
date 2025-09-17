
"use client";

import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Dot, ComposedChart } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import type { OrderCountTimeSeriesPoint } from '@/lib/services/analyticsService';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { BarChart2, BookText, LineChartIcon } from 'lucide-react';
import { format, parseISO, startOfWeek, startOfMonth, getQuarter, getYear, startOfYear } from "date-fns";
import { Separator } from '@/components/ui/separator';

const orderChartConfig = {
    total: { label: "Total Orders", color: "hsl(var(--chart-1))" },
    new: { label: "New Buyer Orders", color: "hsl(var(--chart-2))" },
    repeat: { label: "Repeat Buyer Orders", color: "hsl(var(--chart-3))" },
    cancelled: { label: "Cancelled Orders", color: "hsl(var(--destructive))" },
} satisfies ChartConfig;

const ratingChartConfig = {
    avgRating: { label: "Avg. Rating", color: "hsl(var(--chart-4))" },
} satisfies ChartConfig;

type ChartView = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';


const CustomTooltipWithNotes = ({ active, payload, label }: any, config: ChartConfig) => {
  if (active && payload && payload.length) {
    const notes = payload[0].payload.note;
    return (
      <div className="z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md max-w-sm">
        <p className="font-medium">{label}</p>
        {payload.map((pld: any) => (
          pld.value ? (
            <div key={pld.dataKey} className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="mr-2 h-2.5 w-2.5 shrink-0 rounded-[2px]" style={{ backgroundColor: pld.color || pld.stroke || pld.fill }} />
                <span>{config[pld.dataKey as keyof typeof config]?.label}:</span>
              </div>
              <span className="ml-4 font-mono font-medium">
                {pld.dataKey === 'avgRating' ? Number(pld.value).toFixed(2) : Number(pld.value).toLocaleString()}
              </span>
            </div>
          ) : null
        ))}
         {notes && notes.length > 0 && (
          <>
            <Separator className="my-2" />
            {notes.map((note: any, index: number) => (
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

export default function OrderMetricsChart({ timeSeries }: { timeSeries: OrderCountTimeSeriesPoint[] }) {
    const [chartType, setChartType] = useState<'bar' | 'line'>('line');
    const [chartView, setChartView] = useState<ChartView>('monthly');
    const [activeMetrics, setActiveMetrics] = useState({
        total: true,
        new: true,
        repeat: true,
        cancelled: true,
    });

    const handleMetricToggle = (metric: keyof typeof activeMetrics) => {
        setActiveMetrics(prev => ({ ...prev, [metric]: !prev[metric] }));
    };

    const aggregatedData = useMemo(() => {
        if (!timeSeries || timeSeries.length === 0) return [];
        const dataMap = new Map<string, any>();

        timeSeries.forEach(item => {
            const itemDate = parseISO(item.date);
            let key = '';
            
            switch(chartView) {
                case 'daily': key = item.date; break;
                case 'weekly': key = format(startOfWeek(itemDate, { weekStartsOn: 1 }), 'yyyy-MM-dd'); break;
                case 'monthly': key = format(startOfMonth(itemDate), 'yyyy-MM-dd'); break;
                case 'quarterly': key = `${getYear(itemDate)}-Q${getQuarter(itemDate)}`; break;
                case 'yearly': key = getYear(itemDate).toString(); break;
            }

            const existing = dataMap.get(key) || { date: key, total: 0, new: 0, repeat: 0, cancelled: 0, ratingSum: 0, ratingCount: 0, note: [] };
            existing.total += item.total;
            existing.new += item.new;
            existing.repeat += item.repeat;
            existing.cancelled += item.cancelled;
            if (item.avgRating > 0) {
                existing.ratingSum += item.avgRating * item.total;
                existing.ratingCount += item.total;
            }
            if (item.note) {
                existing.note.push(...item.note);
            }
            dataMap.set(key, existing);
        });

        const result = Array.from(dataMap.values()).map(item => ({
            ...item,
            avgRating: item.ratingCount > 0 ? item.ratingSum / item.ratingCount : 0,
        }));
        
        return result.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
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
    
    const ChartComponent = chartType === 'bar' ? Bar : Line;
    const BaseChart = chartType === 'bar' ? BarChart : LineChart;
    
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <CardTitle>Order Volume Trends</CardTitle>
                            <CardDescription>Total, new, repeat, and cancelled orders over time.</CardDescription>
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
                     <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm mt-4">
                        {Object.keys(orderChartConfig).map(metric => (
                            <div key={metric} className="flex items-center gap-2">
                                <Checkbox id={`order-metric-${metric}`} checked={activeMetrics[metric as keyof typeof activeMetrics]} onCheckedChange={() => handleMetricToggle(metric as keyof typeof activeMetrics)} />
                                <Label htmlFor={`order-metric-${metric}`}>{orderChartConfig[metric as keyof typeof orderChartConfig].label}</Label>
                            </div>
                        ))}
                    </div>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={orderChartConfig} className="h-[300px] w-full">
                        <ComposedChart data={aggregatedData}>
                            <CartesianGrid vertical={false} />
                            <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={tickFormatter} />
                            <YAxis yAxisId="left" orientation="left" stroke="hsl(var(--foreground))" />
                            <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--destructive))" />
                            <Tooltip content={(props) => CustomTooltipWithNotes(props, orderChartConfig)} />
                            <Legend />
                            {Object.keys(activeMetrics).filter(k => activeMetrics[k as keyof typeof activeMetrics]).map(key => (
                                <ChartComponent 
                                    key={key} 
                                    dataKey={key} 
                                    yAxisId={key === 'cancelled' ? 'right' : 'left'}
                                    fill={orderChartConfig[key as keyof typeof orderChartConfig].color} 
                                    stroke={orderChartConfig[key as keyof typeof orderChartConfig].color}
                                    type="monotone"
                                    dot={chartType === 'line' ? <CustomDotWithNote /> : undefined}
                                />
                            ))}
                        </ComposedChart>
                    </ChartContainer>
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle>Average Rating Trend</CardTitle>
                    <CardDescription>Average order ratings over time.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={ratingChartConfig} className="h-[200px] w-full">
                        <LineChart data={aggregatedData}>
                            <CartesianGrid vertical={false} />
                            <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={tickFormatter} />
                            <YAxis domain={[0, 5]} tickFormatter={(val) => val.toFixed(1)} />
                            <Tooltip content={(props) => CustomTooltipWithNotes(props, ratingChartConfig)} />
                            <Line dataKey="avgRating" type="monotone" stroke="var(--color-avgRating)" strokeWidth={2} dot={<CustomDotWithNote />} />
                        </LineChart>
                    </ChartContainer>
                </CardContent>
            </Card>
        </div>
    )
}
