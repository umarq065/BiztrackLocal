"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { type DashboardData, type Stat } from "@/lib/placeholder-data";
import { DateFilter } from "./date-filter";
import StatCard from "./stat-card";
import RevenueChart from "./revenue-chart";
import IncomeChart from "./income-chart";
import RecentOrders from "./recent-orders";
import AiInsights from "./ai-insights";
import { SetTargetDialog } from "./set-target-dialog";
import TopClientsChart from "./top-clients-chart";

export function DashboardClient({
  stats: initialStats,
  revenueByDay,
  incomeBySource,
  recentOrders,
  aiInsights,
  topClients,
}: DashboardData) {
  const [stats, setStats] = useState<Stat[]>(initialStats);

  const handleSetTarget = (newTarget: number) => {
    setStats((prevStats) => {
      const newStats = [...prevStats];
      const targetIndex = newStats.findIndex(
        (s) => s.title === "Target for June"
      );
      if (targetIndex !== -1) {
        newStats[targetIndex] = {
          ...newStats[targetIndex],
          value: `$${newTarget.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`,
        };
      }
      return newStats;
    });
  };

  const currentTarget = parseFloat(
    stats.find((s) => s.title === "Target for June")?.value.replace(/[^0-9.-]+/g, "") || "0"
  );
  
  const financialStats = stats.filter((s) =>
    ["Total Revenue", "Total Expenses", "Net Profit"].includes(s.title)
  );

  const performanceStats = stats.filter((s) =>
    [
      "Target for June",
      "Performance vs Target",
      "Avg Daily Revenue (ADR)",
      "Req. Daily Revenue (RDR)",
      "Days Left in Month",
    ].includes(s.title)
  );

  const customerAndOrderStats = stats.filter((s) =>
    [
      "Avg Order Value (AOV)",
      "Total Orders (Completed)",
      "Repeat Buyers",
      "New Buyers",
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
          <DateFilter />
          <SetTargetDialog
            currentTarget={currentTarget}
            onSetTarget={handleSetTarget}
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

      <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
            <CardDescription>
              A summary of your revenue for the selected period.
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <RevenueChart data={revenueByDay} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Income by Source</CardTitle>
            <CardDescription>
              A breakdown of your income by source.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <IncomeChart data={incomeBySource} />
          </CardContent>
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
        <Card>
           <CardHeader className="flex flex-row items-start justify-between">
            <div className="space-y-1.5">
              <CardTitle>Top 5 Clients</CardTitle>
              <CardDescription>
                Your most valuable clients this month.
              </CardDescription>
            </div>
            <DateFilter />
          </CardHeader>
          <CardContent>
            <TopClientsChart data={topClients} totalRevenue={totalRevenue} />
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:gap-8">
         <AiInsights initialInsights={aiInsights} />
      </div>
    </main>
  );
}
