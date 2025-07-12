
"use client";

import { useMemo } from 'react';
import { Pie, PieChart, Cell } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig
} from "@/components/ui/chart";
import { CompetitorYearlyData } from '@/lib/data/yearly-stats-data';

interface TotalYearlyOrdersDistributionChartProps {
    myOrders: number;
    competitors: CompetitorYearlyData[];
}

const chartColors = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export default function TotalYearlyOrdersDistributionChart({ myOrders, competitors }: TotalYearlyOrdersDistributionChartProps) {
    
    const { chartData, chartConfig, totalOrders } = useMemo(() => {
        const data = [
            { name: "My Orders", value: myOrders, color: chartColors[0] },
            ...competitors.map((c, i) => ({
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

    }, [myOrders, competitors]);

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
                <Pie data={chartData} dataKey="value" nameKey="name" innerRadius={60} strokeWidth={5}>
                    {chartData.map((entry) => (
                        <Cell key={`cell-${entry.name}`} fill={entry.color} />
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

