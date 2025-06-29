
"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import { ChartContainer, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";

interface YearlyPerformanceChartProps {
    data: { month: string; revenue: number; profit: number }[];
    chartConfig: ChartConfig;
}

export default function YearlyPerformanceChart({ data, chartConfig }: YearlyPerformanceChartProps) {
  if (!data || data.length === 0) {
      return (
          <div className="flex h-[400px] w-full items-center justify-center rounded-lg border">
              <p className="text-muted-foreground">No data available for the selected year.</p>
          </div>
      );
  }
  
  return (
    <ChartContainer config={chartConfig} className="h-[400px] w-full">
      <BarChart data={data} accessibilityLayer>
          <CartesianGrid vertical={false} />
          <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
          />
          <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => `$${value / 1000}k`}
          />
          <Tooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dot" />}
              />
          <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} />
          <Bar dataKey="profit" fill="var(--color-profit)" radius={4} />
      </BarChart>
    </ChartContainer>
  );
}
