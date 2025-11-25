
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

  // Cap the visual value at 100, but display the actual value
  const visualValue = Math.min(performance, 100);
  const data = [{ name: 'performance', value: visualValue, fill: 'url(#performance-gradient)' }];

  return (
    <Card className="flex flex-col h-full border-white/10 bg-white/5 backdrop-blur-md">
      <CardHeader>
        <CardTitle className="text-white">Performance</CardTitle>
        <CardDescription className="text-blue-200/60">Your progress towards your monthly revenue target.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-grow flex-col items-center justify-center gap-4 py-2">
        <div className="w-[140px]">
          <div className="relative h-[140px]">
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
                  <linearGradient
                    id="performance-gradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#3b82f6" />
                  </linearGradient>
                </defs>
                <PolarAngleAxis
                  type="number"
                  domain={[0, 100]}
                  dataKey="value"
                  tick={false}
                />
                <RadialBar
                  background={{ fill: "rgba(255,255,255,0.1)" }}
                  dataKey="value"
                  cornerRadius={6}
                />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center text-center">
              <p className="text-3xl font-bold text-white drop-shadow-md">{`${Math.round(
                performance
              )}%`}</p>
            </div>
          </div>
          <div className="mt-1 flex w-full justify-between text-xs font-medium text-blue-200/50">
            <span>0%</span>
            <span>100%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
