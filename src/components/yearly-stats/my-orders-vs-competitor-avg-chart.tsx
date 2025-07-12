
"use client";

import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, LineChart, Line } from 'recharts';
import {
  ChartContainer,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
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

const chartConfig = {
  myOrders: { label: "My Orders", color: "hsl(var(--chart-1))" },
  competitorAvg: { label: "Competitor Avg.", color: "hsl(var(--chart-2))" },
} satisfies ChartConfig;

export default function MyOrdersVsCompetitorAvgChart({ myOrders, competitors }: MyOrdersVsCompetitorAvgChartProps) {
    const [chartType, setChartType] = useState<'bar' | 'line'>('bar');

    const chartData = useMemo(() => {
        return months.map((month, index) => {
            const competitorTotalForMonth = competitors.reduce((acc, curr) => acc + curr.monthlyOrders[index], 0);
            const competitorAvgForMonth = competitors.length > 0 ? competitorTotalForMonth / competitors.length : 0;
            return {
                month,
                myOrders: myOrders[index],
                competitorAvg: Math.round(competitorAvgForMonth),
            };
        });
    }, [myOrders, competitors]);

    const ChartTooltipContentCustom = (
        <ChartTooltipContent
            indicator="dot"
            labelClassName="font-semibold"
            nameKey="name"
        />
    );

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
                            <ChartLegend content={<ChartLegendContent />} />
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
                            <ChartLegend content={<ChartLegendContent />} />
                            <Line dataKey="myOrders" type="monotone" stroke="var(--color-myOrders)" strokeWidth={2} dot={true} />
                            <Line dataKey="competitorAvg" type="monotone" stroke="var(--color-competitorAvg)" strokeWidth={2} dot={true} />
                        </LineChart>
                    )}
                </ChartContainer>
            </CardContent>
        </Card>
    );
}
