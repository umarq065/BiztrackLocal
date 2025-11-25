"use client";

import { Bar, BarChart, Line, LineChart, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";
import { ArrowDown, ArrowUp } from "lucide-react";

const gradientMap = {
  revenue: "from-emerald-500 to-green-600",
  expenses: "from-red-500 to-orange-500",
  profit: "from-sky-500 to-blue-600",
  aov: "from-violet-500 to-purple-600",
};

interface FinancialStatCardProps {
  title: string;
  value: string;
  dateRange: string;
  chartData: { value: number }[];
  chartType: "bar" | "line";
  gradient: keyof typeof gradientMap;
  className?: string;
  change?: string;
  changeType?: "increase" | "decrease";
}

const chartComponents = {
  bar: BarChart,
  line: LineChart,
};

export function FinancialStatCard({
  title,
  value,
  dateRange,
  chartData,
  chartType,
  gradient,
  className,
  change,
  changeType,
}: FinancialStatCardProps) {
  const Chart = chartComponents[chartType];
  const isPositive = changeType === "increase";

  return (
    <div className={cn("relative group", className)}>
      {/* Animated gradient border effect */}
      <div
        className="absolute -inset-0.5 rounded-xl bg-gradient-to-br from-white/20 to-white/5 opacity-0 blur-sm transition-opacity duration-500 group-hover:opacity-100"
        aria-hidden="true"
      />

      {/* Main Card Container */}
      <div className="relative z-10 flex h-full flex-col justify-between overflow-hidden rounded-xl border border-border bg-card p-5 shadow-xl backdrop-blur-md transition-all duration-300 hover:bg-accent/50 hover:scale-[1.02] hover:shadow-2xl hover:shadow-primary/10">

        {/* Background Gradient Mesh */}
        <div
          className={cn("absolute inset-0 opacity-10 dark:opacity-30 transition-opacity duration-500 group-hover:opacity-20 dark:group-hover:opacity-40 bg-gradient-to-br", gradientMap[gradient])}
          aria-hidden="true"
        />

        {/* Subtle noise texture overlay */}
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.05] mix-blend-overlay" />

        {/* Faded background chart */}
        <div
          className="absolute bottom-0 left-0 right-0 h-3/4 opacity-10 dark:opacity-30"
          style={{ maskImage: 'linear-gradient(to top, black, transparent)' }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <Chart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
              {chartType === "line" && (
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="currentColor"
                  strokeWidth={3}
                  dot={false}
                  className="text-foreground drop-shadow-lg"
                />
              )}
              {chartType === "bar" && (
                <Bar dataKey="value" fill="currentColor" className="text-foreground" radius={[2, 2, 0, 0]} />
              )}
            </Chart>
          </ResponsiveContainer>
        </div>

        {/* Foreground content */}
        <div className="relative z-10 space-y-4">
          <div className="flex items-start justify-between">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{title}</h3>
            {change && changeType && (
              <div
                className={cn(
                  "flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold shadow-sm backdrop-blur-sm border border-border",
                  isPositive ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-300" : "bg-rose-500/20 text-rose-600 dark:text-rose-300"
                )}
              >
                {isPositive ? (
                  <ArrowUp className="h-3 w-3" />
                ) : (
                  <ArrowDown className="h-3 w-3" />
                )}
                <span>{change}</span>
              </div>
            )}
          </div>

          <div className="space-y-1">
            <p className="text-3xl font-bold text-white tracking-tight drop-shadow-md group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-blue-100 transition-all duration-300">
              {value}
            </p>
            <p className="text-xs text-blue-200/50 font-medium">{dateRange}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
