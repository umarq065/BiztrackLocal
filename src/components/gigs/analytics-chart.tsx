"use client";

import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Dot,
} from "recharts";
import * as React from "react";
import {
  ChartContainer,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { format, parseISO } from "date-fns";
import { BookText } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface AnalyticsData {
  date: string;
  impressions: number;
  clicks: number;
  messages: number;
  orders: number;
  prevImpressions?: number;
  prevClicks?: number;
  prevMessages?: number;
  prevOrders?: number;
  ctr?: number;
  prevCtr?: number;
  note?: { title: string; content: string; date: Date | string }[];
}

interface GigAnalyticsChartProps {
  data: AnalyticsData[];
  activeMetrics: Record<string, boolean>;
  showComparison: boolean;
}

const chartConfig = {
  impressions: {
    label: "Impressions",
    color: "hsl(var(--chart-1))",
  },
  clicks: {
    label: "Clicks",
    color: "hsl(var(--chart-2))",
  },
  messages: {
    label: "Messages",
    color: "hsl(var(--chart-3))",
  },
  orders: {
    label: "Orders",
    color: "hsl(var(--chart-4))",
  },
  ctr: {
    label: "CTR",
    color: "hsl(var(--chart-5))",
  },
  prevImpressions: {
    label: "Prev. Impressions",
    color: "hsl(var(--chart-1))",
  },
  prevClicks: {
    label: "Prev. Clicks",
    color: "hsl(var(--chart-2))",
  },
  prevMessages: {
    label: "Prev. Messages",
    color: "hsl(var(--chart-3))",
  },
  prevOrders: {
    label: "Prev. Orders",
    color: "hsl(var(--chart-4))",
  },
  prevCtr: {
    label: "Prev. CTR",
    color: "hsl(var(--chart-5))",
  },
} satisfies ChartConfig;

const CustomTooltipWithNotes = ({ active, payload, label, hoveredChart, currentChart, activeMetrics }: any) => {
  if (active && payload && payload.length && hoveredChart === currentChart) {
    const data = payload[0].payload;
    const notes = data.note;

    return (
      <div className="z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md max-w-sm">
        <p className="font-medium">{label}</p>
        {Object.keys(activeMetrics).map((metricKey) => {
          if (!activeMetrics[metricKey]) return null;
          const config = chartConfig[metricKey as keyof typeof chartConfig];
          const value = data[metricKey];

          if (value === undefined) return null;

          return (
            <div key={metricKey} className="flex items-center justify-between gap-4">
              <div className="flex items-center">
                <span className="mr-2 h-2.5 w-2.5 shrink-0 rounded-[2px]" style={{ backgroundColor: config?.color }} />
                <span>{config?.label}:</span>
              </div>
              <span className="ml-4 font-mono font-medium">
                {metricKey === 'ctr' ? `${value.toFixed(2)}%` : value.toLocaleString()}
              </span>
            </div>
          );
        })}
        {notes && notes.length > 0 && (
          <>
            <Separator className="my-2" />
            {notes.map((note: any, index: number) => (
              <div key={index} className="flex flex-col items-start gap-1 text-muted-foreground mt-1">
                <div className="flex items-center gap-2">
                  <BookText className="size-4 shrink-0 text-primary" />
                  <span className="font-semibold text-foreground">{format(new Date(note.date), "MMM d, yyyy")}</span>
                </div>
                <div className="pl-6">
                  <p className="font-semibold text-foreground">{note.title}</p>
                  <p className="text-xs whitespace-pre-wrap">{note.content}</p>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    );
  }
  return null;
};

const CustomDotWithNote = (props: any) => {
  const { cx, cy, payload } = props;
  if (payload.note && payload.note.length > 0) {
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

export default function GigAnalyticsChart({ data, activeMetrics, showComparison }: GigAnalyticsChartProps) {
  const [hoveredChart, setHoveredChart] = React.useState<string | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="flex h-[300px] w-full items-center justify-center">
        <p className="text-muted-foreground">No data to display chart for the selected period.</p>
      </div>
    );
  }

  const metrics = [
    { key: 'impressions', label: 'Impressions', color: 'var(--color-impressions)' },
    { key: 'clicks', label: 'Clicks', color: 'var(--color-clicks)' },
    { key: 'messages', label: 'Messages', color: 'var(--color-messages)' },
    { key: 'orders', label: 'Orders', color: 'var(--color-orders)' },
    { key: 'ctr', label: 'CTR', color: 'var(--color-ctr)' },
  ] as const;

  const visibleMetrics = metrics.filter(m => activeMetrics[m.key]);

  return (
    <div className="grid grid-cols-1 gap-4">
      {visibleMetrics.map((metric, index) => {
        const isLast = index === visibleMetrics.length - 1;

        return (
          <div
            key={metric.key}
            className="h-[200px] w-full"
            onMouseEnter={() => setHoveredChart(metric.key)}
            onMouseLeave={() => setHoveredChart(null)}
          >
            <h3 className="text-sm font-medium mb-2" style={{ color: metric.color }}>{metric.label}</h3>
            <ChartContainer config={chartConfig} className="h-full w-full">
              <LineChart
                accessibilityLayer
                data={data}
                margin={{
                  top: 5,
                  right: 10,
                  left: 10,
                  bottom: 0,
                }}
                syncId="gig-analytics"
              >
                <CartesianGrid vertical={false} strokeDasharray="3 3" strokeOpacity={0.2} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => {
                    const date = new Date(value.replace(/-/g, "/"));
                    return date.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    });
                  }}
                  hide={!isLast}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  width={40}
                />
                <Tooltip
                  cursor={{ stroke: 'white', strokeOpacity: 0.2 }}
                  content={
                    <CustomTooltipWithNotes
                      hoveredChart={hoveredChart}
                      currentChart={metric.key}
                      activeMetrics={activeMetrics}
                    />
                  }
                />
                <Line
                  dataKey={metric.key}
                  type="linear"
                  stroke={metric.color}
                  strokeWidth={2}
                  dot={<CustomDotWithNote />}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                />
                {showComparison && (
                  <Line
                    dataKey={`prev${metric.key.charAt(0).toUpperCase() + metric.key.slice(1)}`}
                    type="linear"
                    stroke={metric.color}
                    strokeWidth={2}
                    dot={false}
                    strokeDasharray="3 3"
                    strokeOpacity={0.5}
                  />
                )}
              </LineChart>
            </ChartContainer>
          </div>
        );
      })}
    </div>
  );
}
