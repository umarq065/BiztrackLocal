
"use client";

import { useMemo } from 'react';
import { Pie, PieChart, Cell, Tooltip } from 'recharts';
import {
  ChartContainer,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig
} from "@/components/ui/chart";
import { type SingleYearData } from '@/lib/data/yearly-stats-data';

interface TotalYearlyOrdersDistributionChartProps {
    yearData: SingleYearData;
}

const chartColors = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export default function TotalYearlyOrdersDistributionChart({ yearData }: TotalYearlyOrdersDistributionChartProps) {
    
    const { chartData, chartConfig, totalOrders } = useMemo(() => {
        if (!yearData) return { chartData: [], chartConfig: {}, totalOrders: 0 };
        const { myTotalYearlyOrders, competitors } = yearData;
        const data = [
            { name: "My Orders", value: myTotalYearlyOrders, color: chartColors[0] },
            ...(competitors || []).map((c, i) => ({
                name: c.name,
                value: c.totalOrders,
                color: chartColors[(i + 1) % chartColors.length]
            }))
        ];
        
        const config: ChartConfig = data.reduce((acc, item) => {
            acc[item.name] = { label: item.name, color: item.color };
            return acc;
        }, {} as ChartConfig);

        const total = data.reduce((acc, curr) => acc + curr.value, 0);

        return { chartData: data, chartConfig: config, totalOrders: total };

    }, [yearData]);

    const CustomLegend = (props: any) => {
        const { payload } = props;
        return (
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 pt-4">
                {payload.map((entry: any, index: number) => {
                    const percentage = totalOrders > 0 ? ((entry.payload.value / totalOrders) * 100).toFixed(1) : 0;
                    return (
                        <div key={`item-${index}`} className="flex items-center space-x-2 text-sm">
                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
                            <span className="text-muted-foreground">{entry.value}:</span>
                            <span className="font-semibold">{percentage}%</span>
                        </div>
                    );
                })}
            </div>
        );
    }

    if (!yearData) {
        return <div className="flex h-[300px] w-full items-center justify-center">Loading...</div>;
    }

    return (
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <PieChart>
                <Tooltip
                    cursor={false}
                    content={<ChartTooltipContent
                        hideLabel
                        formatter={(value) => {
                            const percentage = totalOrders > 0 ? ((Number(value) / totalOrders) * 100).toFixed(1) : 0;
                            return `${Number(value).toLocaleString()} orders (${percentage}%)`;
                        }}
                    />}
                />
                <Pie data={chartData} dataKey="value" nameKey="name" strokeWidth={5}>
                    {chartData.map((entry) => (
                        <Cell key={`cell-${entry.name}`} fill={entry.color} />
                    ))}
                </Pie>
                 <ChartLegend
                    content={<CustomLegend />}
                />
            </PieChart>
        </ChartContainer>
    );
}
