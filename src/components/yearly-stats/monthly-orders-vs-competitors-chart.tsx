
"use client";

import { useMemo, useState } from 'react';
import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import {
  ChartContainer,
  ChartTooltipContent,
  type ChartConfig
} from "@/components/ui/chart";
import { type YearlyStatsData } from '@/lib/data/yearly-stats-data';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface MonthlyOrdersVsCompetitorsChartProps {
    allYearlyData: YearlyStatsData;
}

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const chartColors = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--primary))",
  "#FF5733", // Orange
  "#33FF57", // Green
  "#3357FF", // Blue
  "#FF33A1", // Pink
  "#A133FF", // Purple
  "#33FFA1", // Teal
];

const sanitizeKey = (key: string) => key.replace(/[^a-zA-Z0-9_]/g, '');

export default function MonthlyOrdersVsCompetitorsChart({ allYearlyData }: MonthlyOrdersVsCompetitorsChartProps) {
    const availableYears = useMemo(() => Object.keys(allYearlyData).map(Number).sort((a,b) => a - b), [allYearlyData]);
    const [isYoY, setIsYoY] = useState(false);
    const [startYear, setStartYear] = useState(availableYears[0]);
    const [endYear, setEndYear] = useState(availableYears[availableYears.length - 1]);
    
    const latestYear = availableYears[availableYears.length - 1];

    const { chartData, chartConfig, metricKeys, legendStats } = useMemo(() => {
        const legendData: Record<string, { label: string; total: number; avg: number; }> = {};
        
        if (isYoY) {
            const selectedYears = availableYears.filter(y => y >= startYear && y <= endYear);
            const data: { month: string; [key: string]: string | number }[] = months.map((month) => ({ month }));
            const config: ChartConfig = {};
            const keys: string[] = [];
            let colorIndex = 0;

            selectedYears.forEach(year => {
                const yearData = allYearlyData[year];
                
                // My Orders for the year
                const myOrdersKey = `myOrders_${year}`;
                keys.push(myOrdersKey);
                config[myOrdersKey] = { label: `My Orders ${year}`, color: chartColors[colorIndex % chartColors.length] };
                colorIndex++;
                const myTotal = yearData.monthlyOrders.reduce((s, c) => s + c, 0);
                legendData[myOrdersKey] = {
                    label: `My Orders ${year}`,
                    total: myTotal,
                    avg: Math.round(myTotal / 12)
                };
                yearData.monthlyOrders.forEach((val, monthIndex) => {
                    data[monthIndex][myOrdersKey] = val;
                });

                // Competitor Orders for the year
                yearData.competitors.forEach(competitor => {
                    const competitorKey = `${sanitizeKey(competitor.name)}_${year}`;
                    keys.push(competitorKey);
                    config[competitorKey] = { label: `${competitor.name} ${year}`, color: chartColors[colorIndex % chartColors.length] };
                    colorIndex++;
                    const competitorTotal = competitor.monthlyOrders.reduce((s, c) => s + c, 0);
                     legendData[competitorKey] = {
                        label: `${competitor.name} ${year}`,
                        total: competitorTotal,
                        avg: Math.round(competitorTotal / 12)
                    };
                    competitor.monthlyOrders.forEach((val, monthIndex) => {
                        data[monthIndex][competitorKey] = val;
                    });
                });
            });

            return { chartData: data, chartConfig: config, metricKeys: keys, legendStats: legendData };
        } else {
            // Single Year Competitor View
            const yearData = allYearlyData[latestYear];
            const myOrders = yearData.monthlyOrders;
            const competitors = yearData.competitors;
            
            const myOrdersKey = sanitizeKey('My Orders');
            const competitorKeys = competitors.map(c => sanitizeKey(c.name));
            
            const data = months.map((month, index) => {
                const entry: { month: string; [key: string]: string | number } = { month };
                entry[myOrdersKey] = myOrders[index];
                competitors.forEach((c) => {
                    entry[sanitizeKey(c.name)] = c.monthlyOrders[index];
                });
                return entry;
            });

            const config: ChartConfig = { [myOrdersKey]: { label: 'My Orders', color: chartColors[0] } };
            legendData[myOrdersKey] = { label: 'My Orders', total: yearData.myTotalYearlyOrders, avg: Math.round(yearData.myTotalYearlyOrders / 12) };

            competitors.forEach((c, i) => {
                const key = sanitizeKey(c.name);
                config[key] = { label: c.name, color: chartColors[(i + 1) % chartColors.length] };
                legendData[key] = { label: c.name, total: c.totalOrders, avg: Math.round(c.totalOrders / 12) };
            });

            return { chartData: data, chartConfig: config, metricKeys: [myOrdersKey, ...competitorKeys], legendStats: legendData };
        }
    }, [isYoY, startYear, endYear, allYearlyData, availableYears, latestYear]);
    
    const [activeMetrics, setActiveMetrics] = useState<Record<string, boolean>>({});

    // Effect to update active metrics when view changes
    useMemo(() => {
        setActiveMetrics(metricKeys.reduce((acc, key) => ({ ...acc, [key]: true }), {}));
    }, [metricKeys]);

    const handleMetricToggle = (metric: string) => {
        setActiveMetrics(prev => ({ ...prev, [metric]: !prev[metric] }));
    };

    const CustomLegend = (props: any) => {
      const { payload } = props;
      const formatNumber = (value: number) => value.toLocaleString();
      
      const activePayload = payload.filter((p: any) => activeMetrics[p.value]);

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
                            <span>Total: <span className="font-medium text-foreground/90">{formatNumber(stats.total)}</span></span>
                            <span>Avg: <span className="font-medium text-foreground/90">{formatNumber(stats.avg)}</span></span>
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
                        <Checkbox id="yoy-checkbox" checked={isYoY} onCheckedChange={(checked) => setIsYoY(!!checked)} />
                        <Label htmlFor="yoy-checkbox" className="font-semibold">Year-over-Year</Label>
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
                     <div>
                        <h4 className="font-semibold mb-2 mt-4">Display Lines</h4>
                        <p className="text-sm text-muted-foreground mb-4">Toggle lines on the graph.</p>
                        <ScrollArea className="h-36 rounded-md border p-2">
                            <div className="space-y-2">
                                {Object.entries(chartConfig).map(([metricKey, config]) => (
                                    <div key={metricKey} className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted/50">
                                        <Checkbox
                                            id={`metric-${metricKey}`}
                                            checked={!!activeMetrics[metricKey]}
                                            onCheckedChange={() => handleMetricToggle(metricKey)}
                                            style={{ '--chart-color': config.color } as React.CSSProperties}
                                            className="data-[state=checked]:bg-[var(--chart-color)] data-[state=checked]:border-[var(--chart-color)] border-muted-foreground"
                                        />
                                        <Label htmlFor={`metric-${metricKey}`} className="flex-1 cursor-pointer font-normal">
                                            {config.label}
                                        </Label>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>
                </div>
            </div>
            <div className="md:col-span-4">
                <ChartContainer config={chartConfig} className="h-[400px] w-full">
                    <LineChart data={chartData} margin={{ top: 20, right: 20, left: 10, bottom: 20 }}>
                        <CartesianGrid vertical={false} />
                        <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                        <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                        <Tooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                        <CustomLegend payload={Object.keys(chartConfig).map(key => ({ value: key, color: chartConfig[key].color }))} />
                        {Object.entries(activeMetrics).map(([key, isActive]) => 
                            isActive && (
                                <Line
                                    key={key}
                                    dataKey={key}
                                    type="monotone"
                                    strokeWidth={2}
                                    stroke={`var(--color-${key})`}
                                    dot={true}
                                />
                            )
                        )}
                    </LineChart>
                </ChartContainer>
            </div>
        </div>
    );
}
