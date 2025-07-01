
"use client"

import { RadialBar, RadialBarChart, ResponsiveContainer, PolarAngleAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface PerformanceRadialChartProps {
    performance: number
}

export function PerformanceRadialChart({
    performance,
}: PerformanceRadialChartProps) {

  const data = [{ name: 'performance', value: performance, fill: 'url(#performance-gradient)' }];

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <CardTitle>Performance vs Goals</CardTitle>
        <CardDescription>Your progress towards your monthly revenue target.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-grow flex-col items-center justify-center gap-4 py-2">
        <div className="relative h-[140px] w-[140px]">
            <ResponsiveContainer width="100%" height="100%">
                 <RadialBarChart
                    data={data}
                    innerRadius="80%"
                    outerRadius="100%"
                    startAngle={90}
                    endAngle={-270}
                    barSize={12}
                >
                    <defs>
                        <linearGradient id="performance-gradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="hsl(var(--chart-3))" />
                            <stop offset="100%" stopColor="hsl(var(--chart-1))" />
                        </linearGradient>
                    </defs>
                    <PolarAngleAxis
                        type="number"
                        domain={[0, 100]}
                        dataKey="value"
                        tick={false}
                    />
                    <RadialBar
                        background={{ fill: 'hsl(var(--muted))', opacity: 0.5 }}
                        dataKey="value"
                        cornerRadius={6}
                    />
                </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center text-center">
                <p className="text-3xl font-bold text-primary">{`${Math.round(performance)}%`}</p>
            </div>
             <div className="absolute bottom-[15px] left-[5px] text-xs font-medium text-muted-foreground">0%</div>
            <div className="absolute bottom-[15px] right-[5px] text-xs font-medium text-muted-foreground">100%</div>
        </div>
      </CardContent>
    </Card>
  )
}
