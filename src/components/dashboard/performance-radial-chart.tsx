
"use client"

import { TrendingUp, TrendingDown } from "lucide-react"
import { RadialBar, RadialBarChart, ResponsiveContainer, PolarAngleAxis, Line, LineChart } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface PerformanceRadialChartProps {
    performance: number
    adr: string
    rdr: string
    adrChange?: string
    adrChangeType?: 'increase' | 'decrease'
    sparklineData: { value: number }[]
}

export function PerformanceRadialChart({
    performance,
    adr,
    rdr,
    adrChange,
    adrChangeType,
    sparklineData
}: PerformanceRadialChartProps) {

  const data = [{ name: 'performance', value: performance, fill: 'url(#performance-gradient)' }];
  const isPositive = adrChangeType === "increase";

  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <CardTitle>Performance vs Goals</CardTitle>
        <CardDescription>Your progress towards your monthly revenue target.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 items-center justify-center py-0">
        <div className="relative h-[250px] w-[250px]">
            <ResponsiveContainer width="100%" height="100%">
                 <RadialBarChart
                    data={data}
                    innerRadius="80%"
                    outerRadius="100%"
                    startAngle={90}
                    endAngle={-270}
                    barSize={20}
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
                        cornerRadius={10}
                    />
                </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center gap-1 text-center">
                <div className="mx-auto h-10 w-24">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={sparklineData} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
                            <Line
                                type="monotone"
                                dataKey="value"
                                stroke="hsl(var(--chart-3))"
                                strokeWidth={2}
                                dot={false}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
                
                {adrChange && (
                  <div className="flex items-center justify-center gap-1">
                      {isPositive ? <TrendingUp className="h-4 w-4 text-green-500" /> : <TrendingDown className="h-4 w-4 text-red-500" />}
                      <div className="text-xs text-muted-foreground">
                          <p>ADR: {adr} ({adrChange})</p>
                          <p>RDR: {rdr}</p>
                      </div>
                  </div>
                )}

                <p className="text-5xl font-bold text-primary">{`${Math.round(performance)}%`}</p>
            </div>
             <div className="absolute bottom-[25px] left-[15px] text-xs font-medium text-muted-foreground">0%</div>
            <div className="absolute bottom-[25px] right-[15px] text-xs font-medium text-muted-foreground">100%</div>
        </div>
      </CardContent>
    </Card>
  )
}
