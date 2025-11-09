
"use client";

import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine, Dot } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { BarChart2, LineChartIcon, BookText } from 'lucide-react';
import { format, startOfWeek, startOfMonth, getQuarter, getYear, parseISO } from "date-fns";
import { type RevenueDataPoint } from '@/lib/services/analyticsService';
import { Separator } from '../ui/separator';

const chartConfig = {
    growthRate: { label: "Revenue Growth (%)", color: "hsl(var(--chart-1))" },
} satisfies ChartConfig;

type ChartView = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

const calculateGrowth = (current?: number, previous?: number) => {
    if (previous === undefined || previous === null) return 0;
    if (previous === 0) {
        if (current === undefined || current === null || current === 0) return 0;
        return current > 0 ? 100 : -100;
    }
    if (current === undefined || current === null) return -100;
    return ((current - previous) / previous) * 100;
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

const CustomTooltipWithNotes = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const notes = payload[0].payload.note;
    return (
      <div className="z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md max-w-sm">
        <p className="font-medium">{label}</p>
         {payload.map((pld: any) => {
            const { payload: itemPayload } = pld;
            const revenue = itemPayload?.value as number | undefined;
            const prevRevenue = itemPayload?.previousValue as number | undefined;
            
            return (
                <div key={pld.dataKey} className="flex items-center justify-between">
                    <div className="flex items-center">
                        <span className="mr-2 h-2.5 w-2.5 shrink-0 rounded-[2px]" style={{ backgroundColor: pld.color || pld.stroke || pld.fill }} />
                        <span>{chartConfig[pld.dataKey as keyof typeof chartConfig]?.label}:</span>
                    </div>
                    <span className="ml-4 font-mono font-medium">{`${Number(pld.value).toFixed(2)}%`}</span>
                </div>
            )
         })}
         <p className="text-xs text-muted-foreground">{`(Current: $${payload[0].payload.value?.toFixed(0)}, Prev: $${payload[0].payload.previousValue?.toFixed(0)})`}</p>

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


export default function GrowthMetricsChart({ timeSeries }: { timeSeries: {date: string; value: number, note?: any[]}[] }) {
    const [chartType, setChartType] = useState<'bar' | 'line'>('bar');
    const [chartView, setChartView] = useState<ChartView>('monthly');

    const aggregatedData = useMemo(() => {
        if (!timeSeries || timeSeries.length === 0) {
            return [];
        }

        const aggregate = (data: {date: string; value: number, note?: any[]}[], view: ChartView) => {
            const map = new Map<string, { value: number; notes: any[] }>();
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
                
                const existing = map.get(key) || { value: 0, notes: [] };
                existing.value += item.value;
                if (item.note) {
                    existing.notes.push(...item.note);
                }

                map.set(key, existing);
            });
            return Array.from(map.entries())
                        .map(([date, data]) => ({ date, value: data.value, note: data.notes }))
                        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        };

        const currentAggregated = aggregate(timeSeries, chartView);
        
        return currentAggregated.map((item, index) => {
            const previousItem = index > 0 ? currentAggregated[index - 1] : { value: undefined };
            return {
                date: item.date,
                value: item.value,
                previousValue: previousItem?.value,
                growthRate: calculateGrowth(item.value, previousItem?.value),
                note: item.note,
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
                        <CardTitle>Revenue Growth Trend</CardTitle>
                        <CardDescription>Percentage growth of revenue compared to the previous interval.</CardDescription>
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
                        <Tooltip content={<CustomTooltipWithNotes />} />
                        <Legend />
                        <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                         <ChartComponent 
                            dataKey="growthRate" 
                            fill="var(--color-growthRate)" 
                            stroke="var(--color-growthRate)" 
                            radius={chartType === 'bar' ? 4 : undefined} 
                            dot={chartType === 'line' ? <CustomDotWithNote /> : undefined}
                        />
                    </Chart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}
