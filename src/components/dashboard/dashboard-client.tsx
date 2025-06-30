
"use client";

import { useState, useEffect, lazy, Suspense } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { type DashboardData, type Stat } from "@/lib/placeholder-data";
import RecentOrders from "./recent-orders";
import AiInsights from "./ai-insights";
import type { DateRange } from "react-day-picker";
import { DashboardHeader } from "./dashboard-header";
import { StatsGrid } from "./stats-grid";
import { Skeleton } from "@/components/ui/skeleton";

// Lazy load heavy chart components to speed up initial page load
const TopClientsChart = lazy(() => import("./top-clients-chart"));
const IncomeChart = lazy(() => import("./income-chart"));

export function DashboardClient({
  stats: initialStats,
  revenueByDay,
  previousRevenueByDay,
  recentOrders,
  aiInsights,
  topClients,
  incomeBySource,
}: DashboardData) {
  const [stats, setStats] = useState<Stat[]>(initialStats);
  const [date, setDate] = useState<DateRange | undefined>();
  const [targetMonth, setTargetMonth] = useState("June");
  const [targetYear, setTargetYear] = useState(2024); // Static year for SSR

  useEffect(() => {
    const today = new Date();
    const from = new Date(today.getFullYear(), today.getMonth(), 1);
    setDate({ from: from, to: today });

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const currentMonthName = monthNames[today.getMonth()];
    const currentYear = today.getFullYear();

    setTargetMonth(currentMonthName);
    setTargetYear(currentYear);
    
    setStats(prevStats => {
        const newStats = [...prevStats];
        const targetIndex = newStats.findIndex(
            (s) => s.title === "Target for June"
        );
        if (targetIndex !== -1) {
            newStats[targetIndex].title = `Target for ${currentMonthName}`;
            newStats[targetIndex].description = `Revenue goal for ${currentMonthName} ${currentYear}`;
        }
        return newStats;
    });

  }, []);

  const handleSetTarget = (newTarget: number, month: string, year: number) => {
    setTargetMonth(month);
    setTargetYear(year);
    setStats((prevStats) => {
      const newStats = [...prevStats];
      const targetIndex = newStats.findIndex(
        (s) => s.title.startsWith("Target for")
      );
      if (targetIndex !== -1) {
        newStats[targetIndex] = {
          ...newStats[targetIndex],
          title: `Target for ${month}`,
          value: `$${newTarget.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`,
          description: `Revenue goal for ${month} ${year}`
        };
      }
      return newStats;
    });
  };

  const currentTarget = parseFloat(
    stats.find((s) => s.title.startsWith("Target for"))?.value.replace(/[^0-9.-]+/g, "") || "0"
  );
  
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const monthIndex = monthNames.indexOf(targetMonth);
  const daysInMonth = monthIndex !== -1 ? new Date(targetYear, monthIndex + 1, 0).getDate() : 30;
  const dailyTarget = currentTarget > 0 ? currentTarget / daysInMonth : undefined;

  const financialStats = stats.filter((s) =>
    ["Total Revenue", "Total Expenses", "Net Profit"].includes(s.title)
  ).map((s, i) => ({ ...s, color: `hsl(var(--chart-${i + 1}))` }));

  const performanceStats = stats.filter((s) =>
    [
      "Performance vs Target",
      "Avg Daily Revenue (ADR)",
      "Req. Daily Revenue (RDR)",
      "Days Left in Month",
    ].includes(s.title) || s.title.startsWith("Target for")
  ).map((s, i) => ({
      ...s,
      color: s.title.startsWith("Target for") ? `hsl(var(--chart-4))` : `hsl(var(--chart-${(i % 5) + 1}))`
  }));

  const customerAndOrderStats = stats.filter((s) =>
    [
      "Avg Order Value (AOV)",
      "Total Orders (Completed)",
      "Buyers",
      "Cancelled Orders",
      "% Orders with Reviews",
      "All-Time Total Buyers",
    ].includes(s.title)
  ).map((s, i) => ({
      ...s,
      color: s.title.includes("Cancelled") ? 'hsl(var(--destructive))' : `hsl(var(--chart-${(i % 5) + 1}))`
  }));
  
  const totalRevenue = revenueByDay.reduce((sum, day) => sum + day.revenue, 0);

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 md:gap-8 md:p-8">
      <DashboardHeader 
        date={date}
        setDate={setDate}
        currentTarget={currentTarget}
        onSetTarget={handleSetTarget}
        targetMonth={targetMonth}
        targetYear={targetYear}
      />

      <StatsGrid 
        title="Financial Overview"
        stats={financialStats}
        gridClassName="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
      />

      <StatsGrid 
        title="Performance vs. Goals"
        stats={performanceStats}
        gridClassName="grid gap-4 md:grid-cols-3 lg:grid-cols-5"
      />

      <StatsGrid 
        title="Customer & Order Metrics"
        stats={customerAndOrderStats}
        gridClassName="grid gap-4 md:grid-cols-3 lg:grid-cols-4"
      />

      <div className="grid gap-4 md:gap-8 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>
              An overview of your most recent orders.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RecentOrders orders={recentOrders} />
          </CardContent>
        </Card>
        <Suspense fallback={<Skeleton className="h-[430px] w-full rounded-lg" />}>
            <TopClientsChart data={topClients} totalRevenue={totalRevenue} />
        </Suspense>
      </div>
      <div className="grid gap-4 md:gap-8 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Income by Source</CardTitle>
            <CardDescription>
              A breakdown of your income sources for the selected period.
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <Suspense fallback={<Skeleton className="mx-auto h-[250px] w-[250px] rounded-full" />}>
              <IncomeChart data={incomeBySource} />
            </Suspense>
          </CardContent>
        </Card>
        <AiInsights initialInsights={aiInsights} />
      </div>
    </main>
  );
}
