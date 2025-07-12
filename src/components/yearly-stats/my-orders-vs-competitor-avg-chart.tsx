
"use client";

import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, LineChart, Line } from 'recharts';
import {
  ChartContainer,
  ChartTooltipContent,
  ChartLegend,
  type ChartConfig
} from "@/components/ui/chart";
import { type YearlyStatsData } from '@/lib/data/yearly-stats-data';
import { Button } from '@/components/ui/button';
import { BarChart2, LineChartIcon } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface MyOrdersVsCompetitorAvgChartProps {
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
];

const sanitizeKey = (key: string) => key.replace(/[^a-zA-Z0-9_]/g, '');

export default function MyOrdersVsCompetitorAvgChart({ allYearlyData }: MyOrdersVsCompetitorAvgChartProps) {
    const [chartType, setChartType] = useState<'bar' | 'line'>('bar');
    const availableYears = useMemo(() => Object.keys(allYearlyData).map(Number).sort((a,b) => a - b), [allYearlyData]);
    const [isYoY, setIsYoY] = useState(false);
    const [startYear, setStartYear] = useState(availableYears[0]);
    const [endYear, setEndYear] = useState(availableYears[availableYears.length - 1]);
    
    const latestYear = availableYears[availableYears.length - 1];

    const { chartData, chartConfig, legendStats } = useMemo(() => {
        const legendData: Record<string, { label: string; total: number; avg: number; }> = {};
        const config: ChartConfig = {};
        let colorIndex = 0;
        
        const data: { month: string; [key: string]: string | number }[] = months.map((month) => ({ month }));

        if (isYoY) {
            const selectedYears = availableYears.filter(y => y >= startYear && y <= endYear);
            
            selectedYears.forEach(year => {
                const yearData = allYearlyData[year];
                const myOrdersKey = sanitizeKey(`myOrders_${year}`);
                const competitorAvgKey = sanitizeKey(`competitorAvg_${year}`);

                // My Orders for the year
                config[myOrdersKey] = { label: `My Orders ${year}`, color: chartColors[colorIndex % chartColors.length] };
                colorIndex++;
                yearData.monthlyOrders.forEach((val, monthIndex) => {
                    data[monthIndex][myOrdersKey] = val;
                });
                const myOrdersTotal = yearData.monthlyOrders.reduce((s,c) => s + c, 0);
                legendData[myOrdersKey] = {
                    label: `My Orders ${year}`,
                    total: myOrdersTotal,
                    avg: Math.round(myOrdersTotal / 12),
                };

                // Competitor Avg for the year
                config[competitorAvgKey] = { label: `Competitor Avg. ${year}`, color: chartColors[colorIndex % chartColors.length] };
                colorIndex++;
                let totalCompetitorOrdersForYear = 0;
                yearData.competitors.forEach(competitor => {
                    totalCompetitorOrdersForYear += competitor.totalOrders;
                });
                const avgCompetitorOrdersPerMonth = totalCompetitorOrdersForYear / 12 / yearData.competitors.length;
                
                for(let i=0; i<12; i++){
                    const competitorTotalForMonth = yearData.competitors.reduce((acc, curr) => acc + curr.monthlyOrders[i], 0);
                    const competitorAvgForMonth = yearData.competitors.length > 0 ? competitorTotalForMonth / yearData.competitors.length : 0;
                    data[i][competitorAvgKey] = Math.round(competitorAvgForMonth);
                }
                const competitorAvgTotal = data.reduce((s,c) => s + (c[competitorAvgKey] as number), 0);
                legendData[competitorAvgKey] = {
                    label: `Competitor Avg. ${year}`,
                    total: competitorAvgTotal,
                    avg: Math.round(competitorAvgTotal / 12),
                };
            });
        } else {
            // Single Year View
            const yearData = allYearlyData[latestYear];
            const myOrdersKey = 'myOrders';
            const competitorAvgKey = 'competitorAvg';

            config[myOrdersKey] = { label: 'My Orders', color: chartColors[0] };
            config[competitorAvgKey] = { label: 'Competitor Avg.', color: chartColors[1] };

            months.forEach((month, index) => {
                const competitorTotalForMonth = yearData.competitors.reduce((acc, curr) => acc + curr.monthlyOrders[index], 0);
                const competitorAvgForMonth = yearData.competitors.length > 0 ? competitorTotalForMonth / yearData.competitors.length : 0;
                data[index][myOrdersKey] = yearData.monthlyOrders[index];
                data[index][competitorAvgKey] = Math.round(competitorAvgForMonth);
            });

            const myOrdersTotal = yearData.myTotalYearlyOrders;
            const competitorAvgTotal = data.reduce((s, c) => s + (c.competitorAvg as number), 0);
            
            legendData[myOrdersKey] = {
                label: 'My Orders',
                total: myOrdersTotal,
                avg: Math.round(myOrdersTotal / 12),
            };
            legendData[competitorAvgKey] = {
                label: 'Competitor Avg.',
                total: competitorAvgTotal,
                avg: Math.round(competitorAvgTotal / 12),
            };
        }

        return { chartData: data, chartConfig: config, legendStats: legendData };
    }, [isYoY, startYear, endYear, allYearlyData, availableYears, latestYear]);

    const ChartTooltipContentCustom = (
        <ChartTooltipContent
            indicator="dot"
            labelClassName="font-semibold"
            nameKey="name"
        />
    );

    const CustomLegend = (props: any) => {
      const { payload } = props;
      const formatNumber = (value: number) => value.toLocaleString();

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
        <Card className="lg:col-span-2">
            <CardHeader className="flex flex-col items-start justify-between gap-y-4 md:flex-row md:items-center">
                <div>
                    <CardTitle>My Orders vs. Average Competitor Orders (Monthly)</CardTitle>
                    <CardDescription>A comparison of your monthly orders against the average of your competitors.</CardDescription>
                </div>
                <div className="flex items-center gap-1">
                    <div className="flex items-center space-x-2">
                        <Checkbox id="yoy-avg-checkbox" checked={isYoY} onCheckedChange={(checked) => setIsYoY(!!checked)} />
                        <Label htmlFor="yoy-avg-checkbox" className="font-normal text-sm">YoY</Label>
                    </div>
                     {isYoY && (
                        <>
                           <Select value={String(startYear)} onValueChange={(v) => setStartYear(Number(v))}>
                                <SelectTrigger className="w-[80px] h-9"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {availableYears.map(y => <SelectItem key={y} value={String(y)} disabled={y > endYear}>{y}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <span className="text-muted-foreground">-</span>
                             <Select value={String(endYear)} onValueChange={(v) => setEndYear(Number(v))}>
                                <SelectTrigger className="w-[80px] h-9"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {availableYears.map(y => <SelectItem key={y} value={String(y)} disabled={y < startYear}>{y}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </>
                    )}
                    <Button
                        variant={chartType === 'bar' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setChartType('bar')}
                        aria-label="Switch to Bar Chart"
                    >
                        <BarChart2 className="h-4 w-4" />
                        <span className="ml-2 hidden sm:inline">Bar</span>
                    </Button>
                    <Button
                        variant={chartType === 'line' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setChartType('line')}
                        aria-label="Switch to Line Chart"
                    >
                        <LineChartIcon className="h-4 w-4" />
                        <span className="ml-2 hidden sm:inline">Line</span>
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className="w-full min-h-[400px]">
                    {chartType === 'bar' ? (
                        <BarChart
                            data={chartData}
                            margin={{ top: 20, right: 20, left: 10, bottom: 5 }}
                        >
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
                            />
                            <Tooltip
                                cursor={false}
                                content={ChartTooltipContentCustom}
                            />
                            <ChartLegend content={<CustomLegend />} />
                            {Object.keys(chartConfig).map(key => (
                                <Bar key={key} dataKey={key} fill={`var(--color-${key})`} radius={4} />
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
                            />
                            <Tooltip
                                cursor={false}
                                content={ChartTooltipContentCustom}
                            />
                            <ChartLegend content={<CustomLegend />} />
                            {Object.keys(chartConfig).map(key => (
                                <Line key={key} dataKey={key} type="monotone" stroke={`var(--color-${key})`} strokeWidth={2} dot={true} />
                            ))}
                        </LineChart>
                    )}
                </ChartContainer>
            </CardContent>
        </Card>
    );
}
