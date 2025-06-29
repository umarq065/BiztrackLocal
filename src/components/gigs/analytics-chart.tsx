"use client";

import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  ChartContainer,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

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
} satisfies ChartConfig;

export default function GigAnalyticsChart({ data, activeMetrics, showComparison }: GigAnalyticsChartProps) {
  if (!data || data.length === 0) {
      return (
          <div className="flex h-[300px] w-full items-center justify-center">
              <p className="text-muted-foreground">No data to display chart for the selected period.</p>
          </div>
      );
  }
  return (
    <ChartContainer config={chartConfig} className="h-[300px] w-full">
      <LineChart
        accessibilityLayer
        data={data}
        margin={{
          top: 20,
          right: 10,
          left: 10,
          bottom: 0,
        }}
      >
        <CartesianGrid vertical={false} />
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
              timeZone: "UTC",
            });
          }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
        />
        <Tooltip
          cursor={false}
          content={<ChartTooltipContent indicator="dot" />}
        />
        {activeMetrics.impressions && (
            <Line
            dataKey="impressions"
            type="natural"
            stroke="var(--color-impressions)"
            strokeWidth={2}
            dot={false}
            />
        )}
        {showComparison && activeMetrics.impressions && <Line dataKey="prevImpressions" type="natural" stroke="var(--color-impressions)" strokeWidth={2} dot={false} strokeDasharray="3 3"/>}
        
        {activeMetrics.clicks && (
            <Line
            dataKey="clicks"
            type="natural"
            stroke="var(--color-clicks)"
            strokeWidth={2}
            dot={false}
            />
        )}
        {showComparison && activeMetrics.clicks && <Line dataKey="prevClicks" type="natural" stroke="var(--color-clicks)" strokeWidth={2} dot={false} strokeDasharray="3 3"/>}

        {activeMetrics.messages && (
            <Line
            dataKey="messages"
            type="natural"
            stroke="var(--color-messages)"
            strokeWidth={2}
            dot={false}
            />
        )}
        {showComparison && activeMetrics.messages && <Line dataKey="prevMessages" type="natural" stroke="var(--color-messages)" strokeWidth={2} dot={false} strokeDasharray="3 3"/>}

        {activeMetrics.orders && (
            <Line
            dataKey="orders"
            type="natural"
            stroke="var(--color-orders)"
            strokeWidth={2}
            dot={false}
            />
        )}
        {showComparison && activeMetrics.orders && <Line dataKey="prevOrders" type="natural" stroke="var(--color-orders)" strokeWidth={2} dot={false} strokeDasharray="3 3"/>}
      </LineChart>
    </ChartContainer>
  );
}
