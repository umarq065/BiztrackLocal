
"use client";

import * as React from "react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts";
import {
  ChartContainer,
  ChartTooltipContent,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface ExpenseDistributionData {
  name: string;
  amount: number;
}

interface ExpenseDistributionBarChartProps {
  data: ExpenseDistributionData[];
}

const chartColors = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))", "hsl(var(--primary))"];

const ExpenseDistributionBarChart = ({ data }: ExpenseDistributionBarChartProps) => {
    
    const totalAmount = React.useMemo(() => {
        return data.reduce((acc, item) => acc + item.amount, 0)
    }, [data]);
    
    const chartData = React.useMemo(() => {
        const singleBarData: {[key: string]: number | string} = { name: "Expenses" };
        data.forEach(item => {
            singleBarData[item.name] = item.amount;
        });
        return [singleBarData];
    }, [data]);

    const chartConfig = React.useMemo(() => data.reduce((acc, item, index) => {
        acc[item.name] = { 
            label: `${item.name} (${((item.amount / totalAmount) * 100).toFixed(1)}%)`,
            color: chartColors[index % chartColors.length]
        };
        return acc;
    }, {} as ChartConfig), [data, totalAmount]);
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Expense Distribution</CardTitle>
                <CardDescription>A breakdown of your expenses by category for the selected period.</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className="w-full h-48">
                    <BarChart
                        layout="vertical"
                        data={chartData}
                        margin={{ top: 20, right: 0, left: 20, bottom: 20 }}
                        barSize={30}
                    >
                        <XAxis type="number" hide />
                        <YAxis type="category" dataKey="name" hide />
                        <Tooltip
                            cursor={false}
                            content={<ChartTooltipContent
                                formatter={(value, name) => [`$${Number(value).toFixed(2)}`, chartConfig[name as string].label]}
                                hideLabel
                            />}
                        />
                        <Legend
                            content={<ChartLegendContent />}
                            wrapperStyle={{
                                paddingTop: "20px"
                            }}
                        />
                        {Object.keys(chartConfig).map((key) => (
                             <Bar key={key} dataKey={key} stackId="a" fill={`var(--color-${key})`} layout="vertical" />
                        ))}
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
};

export default React.memo(ExpenseDistributionBarChart);
