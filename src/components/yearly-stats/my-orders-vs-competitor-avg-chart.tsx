
"use client";

import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, LineChart, Line } from 'recharts';
import {
  ChartContainer,
  ChartTooltipContent,
  ChartLegend,
  type ChartConfig
} from "@/components/ui/chart";
import { CompetitorYearlyData } from '@/lib/data/yearly-stats-data';
import { Button } from '@/components/ui/button';
import { BarChart2, LineChartIcon } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

interface MyOrdersVsCompetitorAvgChartProps {
    myOrders: number[];
    competitors: CompetitorYearlyData[];
}

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function MyOrdersVsCompetitorAvgChart({ myOrders, competitors }: MyOrdersVsCompetitorAvgChartProps) {
    const [chartType, setChartType] = useState<'bar' | 'line'>('bar');

    const { chartData, chartConfig, myOrdersTotal, myOrdersAvg, competitorOrdersTotal, competitorOrdersAvg } = useMemo(() => {
        const data = months.map((month, index) => {
            const competitorTotalForMonth = competitors.reduce((acc, curr) => acc + curr.monthlyOrders[index], 0);
            const competitorAvgForMonth = competitors.length > 0 ? competitorTotalForMonth / competitors.length : 0;
            return {
                month,
                myOrders: myOrders[index],
                competitorAvg: Math.round(competitorAvgForMonth),
            };
        });
        
        const totalMyOrders = myOrders.reduce((acc, curr) => acc + curr, 0);
        const myOrdersAverage = myOrders.length > 0 ? Math.round(totalMyOrders / myOrders.length) : 0;
        
        const totalCompetitorOrders = data.reduce((acc, curr) => acc + curr.competitorAvg, 0);
        const competitorAverage = data.length > 0 ? Math.round(totalCompetitorOrders / data.length) : 0;
        
        const config: ChartConfig = {
          myOrders: { label: "My Orders", color: "hsl(var(--chart-1))" },
          competitorAvg: { label: "Competitor Avg.", color: "hsl(var(--chart-2))" },
        };
        
        return { 
            chartData: data, 
            chartConfig: config, 
            myOrdersTotal: totalMyOrders,
            myOrdersAvg: myOrdersAverage, 
            competitorOrdersTotal: totalCompetitorOrders,
            competitorOrdersAvg: competitorAverage 
        };

    }, [myOrders, competitors]);

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
        
        const statsMap = {
            myOrders: { total: myOrdersTotal, avg: myOrdersAvg, label: "My Orders" },
            competitorAvg: { total: competitorOrdersTotal, avg: competitorOrdersAvg, label: "Competitor Avg." },
        };

        return (
            <div className="flex justify-center gap-4 pt-4 flex-wrap">
            {payload.map((entry: any, index: number) => {
                const key = entry.value as keyof typeof statsMap;
                const stats = statsMap[key];

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
            <CardHeader className="flex flex-row items-start justify-between">
                <div>
                    <CardTitle>My Orders vs. Average Competitor Orders (Monthly)</CardTitle>
                    <CardDescription>A comparison of your monthly orders against the average of your competitors.</CardDescription>
                </div>
                <div className="flex items-center gap-1">
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
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
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
                            <Bar dataKey="myOrders" fill="var(--color-myOrders)" radius={4} />
                            <Bar dataKey="competitorAvg" fill="var(--color-competitorAvg)" radius={4} />
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
                            <Line dataKey="myOrders" type="monotone" stroke="var(--color-myOrders)" strokeWidth={2} dot={true} />
                            <Line dataKey="competitorAvg" type="monotone" stroke="var(--color-competitorAvg)" strokeWidth={2} dot={true} />
                        </LineChart>
                    )}
                </ChartContainer>
            </CardContent>
        </Card>
    );
}
