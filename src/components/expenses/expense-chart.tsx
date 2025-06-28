
"use client";

import * as React from "react";
import { Pie, PieChart, ResponsiveContainer, Tooltip, Cell, Legend } from "recharts";
import {
  ChartContainer,
  ChartTooltipContent,
  ChartTooltip,
  ChartLegend,
  ChartLegendContent,
  ChartConfig,
} from "@/components/ui/chart";

interface ExpenseChartData {
  name: string;
  amount: number;
  fill: string;
}

interface ExpenseChartProps {
  data: ExpenseChartData[];
}

export default function ExpenseChart({ data }: ExpenseChartProps) {
  const chartConfig = data.reduce((acc, item) => {
    acc[item.name] = { label: item.name, color: item.fill };
    return acc;
  }, {} as ChartConfig);

  const totalAmount = React.useMemo(() => {
    return data.reduce((acc, item) => acc + item.amount, 0)
  }, [data]);

  return (
    <ChartContainer
      config={chartConfig}
      className="mx-auto aspect-square max-h-[300px]"
    >
      <PieChart>
        <Tooltip
          cursor={false}
          content={<ChartTooltipContent
            formatter={(value) => {
                const percentage = totalAmount > 0 ? ((Number(value) / totalAmount) * 100).toFixed(1) : 0;
                return `$${Number(value).toFixed(2)} (${percentage}%)`
            }}
            nameKey="name"
            hideLabel
          />}
        />
        <Pie
          data={data}
          dataKey="amount"
          nameKey="name"
          innerRadius={60}
          strokeWidth={5}
        >
          {data.map((entry, index) => (
             <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
        </Pie>
        <ChartLegend
            content={<ChartLegendContent nameKey="name" />}
            className="-translate-y-[2px] flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
        />
      </PieChart>
    </ChartContainer>
  );
}
