
"use client";

import { Suspense, lazy } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { yearlyStatsData } from "@/lib/data/yearly-stats-data";

const MyOrdersVsCompetitorAvgChart = lazy(() => import("@/components/yearly-stats/my-orders-vs-competitor-avg-chart"));
const TotalYearlyOrdersDistributionChart = lazy(() => import("@/components/yearly-stats/total-yearly-orders-distribution-chart"));
const MonthlyOrdersVsCompetitorsChart = lazy(() => import("@/components/yearly-stats/monthly-orders-vs-competitors-chart"));
const MonthlyFinancialsChart = lazy(() => import("@/components/yearly-stats/monthly-financials-chart"));
const MonthlyRevenueVsTargetChart = lazy(() => import("@/components/yearly-stats/monthly-revenue-vs-target-chart"));


export default function YearlyStatsPage() {
    // For simplicity, we'll use 2023 data as the default for single-year charts
    const defaultYearData = yearlyStatsData[2023];
    
    const { 
        myTotalYearlyOrders, 
        competitors, 
    } = defaultYearData;
    
  return (
    <main className="flex flex-1 flex-col gap-6 p-4 md:gap-8 md:p-8">
      <div className="flex items-center">
        <h1 className="font-headline text-lg font-semibold md:text-2xl">
          Yearly Stats
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Suspense fallback={<Skeleton className="h-[300px] lg:col-span-2" />}>
            <MyOrdersVsCompetitorAvgChart allYearlyData={yearlyStatsData} />
        </Suspense>
        <Card>
             <CardHeader>
                <CardTitle>Total Yearly Orders Distribution</CardTitle>
                <CardDescription>A pie chart showing the market share of orders between you and your competitors.</CardDescription>
            </CardHeader>
            <CardContent>
                <Suspense fallback={<Skeleton className="h-[300px]" />}>
                   <TotalYearlyOrdersDistributionChart myOrders={myTotalYearlyOrders} competitors={competitors} />
                </Suspense>
            </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>Monthly Orders: You vs. Competitors (Year)</CardTitle>
            <CardDescription>A line graph showing your monthly orders compared to each of your main competitors throughout the year.</CardDescription>
        </CardHeader>
        <CardContent>
            <Suspense fallback={<Skeleton className="h-[400px]" />}>
                <MonthlyOrdersVsCompetitorsChart allYearlyData={yearlyStatsData} />
            </Suspense>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
            <CardTitle>Monthly Revenue, Expenses, and Profit (Year)</CardTitle>
            <CardDescription>A bar graph showing your key financial metrics for each month of the year.</CardDescription>
        </CardHeader>
        <CardContent>
            <Suspense fallback={<Skeleton className="h-[400px]" />}>
                <MonthlyFinancialsChart allYearlyData={yearlyStatsData} />
            </Suspense>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
            <CardTitle>Monthly Revenue vs. Target Revenue (Year)</CardTitle>
            <CardDescription>A line graph comparing your actual monthly revenue against your target revenue for the year.</CardDescription>
        </CardHeader>
        <CardContent>
            <Suspense fallback={<Skeleton className="h-[400px]" />}>
                <MonthlyRevenueVsTargetChart allYearlyData={yearlyStatsData} />
            </Suspense>
        </CardContent>
      </Card>
    </main>
  );
}
