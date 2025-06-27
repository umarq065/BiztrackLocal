import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { dashboardData } from "@/lib/placeholder-data";
import { DashboardClient } from "@/components/dashboard/dashboard-client";

export default function DashboardPage() {
  const {
    stats,
    revenueByDay,
    incomeBySource,
    recentOrders,
    aiInsights,
  } = dashboardData;
  return (
    <DashboardClient
      stats={stats}
      revenueByDay={revenueByDay}
      incomeBySource={incomeBySource}
      recentOrders={recentOrders}
      aiInsights={aiInsights}
    />
  );
}
