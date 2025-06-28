
"use client";

import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from "@/components/ui/chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Order {
    date: string;
    amount: number;
    id: string;
}

interface ClientOrderHistoryChartProps {
    data: Order[];
}

const chartConfig = {
    amount: {
        label: "Order Amount",
        color: "hsl(var(--chart-1))",
    },
} satisfies ChartConfig;

export default function ClientOrderHistoryChart({ data }: ClientOrderHistoryChartProps) {
    const chartData = useMemo(() => {
        return data
            .map(order => ({
                ...order,
                dateObj: new Date(order.date),
            }))
            .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime())
            .map(order => ({
                ...order,
                dateLabel: order.dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            }));
    }, [data]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Order History Graph</CardTitle>
                <CardDescription>A visual representation of the client's orders over time.</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
                {chartData.length > 0 ? (
                    <ChartContainer config={chartConfig} className="h-[300px] w-full">
                        <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 50, left: 20 }}>
                            <CartesianGrid vertical={false} />
                            <XAxis
                                dataKey="dateLabel"
                                tickLine={false}
                                tickMargin={10}
                                axisLine={false}
                                angle={-45}
                                textAnchor="end"
                                interval={0}
                                height={60}
                            />
                            <YAxis
                                tickLine={false}
                                axisLine={false}
                                tickMargin={8}
                                tickFormatter={(value) => `$${value}`}
                            />
                            <Tooltip
                                cursor={{ fill: 'hsl(var(--muted))' }}
                                content={<ChartTooltipContent 
                                    formatter={(value) => [`$${(value as number).toFixed(2)}`, "Amount"]}
                                    labelFormatter={(label, payload) => {
                                        const order = payload?.[0]?.payload;
                                        if (!order) return label;
                                        return (
                                            <div>
                                                <div>{order.dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                                                <div className="text-xs text-muted-foreground">ID: {order.id}</div>
                                            </div>
                                        )
                                    }}
                                    indicator="dot" 
                                />}
                            />
                            <Bar dataKey="amount" fill="var(--color-amount)" radius={4} />
                        </BarChart>
                    </ChartContainer>
                ) : (
                    <div className="flex h-[300px] w-full items-center justify-center">
                        <p className="text-muted-foreground">No order data to display chart.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
