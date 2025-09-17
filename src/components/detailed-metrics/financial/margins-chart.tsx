
"use client";

import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Dot } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import type { FinancialMetricTimeSeries } from '@/lib/services/analyticsService';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { BarChart2, BookText, LineChartIcon } from 'lucide-react';
import { format, parseISO, startOfWeek, startOfMonth, getQuarter, getYear } from "date-fns";
import { Separator } from '@/components/ui/separator';

const chartConfig = {
    profitMargin: { label: "Profit Margin (%)", color: "hsl(var(--chart-1))" },
    grossMargin: { label: "Gross Margin (%)", color: "hsl(var(--chart-2))" },
} satisfies ChartConfig;

type ChartView = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

const CustomTooltipWithNotes = ({ active, payload, label }: any) => {
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
                <span>{chartConfig[pld.dataKey as keyof typeof chartConfig]?.label}:</span>
              </div>
              <span className="ml-4 font-mono font-medium">
                {`${Number(pld.value).toFixed(2)}%`}
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

export default function MarginsChart({ timeSeries }: { timeSeries: FinancialMetricTimeSeries[] }) {
    const [chartType, setChartType] = useState<'bar' | 'line'>('line');
    const [chartView, setChartView] = useState<ChartView>('monthly');
    const [activeMetrics, setActiveMetrics] = useState({
        profitMargin: true,
        grossMargin: true,
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

            const existing = dataMap.get(key) || { date: key, count: 0, profitMargin: 0, grossMargin: 0, note: [] };
            existing.count++;
            existing.profitMargin += item.profitMargin;
            existing.grossMargin += item.grossMargin;
            if (item.note) {
                existing.note.push(...item.note);
            }
            dataMap.set(key, existing);
        });

        const result = Array.from(dataMap.values()).map(item => ({
            ...item,
            profitMargin: item.count > 0 ? item.profitMargin / item.count : 0,
            grossMargin: item.count > 0 ? item.grossMargin / item.count : 0,
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
    
    const Chart = chartType === 'bar' ? BarChart : LineChart;
    const ChartComponent = chartType === 'bar' ? Bar : Line;

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <CardTitle>Profitability Margins</CardTitle>
                        <CardDescription>Profit Margin and Gross Margin over time.</CardDescription>
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
                    {Object.keys(chartConfig).map(metric => (
                        <div key={metric} className="flex items-center gap-2">
                            <Checkbox id={`financial-${metric}`} checked={activeMetrics[metric as keyof typeof activeMetrics]} onCheckedChange={() => handleMetricToggle(metric as keyof typeof activeMetrics)} />
                            <Label htmlFor={`financial-${metric}`}>{chartConfig[metric as keyof typeof chartConfig].label}</Label>
                        </div>
                    ))}
                </div>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                    <Chart data={aggregatedData}>
                        <CartesianGrid vertical={false} />
                        <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={tickFormatter} />
                        <YAxis tickFormatter={(value) => `${value.toFixed(0)}%`} />
                        <Tooltip content={<CustomTooltipWithNotes />} />
                        <Legend />
                         {Object.keys(activeMetrics).filter(k => activeMetrics[k as keyof typeof activeMetrics]).map(key => (
                           <ChartComponent key={key} dataKey={key} fill={`var(--color-${key})`} stroke={`var(--color-${key})`} radius={chartType === 'bar' ? 4 : undefined} dot={chartType === 'line' ? <CustomDotWithNote /> : undefined} />
                        ))}
                    </Chart>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}
