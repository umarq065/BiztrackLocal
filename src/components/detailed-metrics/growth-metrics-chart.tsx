
"use client";

import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Dot } from 'recharts';
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '../ui/separator';
import { BookText } from 'lucide-react';
import type { GrowthMetricTimeSeries } from '@/lib/services/analyticsService';

const chartConfig = {
    revenueGrowth: {
        label: "Revenue Growth",
        color: "hsl(var(--chart-1))",
    },
    profitGrowth: {
        label: "Profit Growth",
        color: "hsl(var(--chart-2))",
    },
    clientGrowth: {
        label: "Client Growth",
        color: "hsl(var(--chart-3))",
    },
    aovGrowth: {
        label: "AOV Growth",
        color: "hsl(var(--chart-4))",
    },
    highValueClientGrowth: {
        label: "High-Value Client Growth",
        color: "hsl(var(--chart-5))",
    },
    sourceGrowth: {
        label: "Source/Gig Growth",
        color: "hsl(var(--primary))",
    },
} satisfies ChartConfig;

interface GrowthMetricsChartProps {
    data: GrowthMetricTimeSeries[];
    activeMetrics: Record<string, boolean>;
    onMetricToggle: (metric: string) => void;
}

const CustomTooltip = ({ active, payload, label }: any) => {
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
                <span>{chartConfig[pld.dataKey as keyof typeof chartConfig]?.label}:</span>
              </div>
              <span className="ml-4 font-mono font-medium">{pld.value.toFixed(1)}%</span>
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

export default function GrowthMetricsChart({ data, activeMetrics, onMetricToggle }: GrowthMetricsChartProps) {
    return (
        <Card>
            <CardHeader>
                 <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <CardTitle>Growth Metrics Trend</CardTitle>
                        <CardDescription>Monthly growth trends for key metrics.</CardDescription>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                        {Object.keys(chartConfig).map((metric) => (
                            <div key={metric} className="flex items-center gap-2">
                                <Checkbox
                                    id={`growth-metric-${metric}`}
                                    checked={activeMetrics[metric as keyof typeof activeMetrics]}
                                    onCheckedChange={() => onMetricToggle(metric as keyof typeof activeMetrics)}
                                    style={{
                                        '--chart-color': chartConfig[metric as keyof typeof chartConfig].color,
                                    } as React.CSSProperties}
                                    className="data-[state=checked]:bg-[var(--chart-color)] data-[state=checked]:border-[var(--chart-color)] border-muted-foreground"
                                />
                                <Label htmlFor={`growth-metric-${metric}`} className="capitalize">
                                    {chartConfig[metric as keyof typeof chartConfig].label}
                                </Label>
                            </div>
                        ))}
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                    <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
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
                            tickFormatter={(value) => `${value}%`}
                        />
                        <Tooltip
                            cursor={false}
                            content={<CustomTooltip />}
                        />
                        {activeMetrics.revenueGrowth && <Line dataKey="revenueGrowth" type="monotone" stroke="var(--color-revenueGrowth)" strokeWidth={2} dot={<CustomDot />} />}
                        {activeMetrics.profitGrowth && <Line dataKey="profitGrowth" type="monotone" stroke="var(--color-profitGrowth)" strokeWidth={2} dot={<CustomDot />} />}
                        {activeMetrics.clientGrowth && <Line dataKey="clientGrowth" type="monotone" stroke="var(--color-clientGrowth)" strokeWidth={2} dot={<CustomDot />} />}
                        {activeMetrics.aovGrowth && <Line dataKey="aovGrowth" type="monotone" stroke="var(--color-aovGrowth)" strokeWidth={2} dot={<CustomDot />} />}
                        {activeMetrics.highValueClientGrowth && <Line dataKey="highValueClientGrowth" type="monotone" stroke="var(--color-highValueClientGrowth)" strokeWidth={2} dot={<CustomDot />} />}
                        {activeMetrics.sourceGrowth && <Line dataKey="sourceGrowth" type="monotone" stroke="var(--color-sourceGrowth)" strokeWidth={2} dot={<CustomDot />} />}
                    </LineChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}
