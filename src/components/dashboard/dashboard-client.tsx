"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { type DashboardData } from "@/lib/placeholder-data";
import { DateFilter } from "./date-filter";
import StatCard from "./stat-card";
import RevenueChart from "./revenue-chart";
import IncomeChart from "./income-chart";
import RecentOrders from "./recent-orders";
import AiInsights from "./ai-insights";

export function DashboardClient({
  stats,
  revenueByDay,
  incomeBySource,
  recentOrders,
  aiInsights,
}: DashboardData) {
  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center">
        <h1 className="font-headline text-lg font-semibold md:text-2xl">
          Dashboard
        </h1>
        <div className="ml-auto flex items-center gap-2">
          <DateFilter />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        {stats.slice(0, 4).map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>
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
       <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        {stats.slice(4).map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>
      <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>An overview of your most recent orders.</CardDescription>
          </CardHeader>
          <CardContent>
            <RecentOrders orders={recentOrders} />
          </CardContent>
        </Card>
        <AiInsights initialInsights={aiInsights} />
      </div>
    </main>
  );
}
