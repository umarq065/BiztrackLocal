
"use client";

import { useState } from "react";
import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Dot } from 'recharts';
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from "../ui/separator";
import { BookText } from "lucide-react";
import type { FinancialMetricTimeSeries } from "@/lib/services/analyticsService";

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

interface FinancialValueChartProps {
  data: FinancialMetricTimeSeries[];
}

const CustomTooltip = ({ active, payload, label, config }: any) => {
  if (active && payload && payload.length) {
    const note = payload[0].payload.note;
    return (
      <div className="z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md">
        <p className="font-medium">{label}</p>
        {payload.map((pld: any) => (
          pld.value ? (
            <div key={pld.dataKey} className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="mr-2 h-2.5 w-2.5 shrink-0 rounded-[2px]" style={{ backgroundColor: pld.color || pld.stroke || pld.fill }} />
                <span>{config[pld.dataKey as keyof typeof config]?.label}:</span>
              </div>
              <span className="ml-4 font-mono font-medium">${pld.value.toLocaleString()}</span>
            </div>
          ) : null
        ))}
        {note && (
          <>
            <Separator className="my-2" />
            <div className="flex items-start gap-2 text-muted-foreground">
              <BookText className="size-4 shrink-0 mt-0.5" />
              <p className="font-medium">{note}</p>
            </div>
          </>
        )}
      </div>
    );
  }
  return null;
};

const CustomDot = (props: any) => {
  const { cx, cy, payload } = props;
  if (payload.note) {
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

export default function FinancialValueChart({ data }: FinancialValueChartProps) {
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
                        <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                            <CartesianGrid vertical={false} />
                            <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                            <YAxis tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => `$${value / 1000}k`} />
                            <Tooltip cursor={false} content={<CustomTooltip config={highValueChartConfig} />} />
                            {activeHighValueMetrics.totalRevenue && <Line dataKey="totalRevenue" type="monotone" stroke="var(--color-totalRevenue)" strokeWidth={2} dot={<CustomDot />} />}
                            {activeHighValueMetrics.totalExpenses && <Line dataKey="totalExpenses" type="monotone" stroke="var(--color-totalExpenses)" strokeWidth={2} dot={<CustomDot />} />}
                            {activeHighValueMetrics.netProfit && <Line dataKey="netProfit" type="monotone" stroke="var(--color-netProfit)" strokeWidth={2} dot={<CustomDot />} />}
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
                        <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                            <CartesianGrid vertical={false} />
                            <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                            <YAxis tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => `$${value}`} />
                            <Tooltip cursor={false} content={<CustomTooltip config={customerValueChartConfig} />} />
                            {activeCustomerValueMetrics.cltv && <Line dataKey="cltv" type="monotone" stroke="var(--color-cltv)" strokeWidth={2} dot={<CustomDot />} />}
                            {activeCustomerValueMetrics.cac && <Line dataKey="cac" type="monotone" stroke="var(--color-cac)" strokeWidth={2} dot={<CustomDot />} />}
                            {activeCustomerValueMetrics.aov && <Line dataKey="aov" type="monotone" stroke="var(--color-aov)" strokeWidth={2} dot={<CustomDot />} />}
                        </LineChart>
                    </ChartContainer>
                </CardContent>
            </Card>
        </div>
    );
}
