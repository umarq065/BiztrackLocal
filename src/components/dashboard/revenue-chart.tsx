
"use client";

import { useState, useMemo } from "react";
import {
  Area,
  AreaChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  Dot,
} from "recharts";
import {
  ChartContainer,
  type ChartConfig,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { type RevenueByDay } from "@/lib/placeholder-data";
import { CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "../ui/separator";
import { BookText } from "lucide-react";

interface RevenueChartProps {
  data: RevenueByDay[];
  previousData: RevenueByDay[];
  dailyTarget?: number;
}

const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "hsl(var(--chart-1))",
  },
  previousRevenue: {
    label: "Previous Period",
    color: "hsl(var(--chart-2))",
  },
  target: {
    label: "Daily Target",
    color: "hsl(var(--chart-4))",
  }
} satisfies ChartConfig;

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const note = payload[0].payload.note;
    return (
      <div className="z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md">
        <p className="font-medium">{new Date(label).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric"})}</p>
        {payload.map((pld: any) => (
          pld.value ? (
            <div key={pld.dataKey} className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="mr-2 h-2.5 w-2.5 shrink-0 rounded-[2px]" style={{ backgroundColor: pld.color || pld.stroke || pld.fill }} />
                <span>{chartConfig[pld.dataKey as keyof typeof chartConfig].label}:</span>
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


export default function RevenueChart({ data, previousData, dailyTarget }: RevenueChartProps) {
  const [showComparison, setShowComparison] = useState(true);
  const [showTarget, setShowTarget] = useState(true);
  
  const combinedData = useMemo(() => {
    return data.map((current, index) => ({
      ...current,
      previousRevenue: previousData[index]?.revenue ?? null,
      target: dailyTarget,
    }));
  }, [data, previousData, dailyTarget]);
  
  return (
    <>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
                <CardTitle>Revenue Overview</CardTitle>
                <CardDescription>
                  A summary of your revenue for the selected period.
                </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1">
                <div className="flex items-center space-x-2">
                    <Checkbox id="show-target" checked={showTarget} onCheckedChange={(checked) => setShowTarget(!!checked)} />
                    <Label htmlFor="show-target" className="text-sm font-normal">Show Daily Target</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <Checkbox id="compare-revenue" checked={showComparison} onCheckedChange={(checked) => setShowComparison(!!checked)} />
                    <Label htmlFor="compare-revenue" className="text-sm font-normal">Compare to Previous Period</Label>
                </div>
            </div>
        </div>
      </CardHeader>
      <CardContent className="pl-2">
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <AreaChart
            accessibilityLayer
            data={combinedData}
            margin={{
              top: 5,
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
                const date = new Date(value);
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });
              }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => `$${value / 1000}k`}
            />
            <Tooltip
              cursor={false}
              content={<CustomTooltip />}
            />
            <defs>
                <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-revenue)" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="var(--color-revenue)" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="fillPreviousRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-previousRevenue)" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="var(--color-previousRevenue)" stopOpacity={0.1} />
                </linearGradient>
            </defs>

            {/* Render Area fills first (in the background) */}
            {showComparison && (
                <Area
                    dataKey="previousRevenue"
                    type="natural"
                    fill="url(#fillPreviousRevenue)"
                    fillOpacity={0.4}
                    strokeWidth={0}
                />
            )}
            <Area
              dataKey="revenue"
              type="natural"
              fill="url(#fillRevenue)"
              fillOpacity={0.4}
              strokeWidth={0}
            />

            {/* Render Lines on top of the fills */}
            {showComparison && (
                 <Line
                    dataKey="previousRevenue"
                    type="natural"
                    stroke="var(--color-previousRevenue)"
                    strokeWidth={2}
                    strokeDasharray="3 3"
                    dot={false}
                />
            )}
            <Line
              dataKey="revenue"
              type="natural"
              stroke="var(--color-revenue)"
              strokeWidth={2}
              dot={<CustomDot />}
            />
            {showTarget && dailyTarget !== undefined && (
              <Line
                dataKey="target"
                type="monotone"
                stroke="var(--color-target)"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
              />
            )}
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </>
  );
}
