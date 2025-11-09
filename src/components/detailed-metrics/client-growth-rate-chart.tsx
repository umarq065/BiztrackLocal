
"use client";

import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine, Dot } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { BarChart2, LineChartIcon, BookText } from 'lucide-react';
import { format, startOfWeek, startOfMonth, getQuarter, getYear, parseISO, eachDayOfInterval, endOfWeek, endOfMonth, endOfQuarter, endOfYear } from "date-fns";
import { type ClientDataPoint } from '@/lib/services/analyticsService';
import { Separator } from '../ui/separator';

const chartConfig = {
    growthRate: { label: "Client Growth (%)", color: "hsl(var(--chart-4))" },
} satisfies ChartConfig;

type ChartView = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

const calculateGrowth = (newClients?: number, clientsAtStart?: number) => {
    if (clientsAtStart === undefined || clientsAtStart === null) return 0;
    if (clientsAtStart === 0) {
        if (newClients === undefined || newClients === null || newClients === 0) return 0;
        return newClients > 0 ? 100 : 0;
    }
    if (newClients === undefined || newClients === null) return 0;
    return (newClients / clientsAtStart) * 100;
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
            const newClients = itemPayload?.newClients as number | undefined;
            const clientsAtStart = itemPayload?.clientsAtStart as number | undefined;
            
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
         <p className="text-xs text-muted-foreground">{`(New: ${payload[0].payload.newClients}, Start: ${payload[0].payload.clientsAtStart})`}</p>

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


export default function ClientGrowthRateChart({ timeSeries }: { timeSeries: ClientDataPoint[] }) {
    const [chartType, setChartType] = useState<'bar' | 'line'>('line');
    const [chartView, setChartView] = useState<ChartView>('monthly');

    const aggregatedData = useMemo(() => {
        if (!timeSeries || timeSeries.length === 0) {
            return [];
        }
        
        const dataByDate = new Map(timeSeries.map(item => [item.date, item]));
        const dates = Array.from(dataByDate.keys()).map(d => parseISO(`${d}T00:00:00`));
        const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
        const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
        
        let intervalDates: Date[] = [];
        let getIntervalKey: (date: Date) => string;

        switch (chartView) {
            case 'daily':
                intervalDates = eachDayOfInterval({ start: minDate, end: maxDate });
                getIntervalKey = (date) => format(date, 'yyyy-MM-dd');
                break;
            case 'weekly':
                intervalDates = eachDayOfInterval({ start: startOfWeek(minDate, { weekStartsOn: 1 }), end: endOfWeek(maxDate, { weekStartsOn: 1 }) });
                getIntervalKey = (date) => format(startOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd');
                break;
            case 'monthly':
                intervalDates = eachDayOfInterval({ start: startOfMonth(minDate), end: endOfMonth(maxDate) });
                getIntervalKey = (date) => format(startOfMonth(date), 'yyyy-MM-dd');
                break;
            case 'quarterly':
                 intervalDates = eachDayOfInterval({ start: startOfQuarter(minDate), end: endOfQuarter(maxDate) });
                 getIntervalKey = (date) => `${getYear(date)}-Q${getQuarter(date)}`;
                break;
            case 'yearly':
                intervalDates = eachDayOfInterval({ start: startOfYear(minDate), end: endOfYear(maxDate) });
                getIntervalKey = (date) => getYear(date).toString();
                break;
        }

        const aggregatedMap = new Map<string, { newClients: number; clientsAtStart?: number; notes: any[] }>();

        intervalDates.forEach(date => {
            const key = getIntervalKey(date);
            if (!aggregatedMap.has(key)) {
                aggregatedMap.set(key, { newClients: 0, notes: [] });
            }
        });

        // This is a bit tricky. We need the first `clientsAtStart` for the aggregated period.
        timeSeries.forEach(item => {
            const itemDate = parseISO(`${item.date}T00:00:00`);
            const key = getIntervalKey(itemDate);
            const entry = aggregatedMap.get(key);
            if (entry) {
                entry.newClients += item.newClients;
                if (entry.clientsAtStart === undefined) {
                    entry.clientsAtStart = item.clientsAtStart;
                }
                if (item.note) {
                    item.note.forEach(n => {
                        if (!entry.notes.some(existingNote => existingNote.title === n.title && existingNote.content === n.content)) {
                            entry.notes.push(n);
                        }
                    });
                }
            }
        });

        const sortedAggregatedData = Array.from(aggregatedMap.entries())
            .map(([date, data]) => ({ date, ...data }))
            .sort((a, b) => {
                if (chartView === 'quarterly' || chartView === 'yearly') return a.date.localeCompare(b.date);
                return new Date(a.date).getTime() - new Date(b.date).getTime()
            });

        return sortedAggregatedData.map((item) => {
            return {
                date: item.date,
                newClients: item.newClients,
                clientsAtStart: item.clientsAtStart,
                growthRate: calculateGrowth(item.newClients, item.clientsAtStart),
                note: item.notes,
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
                        <CardTitle>Client Growth Rate Trend</CardTitle>
                        <CardDescription>Percentage growth of new clients relative to the client base at the start of each period.</CardDescription>
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
