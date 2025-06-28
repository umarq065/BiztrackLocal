
"use client";

import { useMemo } from "react";
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
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";

interface ExpenseTrendData {
  date: string;
  amount: number;
}

interface ExpenseTrendChartProps {
  data: ExpenseTrendData[];
  previousData: ExpenseTrendData[];
  showComparison: boolean;
  onShowComparisonChange: (checked: boolean) => void;
  chartView: string;
  onChartViewChange: (view: string) => void;
}

const chartConfig = {
  amount: {
    label: "Expenses",
    color: "hsl(var(--chart-1))",
  },
  previousAmount: {
    label: "Previous Period",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

export default function ExpenseTrendChart({ data, previousData, showComparison, onShowComparisonChange, chartView, onChartViewChange }: ExpenseTrendChartProps) {
  
  const chartData = useMemo(() => {
    return data.map((current, index) => ({
      date: current.date,
      amount: current.amount,
      previousAmount: previousData[index]?.amount ?? null,
    }));
  }, [data, previousData]);

  const tickFormatter = (value: string) => {
    try {
        switch (chartView) {
            case 'weekly':
                return `W/C ${format(new Date(value.replace(/-/g, '/')), "MMM d")}`;
            case 'monthly':
                const [year, month] = value.split('-');
                return format(new Date(Number(year), Number(month)), "MMM yyyy");
            case 'quarterly':
                return value;
            case 'yearly':
                return value;
            default: // daily
                return format(new Date(value.replace(/-/g, '/')), "MMM d");
        }
    } catch (e) {
        return value;
    }
  };

  if (!chartData || chartData.length === 0) {
    return (
        <Card>
            <CardHeader>
                 <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <CardTitle>Expense Trend</CardTitle>
                        <CardDescription>
                        A summary of your expenses for the selected period.
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-4">
                        <Select value={chartView} onValueChange={onChartViewChange}>
                            <SelectTrigger className="w-[120px]">
                                <SelectValue placeholder="Select view" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="daily">Daily</SelectItem>
                                <SelectItem value="weekly">Weekly</SelectItem>
                                <SelectItem value="monthly">Monthly</SelectItem>
                                <SelectItem value="quarterly">Quarterly</SelectItem>
                                <SelectItem value="yearly">Yearly</SelectItem>
                            </SelectContent>
                        </Select>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="compare-expenses" checked={showComparison} onCheckedChange={(checked) => onShowComparisonChange(!!checked)} />
                            <Label htmlFor="compare-expenses" className="text-sm font-normal">Compare</Label>
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex h-[300px] w-full items-center justify-center rounded-lg border">
                    <p className="text-muted-foreground">No expense data to display for the selected period.</p>
                </div>
            </CardContent>
        </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
                <CardTitle>Expense Trend</CardTitle>
                <CardDescription>
                  A summary of your expenses for the selected period.
                </CardDescription>
            </div>
            <div className="flex items-center gap-4">
                <Select value={chartView} onValueChange={onChartViewChange}>
                    <SelectTrigger className="w-[120px]">
                        <SelectValue placeholder="Select view" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                </Select>
                <div className="flex items-center space-x-2">
                    <Checkbox id="compare-expenses" checked={showComparison} onCheckedChange={(checked) => onShowComparisonChange(!!checked)} />
                    <Label htmlFor="compare-expenses" className="text-sm font-normal">Compare</Label>
                </div>
            </div>
        </div>
      </CardHeader>
      <CardContent className="pl-2">
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <LineChart
            accessibilityLayer
            data={chartData}
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
              tickFormatter={tickFormatter}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => `$${value > 1000 ? `${value / 1000}k` : value }`}
            />
            <Tooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dot" />}
            />
            <Line
              dataKey="amount"
              type="natural"
              stroke="var(--color-amount)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6 }}
            />
            {showComparison && (
                <Line
                    dataKey="previousAmount"
                    name="Previous Expenses"
                    type="natural"
                    stroke="var(--color-previousAmount)"
                    strokeWidth={2}
                    strokeDasharray="3 3"
                    dot={false}
                />
            )}
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
