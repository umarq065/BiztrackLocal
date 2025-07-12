
"use client";

import { useMemo, useState } from 'react';
import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import {
  ChartContainer,
  ChartTooltipContent,
  type ChartConfig,
  ChartLegend,
  ChartLegendContent
} from "@/components/ui/chart";
import { YearlyStatsData } from '@/lib/data/yearly-stats-data';
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

    const { chartData, chartConfig, metricKeys } = useMemo(() => {
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
                yearData.monthlyOrders.forEach((val, monthIndex) => {
                    data[monthIndex][myOrdersKey] = val;
                });

                // Competitor Orders for the year
                yearData.competitors.forEach(competitor => {
                    const competitorKey = `${sanitizeKey(competitor.name)}_${year}`;
                    keys.push(competitorKey);
                    config[competitorKey] = { label: `${competitor.name} ${year}`, color: chartColors[colorIndex % chartColors.length] };
                    colorIndex++;
                    competitor.monthlyOrders.forEach((val, monthIndex) => {
                        data[monthIndex][competitorKey] = val;
                    });
                });
            });

            return { chartData: data, chartConfig: config, metricKeys: keys };
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
            competitors.forEach((c, i) => {
                config[sanitizeKey(c.name)] = { label: c.name, color: chartColors[(i + 1) % chartColors.length] };
            });

            return { chartData: data, chartConfig: config, metricKeys: [myOrdersKey, ...competitorKeys] };
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
                        <ScrollArea className="h-48 rounded-md border p-2">
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
                        <ChartLegend content={<ChartLegendContent />} />
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
