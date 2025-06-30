
"use client";

import { useState } from "react";
import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import { ChartContainer, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

const chartData = [
  { month: "Jan", totalRevenue: 18000, totalExpenses: 8000, netProfit: 10000, cac: 120, cltv: 1800, aov: 110 },
  { month: "Feb", totalRevenue: 22000, totalExpenses: 9500, netProfit: 12500, cac: 135, cltv: 2100, aov: 115 },
  { month: "Mar", totalRevenue: 25000, totalExpenses: 11000, netProfit: 14000, cac: 130, cltv: 2200, aov: 120 },
  { month: "Apr", totalRevenue: 30000, totalExpenses: 12000, netProfit: 18000, cac: 110, cltv: 2500, aov: 125 },
  { month: "May", totalRevenue: 28000, totalExpenses: 11500, netProfit: 16500, cac: 115, cltv: 2400, aov: 122 },
  { month: "Jun", totalRevenue: 45231, totalExpenses: 10543, netProfit: 34688, cac: 150, cltv: 2540, aov: 131 },
];

const highValueChartConfig = {
    totalRevenue: { label: "Total Revenue", color: "hsl(var(--chart-1))" },
    totalExpenses: { label: "Total Expenses", color: "hsl(var(--chart-2))" },
    netProfit: { label: "Net Profit", color: "hsl(var(--chart-3))" },
} satisfies ChartConfig;

const customerValueChartConfig = {
    cltv: { label: "CLTV", color: "hsl(var(--chart-5))" },
    cac: { label: "CAC", color: "hsl(var(--chart-4))" },
    aov: { label: "AOV", color: "hsl(var(--primary))" },
} satisfies ChartConfig;

export default function FinancialValueChart() {
    const [activeHighValueMetrics, setActiveHighValueMetrics] = useState({
        totalRevenue: true,
        totalExpenses: true,
        netProfit: true,
    });
    
    const [activeCustomerValueMetrics, setActiveCustomerValueMetrics] = useState({
        cltv: true,
        cac: true,
        aov: true,
    });

    const handleHighValueToggle = (metric: keyof typeof activeHighValueMetrics) => {
        setActiveHighValueMetrics((prev) => ({ ...prev, [metric]: !prev[metric] }));
    };

    const handleCustomerValueToggle = (metric: keyof typeof activeCustomerValueMetrics) => {
        setActiveCustomerValueMetrics((prev) => ({ ...prev, [metric]: !prev[metric] }));
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <CardTitle>Key Financials</CardTitle>
                            <CardDescription>Monthly trends for high-value financial metrics.</CardDescription>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                            {Object.entries(highValueChartConfig).map(([metric, config]) => (
                                <div key={metric} className="flex items-center gap-2">
                                    <Checkbox
                                        id={`metric-${metric}`}
                                        checked={activeHighValueMetrics[metric as keyof typeof activeHighValueMetrics]}
                                        onCheckedChange={() => handleHighValueToggle(metric as keyof typeof activeHighValueMetrics)}
                                        style={{ '--chart-color': config.color } as React.CSSProperties}
                                        className="data-[state=checked]:bg-[var(--chart-color)] data-[state=checked]:border-[var(--chart-color)] border-muted-foreground"
                                    />
                                    <Label htmlFor={`metric-${metric}`} className="capitalize">{config.label}</Label>
                                </div>
                            ))}
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={highValueChartConfig} className="h-[300px] w-full">
                        <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                            <CartesianGrid vertical={false} />
                            <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                            <YAxis tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => `$${value / 1000}k`} />
                            <Tooltip cursor={false} content={<ChartTooltipContent indicator="dot" valueFormatter={(value) => `$${value.toLocaleString()}`} />} />
                            {activeHighValueMetrics.totalRevenue && <Line dataKey="totalRevenue" type="monotone" stroke="var(--color-totalRevenue)" strokeWidth={2} dot={true} />}
                            {activeHighValueMetrics.totalExpenses && <Line dataKey="totalExpenses" type="monotone" stroke="var(--color-totalExpenses)" strokeWidth={2} dot={true} />}
                            {activeHighValueMetrics.netProfit && <Line dataKey="netProfit" type="monotone" stroke="var(--color-netProfit)" strokeWidth={2} dot={true} />}
                        </LineChart>
                    </ChartContainer>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <CardTitle>Customer Value Metrics</CardTitle>
                            <CardDescription>Monthly trends for customer acquisition and value metrics.</CardDescription>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                            {Object.entries(customerValueChartConfig).map(([metric, config]) => (
                                <div key={metric} className="flex items-center gap-2">
                                    <Checkbox
                                        id={`metric-${metric}`}
                                        checked={activeCustomerValueMetrics[metric as keyof typeof activeCustomerValueMetrics]}
                                        onCheckedChange={() => handleCustomerValueToggle(metric as keyof typeof activeCustomerValueMetrics)}
                                        style={{'--chart-color': config.color} as React.CSSProperties}
                                        className="data-[state=checked]:bg-[var(--chart-color)] data-[state=checked]:border-[var(--chart-color)] border-muted-foreground"
                                    />
                                    <Label htmlFor={`metric-${metric}`} className="capitalize">{config.label}</Label>
                                </div>
                            ))}
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={customerValueChartConfig} className="h-[300px] w-full">
                        <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                            <CartesianGrid vertical={false} />
                            <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                            <YAxis tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => `$${value}`} />
                            <Tooltip cursor={false} content={<ChartTooltipContent indicator="dot" valueFormatter={(value) => `$${value.toLocaleString()}`} />} />
                            {activeCustomerValueMetrics.cltv && <Line dataKey="cltv" type="monotone" stroke="var(--color-cltv)" strokeWidth={2} dot={true} />}
                            {activeCustomerValueMetrics.cac && <Line dataKey="cac" type="monotone" stroke="var(--color-cac)" strokeWidth={2} dot={true} />}
                            {activeCustomerValueMetrics.aov && <Line dataKey="aov" type="monotone" stroke="var(--color-aov)" strokeWidth={2} dot={true} />}
                        </LineChart>
                    </ChartContainer>
                </CardContent>
            </Card>
        </div>
    );
}
