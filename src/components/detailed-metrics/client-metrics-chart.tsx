
"use client";

import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Dot } from 'recharts';
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '../ui/separator';
import { BookText } from 'lucide-react';

const chartData = [
  { month: "Jan", totalClients: 80, newClients: 20, retentionRate: 75, csat: 88 },
  { month: "Feb", totalClients: 90, newClients: 25, retentionRate: 78, csat: 90 },
  { month: "Mar", totalClients: 95, newClients: 15, retentionRate: 84, csat: 91, note: "Launched referral program." },
  { month: "Apr", totalClients: 105, newClients: 20, retentionRate: 81, csat: 93 },
  { month: "May", totalClients: 115, newClients: 22, retentionRate: 80, csat: 92 },
  { month: "Jun", totalClients: 125, newClients: 30, retentionRate: 85, csat: 92, note: "Onboarded major new client." },
];

const chartConfig = {
    totalClients: { label: "Total Clients", color: "hsl(var(--chart-1))" },
    newClients: { label: "New Clients", color: "hsl(var(--chart-2))" },
    retentionRate: { label: "Retention Rate (%)", color: "hsl(var(--chart-3))" },
    csat: { label: "CSAT (%)", color: "hsl(var(--chart-4))" },
} satisfies ChartConfig;

interface ClientMetricsChartProps {
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
              <span className="ml-4 font-mono font-medium">
                {typeof pld.dataKey === 'string' && (pld.dataKey.includes('Rate') || pld.dataKey.includes('csat')) ? `${pld.value}%` : pld.value}
              </span>
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

export default function ClientMetricsChart({ activeMetrics, onMetricToggle }: ClientMetricsChartProps) {
    return (
        <Card>
            <CardHeader>
                 <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <CardTitle>Client Metrics Trend</CardTitle>
                        <CardDescription>Monthly trends for key client metrics.</CardDescription>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                        {Object.keys(chartConfig).map((metric) => (
                            <div key={metric} className="flex items-center gap-2">
                                <Checkbox
                                    id={`client-metric-${metric}`}
                                    checked={activeMetrics[metric as keyof typeof activeMetrics]}
                                    onCheckedChange={() => onMetricToggle(metric as keyof typeof activeMetrics)}
                                    style={{
                                        '--chart-color': chartConfig[metric as keyof typeof chartConfig].color,
                                    } as React.CSSProperties}
                                    className="data-[state=checked]:bg-[var(--chart-color)] data-[state=checked]:border-[var(--chart-color)] border-muted-foreground"
                                />
                                <Label htmlFor={`client-metric-${metric}`} className="capitalize">
                                    {chartConfig[metric as keyof typeof chartConfig].label}
                                </Label>
                            </div>
                        ))}
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                    <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey="month"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                        />
                        <YAxis
                            yAxisId="left"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                        />
                        <YAxis
                            yAxisId="right"
                            orientation="right"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            tickFormatter={(value) => `${value}%`}
                        />
                        <Tooltip
                            cursor={false}
                            content={<CustomTooltip />}
                        />
                        {activeMetrics.totalClients && <Line yAxisId="left" dataKey="totalClients" type="step" stroke="var(--color-totalClients)" strokeWidth={2} dot={<CustomDot />} />}
                        {activeMetrics.newClients && <Line yAxisId="left" dataKey="newClients" type="step" stroke="var(--color-newClients)" strokeWidth={2} dot={<CustomDot />} />}
                        {activeMetrics.retentionRate && <Line yAxisId="right" dataKey="retentionRate" type="step" stroke="var(--color-retentionRate)" strokeWidth={2} dot={<CustomDot />} />}
                        {activeMetrics.csat && <Line yAxisId="right" dataKey="csat" type="step" stroke="var(--color-csat)" strokeWidth={2} dot={<CustomDot />} />}
                    </LineChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}
