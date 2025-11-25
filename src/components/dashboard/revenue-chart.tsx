
"use client";

import { useState, useMemo, useCallback, memo } from "react";
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
import {
  ChartContainer,
  type ChartConfig,
} from "@/components/ui/chart";
import { type RevenueByDay } from "@/lib/placeholder-data";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "../ui/separator";
import { BookText } from "lucide-react";

interface RevenueChartProps {
  data: RevenueByDay[];
  previousData: RevenueByDay[];
  requiredDailyRevenue: number;
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
  requiredDailyRevenue: {
    label: "Req. Daily Revenue",
    color: "hsl(var(--chart-5))",
  },
} satisfies ChartConfig;

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const note = payload[0].payload.note;
    return (
      <div className="z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md">
        <p className="font-medium">{new Date(label).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
        {payload.map((pld: any) => (
          pld.value ? (
            <div key={pld.dataKey} className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="mr-2 h-2.5 w-2.5 shrink-0 rounded-[2px]" style={{ backgroundColor: pld.color || pld.stroke || pld.fill }} />
                <span>{chartConfig[pld.dataKey as keyof typeof chartConfig]?.label}:</span>
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


const RevenueChartComponent = ({ data, previousData, requiredDailyRevenue }: RevenueChartProps) => {
  const [showComparison, setShowComparison] = useState(true);

  const combinedData = useMemo(() => {
    return data.map((current, index) => ({
      ...current,
      previousRevenue: previousData[index]?.revenue ?? null,
      requiredDailyRevenue,
    }));
  }, [data, previousData, requiredDailyRevenue]);

  return (
    <Card className="border-border bg-card backdrop-blur-md">
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="text-card-foreground">Revenue Overview</CardTitle>
            <CardDescription className="text-muted-foreground">
              A summary of your revenue for the selected period.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="compare-revenue"
                checked={showComparison}
                onCheckedChange={(checked) => setShowComparison(!!checked)}
                className="border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
              />
              <Label htmlFor="compare-revenue" className="text-sm font-normal text-muted-foreground">Compare to Previous Period</Label>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pl-2">
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <LineChart
            accessibilityLayer
            data={combinedData}
            margin={{
              top: 5,
              right: 10,
              left: 10,
              bottom: 0,
            }}
          >
            <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
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
              stroke="hsl(var(--muted-foreground))"
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => {
                if (value >= 1000) return `$${value / 1000}k`;
                return `$${value}`;
              }}
              stroke="hsl(var(--muted-foreground))"
            />
            <Tooltip
              cursor={{ stroke: 'hsl(var(--border))' }}
              content={<CustomTooltip />}
            />
            <Line
              dataKey="requiredDailyRevenue"
              type="monotone"
              stroke="hsl(var(--chart-5))"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              name="Req. Daily Revenue"
            />
            {showComparison && (
              <Line
                dataKey="previousRevenue"
                type="natural"
                stroke="hsl(var(--muted-foreground))"
                strokeWidth={2}
                strokeDasharray="3 3"
                dot={false}
                strokeOpacity={0.5}
              />
            )}
            <Line
              dataKey="revenue"
              type="natural"
              stroke="hsl(var(--chart-1))"
              strokeWidth={3}
              dot={<CustomDot />}
              activeDot={{ r: 6, strokeWidth: 0, fill: 'hsl(var(--chart-1))' }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

export default memo(RevenueChartComponent);
