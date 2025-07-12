
"use client";

import { useMemo } from 'react';
import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import {
  ChartContainer,
  ChartTooltipContent,
  ChartLegend,
  type ChartConfig
} from "@/components/ui/chart";
import { MonthlyFinancials } from '@/lib/data/yearly-stats-data';

interface MonthlyRevenueVsTargetChartProps {
    monthlyFinancials: MonthlyFinancials[];
    monthlyTargetRevenue: number[];
}

const chartConfig = {
  revenue: { label: "Actual Revenue", color: "hsl(var(--chart-1))" },
  target: { label: "Target Revenue", color: "hsl(var(--chart-5))" },
} satisfies ChartConfig;

export default function MonthlyRevenueVsTargetChart({ monthlyFinancials, monthlyTargetRevenue }: MonthlyRevenueVsTargetChartProps) {

    const { chartData, totalRevenue, totalTarget } = useMemo(() => {
        const data = monthlyFinancials.map((data, index) => ({
            month: data.month,
            revenue: data.revenue,
            target: monthlyTargetRevenue[index],
        }));

        const totalRev = data.reduce((acc, curr) => acc + curr.revenue, 0);
        const totalTarg = data.reduce((acc, curr) => acc + curr.target, 0);

        return { chartData: data, totalRevenue: totalRev, totalTarget: totalTarg };
    }, [monthlyFinancials, monthlyTargetRevenue]);

    const CustomLegend = (props: any) => {
      const { payload } = props;
      const formatCurrency = (value: number) => `$${value.toLocaleString()}`;
      
      const statsMap = {
          revenue: { total: totalRevenue },
          target: { total: totalTarget },
      }

      return (
        <div className="flex justify-center gap-6 pt-4">
          {payload.map((entry: any, index: number) => {
            const key = entry.value as keyof typeof statsMap;
            const stats = statsMap[key];

            return (
                <div key={`item-${index}`} className="flex items-center space-x-2 text-sm">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="text-muted-foreground">{entry.payload.label}:</span>
                  <span className="font-semibold">{formatCurrency(stats.total)} (Total)</span>
                </div>
            );
          })}
        </div>
      );
    }

    return (
        <ChartContainer config={chartConfig} className="h-[400px] w-full">
            <LineChart data={chartData} margin={{ top: 20, right: 20, left: 10, bottom: 20 }}>
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
                    tickFormatter={(value) => `$${value / 1000}k`}
                />
                <Tooltip
                    cursor={false}
                    content={<ChartTooltipContent
                        indicator="dot"
                        valueFormatter={(value) => `$${Number(value).toLocaleString()}`}
                    />}
                />
                <ChartLegend content={<CustomLegend />} />
                <Line
                    dataKey="revenue"
                    type="monotone"
                    stroke="var(--color-revenue)"
                    strokeWidth={2}
                    dot={true}
                />
                <Line
                    dataKey="target"
                    type="monotone"
                    stroke="var(--color-target)"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                />
            </LineChart>
        </ChartContainer>
    );
}
