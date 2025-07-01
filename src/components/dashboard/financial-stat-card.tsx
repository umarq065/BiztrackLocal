
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
      <div
        className="absolute -inset-px rounded-lg bg-[conic-gradient(from_var(--gradient-angle)_at_50%_50%,white_0deg,transparent_60deg)] opacity-0 blur-sm transition-opacity duration-500 group-hover:opacity-75 group-hover:animate-spin-gradient"
        aria-hidden="true"
      />
      <div className="relative z-10 flex h-full flex-col justify-between overflow-hidden rounded-lg p-4 text-white shadow">
        <div
          className={cn("absolute inset-0 bg-gradient-to-br", gradientMap[gradient])}
          aria-hidden="true"
        />

        {/* Faded background chart */}
        <div className="absolute bottom-0 left-0 right-0 h-2/3 text-white/25">
           <ResponsiveContainer width="100%" height="100%">
              <Chart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                {chartType === "line" && (
                  <Line
                    type="natural"
                    dataKey="value"
                    stroke="currentColor"
                    strokeWidth={2}
                    dot={false}
                  />
                )}
                {chartType === "bar" && (
                  <Bar dataKey="value" fill="currentColor" />
                )}
              </Chart>
            </ResponsiveContainer>
        </div>
        
        {/* Foreground content */}
        <div className="relative z-10">
          <h3 className="text-sm font-medium text-white/80 text-shadow-sm [--tw-shadow-color:rgba(0,0,0,0.4)]">{title}</h3>
          <div className="mt-2 flex items-baseline gap-2">
            <p className="text-3xl font-bold text-shadow [--tw-shadow-color:rgba(0,0,0,0.5)] transition-all duration-300 group-hover:text-shadow-[0_0_15px_white]">
              {value}
            </p>
            {change && changeType && (
              <div
                className={cn(
                  "flex items-center gap-1 text-xs font-semibold text-shadow-sm [--tw-shadow-color:rgba(0,0,0,0.4)]",
                  isPositive ? "text-green-300" : "text-red-300"
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
        </div>
        <p className="relative z-10 text-xs text-white/80 text-shadow-sm [--tw-shadow-color:rgba(0,0,0,0.4)]">{dateRange}</p>
      </div>
    </div>
  );
}
