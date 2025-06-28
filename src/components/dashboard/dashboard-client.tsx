
"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { type DashboardData, type Stat } from "@/lib/placeholder-data";
import { SetTargetDialog } from "./set-target-dialog";
import StatCard from "./stat-card";
import RevenueChart from "./revenue-chart";
import RecentOrders from "./recent-orders";
import AiInsights from "./ai-insights";
import TopClientsChart from "./top-clients-chart";
import { DateFilter } from "./date-filter";
import type { DateRange } from "react-day-picker";

export function DashboardClient({
  stats: initialStats,
  revenueByDay,
  previousRevenueByDay,
  recentOrders,
  aiInsights,
  topClients,
}: DashboardData) {
  const [stats, setStats] = useState<Stat[]>(initialStats);
  const [date, setDate] = useState<DateRange | undefined>();
  const [targetMonth, setTargetMonth] = useState("June");
  const [targetYear, setTargetYear] = useState(new Date().getFullYear());

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
  
  const financialStats = stats.filter((s) =>
    ["Total Revenue", "Total Expenses", "Net Profit"].includes(s.title)
  );

  const performanceStats = stats.filter((s) =>
    [
      "Performance vs Target",
      "Avg Daily Revenue (ADR)",
      "Req. Daily Revenue (RDR)",
      "Days Left in Month",
    ].includes(s.title) || s.title.startsWith("Target for")
  );

  const customerAndOrderStats = stats.filter((s) =>
    [
      "Avg Order Value (AOV)",
      "Total Orders (Completed)",
      "Total Buyers",
      "Cancelled Orders",
      "% Orders with Reviews",
      "All-Time Total Buyers",
    ].includes(s.title)
  );
  
  const totalRevenue = revenueByDay.reduce((sum, day) => sum + day.revenue, 0);

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 md:gap-8 md:p-8">
      <div className="flex items-center">
        <h1 className="font-headline text-lg font-semibold md:text-2xl">
          Dashboard
        </h1>
        <div className="ml-auto flex items-center gap-2">
          <DateFilter date={date} setDate={setDate} />
          <SetTargetDialog
            currentTarget={currentTarget}
            onSetTarget={handleSetTarget}
            targetMonth={targetMonth}
            targetYear={targetYear}
          />
        </div>
      </div>

      <section>
        <h2 className="text-xl font-semibold mb-4">Financial Overview</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {financialStats.map((stat) => (
            <StatCard key={stat.title} {...stat} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Performance vs. Goals</h2>
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
          {performanceStats.map((stat) => (
            <StatCard key={stat.title} {...stat} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Customer & Order Metrics</h2>
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
          {customerAndOrderStats.map((stat) => (
            <StatCard key={stat.title} {...stat} />
          ))}
        </div>
      </section>

      <div className="grid gap-4 md:gap-8">
        <Card>
           <RevenueChart data={revenueByDay} previousData={previousRevenueByDay} />
        </Card>
      </div>
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
        <TopClientsChart data={topClients} totalRevenue={totalRevenue} />
      </div>
      <div className="grid gap-4 md:gap-8">
         <AiInsights initialInsights={aiInsights} />
      </div>
    </main>
  );
}
