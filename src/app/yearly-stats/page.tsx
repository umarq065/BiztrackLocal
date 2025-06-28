"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from "@/components/ui/chart";

const yearlyData = {
    "2023": [
        { month: 'Jan', revenue: 35000, profit: 22000 },
        { month: 'Feb', revenue: 38000, profit: 25000 },
        { month: 'Mar', revenue: 42000, profit: 28000 },
        { month: 'Apr', revenue: 40000, profit: 26000 },
        { month: 'May', revenue: 45000, profit: 30000 },
        { month: 'Jun', revenue: 48000, profit: 32000 },
        { month: 'Jul', revenue: 50000, profit: 34000 },
        { month: 'Aug', revenue: 47000, profit: 31000 },
        { month: 'Sep', revenue: 52000, profit: 36000 },
        { month: 'Oct', revenue: 55000, profit: 38000 },
        { month: 'Nov', revenue: 58000, profit: 40000 },
        { month: 'Dec', revenue: 62000, profit: 45000 },
    ],
    "2022": [
        { month: 'Jan', revenue: 28000, profit: 18000 },
        { month: 'Feb', revenue: 30000, profit: 20000 },
        { month: 'Mar', revenue: 33000, profit: 22000 },
        { month: 'Apr', revenue: 31000, profit: 20000 },
        { month: 'May', revenue: 35000, profit: 24000 },
        { month: 'Jun', revenue: 37000, profit: 25000 },
        { month: 'Jul', revenue: 39000, profit: 27000 },
        { month: 'Aug', revenue: 36000, profit: 24000 },
        { month: 'Sep', revenue: 41000, profit: 28000 },
        { month: 'Oct', revenue: 43000, profit: 30000 },
        { month: 'Nov', revenue: 45000, profit: 31000 },
        { month: 'Dec', revenue: 48000, profit: 34000 },
    ],
    "2021": [
        { month: 'Jan', revenue: 20000, profit: 12000 },
        { month: 'Feb', revenue: 22000, profit: 14000 },
        { month: 'Mar', revenue: 25000, profit: 16000 },
        { month: 'Apr', revenue: 23000, profit: 14000 },
        { month: 'May', revenue: 27000, profit: 18000 },
        { month: 'Jun', revenue: 29000, profit: 19000 },
        { month: 'Jul', revenue: 31000, profit: 21000 },
        { month: 'Aug', revenue: 28000, profit: 18000 },
        { month: 'Sep', revenue: 33000, profit: 22000 },
        { month: 'Oct', revenue: 35000, profit: 24000 },
        { month: 'Nov', revenue: 37000, profit: 25000 },
        { month: 'Dec', revenue: 40000, profit: 28000 },
    ],
};


export default function YearlyStatsPage() {
    const data = yearlyData["2023"];
    const chartConfig = {
        revenue: {
            label: "Revenue",
            color: "hsl(var(--chart-1))",
        },
        profit: {
            label: "Profit",
            color: "hsl(var(--chart-2))",
        },
    } satisfies ChartConfig;

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center">
        <h1 className="font-headline text-lg font-semibold md:text-2xl">
          Yearly Statistics
        </h1>
        <div className="ml-auto">
          <Select defaultValue="2023">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select Year" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 10 }, (_, i) => 2021 + i).map((year) => (
                <SelectItem key={year} value={String(year)}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Yearly Performance for 2023</CardTitle>
          <CardDescription>
            Revenue and profit overview for the selected year.
          </CardDescription>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>
    </main>
  );
}
