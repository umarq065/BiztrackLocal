
import React, { type ReactNode } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";

export interface Stat {
  icon: string;
  title: string;
  value: ReactNode;
  change?: string;
  changeType?: "increase" | "decrease";
  description: ReactNode;
  progressValue?: number;
  className?: string;
  invertChangeColor?: boolean;
  color?: string;
  highlight?: "top-border" | "background" | "none";
  breakdown?: {
    label: string;
    value: number;
    percentage: number;
    color: string;
    change: string;
    changeType: "increase" | "decrease";
  }[];
}

export interface RecentOrder {
  id: string;
  clientName: string;
  clientEmail:string;
  amount: number;
}

export interface RevenueByDay {
  date: string;
  revenue: number;
  note?: string;
}

export interface TopClient {
  name: string;
  amount: number;
}

export interface IncomeBySource {
  source: string;
  amount: number;
}

export interface FinancialCardData {
  title: string;
  value: string;
  dateRange: string;
  chartData: { value: number }[];
  chartType: "bar" | "line";
  gradient: string;
  change?: string;
  changeType?: "increase" | "decrease";
}

export interface DashboardData {
  stats: Stat[];
  revenueByDay: RevenueByDay[];
  previousRevenueByDay: RevenueByDay[];
  recentOrders: RecentOrder[];
  aiInsights: string;
  topClients: TopClient[];
  incomeBySource: IncomeBySource[];
  financialCards: FinancialCardData[];
}

const generateDummyChartData = (points: number, max: number) => {
  return Array.from({ length: points }, () => ({ value: Math.random() * max }));
};

export const financialCardsData: FinancialCardData[] = [
  {
    title: "Total Revenue",
    value: "$45.2k",
    dateRange: "May 01 - May 30",
    change: "+12.5%",
    changeType: "increase" as const,
    chartData: generateDummyChartData(15, 2000),
    chartType: 'bar' as const,
    gradient: "from-emerald-500 to-green-600",
  },
  {
    title: "Total Expenses",
    value: "$10.5k",
    dateRange: "May 01 - May 30",
    change: "+8.1%",
    changeType: "increase" as const,
    chartData: generateDummyChartData(15, 800),
    chartType: 'line' as const,
    gradient: "from-red-500 to-orange-500",
  },
  {
    title: "Net Profit",
    value: "$34.7k",
    dateRange: "May 01 - May 30",
    change: "+14.2%",
    changeType: "increase" as const,
    chartData: generateDummyChartData(15, 1500),
    chartType: 'line' as const,
    gradient: "from-sky-500 to-blue-600",
  },
  {
    title: "Avg. Order Value",
    value: "$131.50",
    dateRange: "May 01 - May 30",
    change: "-3.2%",
    changeType: "decrease" as const,
    chartData: generateDummyChartData(15, 200),
    chartType: 'bar' as const,
    gradient: "from-violet-500 to-purple-600",
  }
];


export const dashboardData: Omit<DashboardData, "financialCards"> = {
  stats: [
    {
      icon: "DollarSign",
      title: "Total Revenue",
      value: "$45,231.89",
      change: "+2.5%",
      changeType: "increase",
      description: "vs. last month",
    },
    {
      icon: "CreditCard",
      title: "Total Expenses",
      value: "$10,543.00",
      change: "+7.1%",
      changeType: "increase",
      description: "vs. last month",
      invertChangeColor: true,
    },
    {
      icon: "TrendingUp",
      title: "Net Profit",
      value: "$34,688.89",
      change: "+1.2%",
      changeType: "increase",
      description: "vs. last month",
    },
    {
      icon: "Goal",
      title: "Target for June",
      value: "$50,000.00",
      description: "Monthly revenue goal",
    },
    {
      icon: "BarChart",
      title: "Performance vs Target",
      value: "90.5%",
      change: "+3.2%",
      changeType: "increase",
      description: "vs. last month",
      progressValue: 90.5,
    },
    {
      icon: "DollarSign",
      title: "Avg Daily Revenue (ADR)",
      value: "$1,507.73",
      change: "+4.1%",
      changeType: "increase",
      description: "vs. last month",
      color: "hsl(var(--chart-1))",
      highlight: "top-border",
    },
    {
      icon: "DollarSign",
      title: "Req. Daily Revenue (RDR)",
      value: "$476.81",
      description: "To meet your monthly target",
      color: "hsl(var(--chart-2))",
      highlight: "top-border",
    },
    {
      icon: "BarChart",
      title: "Avg Order Value (AOV)",
      value: "$131.50",
      change: "-3.2%",
      changeType: "decrease",
      description: "vs. last month",
      color: "hsl(var(--chart-3))",
      highlight: "top-border",
    },
    {
      icon: "ShoppingCart",
      title: "Total Orders (Completed)",
      value: "344",
      change: "+12.5%",
      changeType: "increase",
      description: "vs. last month",
    },
    {
      icon: "Users",
      title: "Buyers",
      value: "344",
      change: "+12.5%",
      changeType: "increase",
      description: "vs. last month",
      breakdown: [
        {
          label: "New",
          value: 227,
          percentage: 66,
          color: "hsl(var(--chart-1))",
          change: "+15.2%",
          changeType: "increase",
        },
        {
          label: "Repeat",
          value: 117,
          percentage: 34,
          color: "hsl(var(--chart-4))",
          change: "-5.1%",
          changeType: "decrease",
        },
      ],
    },
    {
      icon: "Calendar",
      title: "Days Left in Month",
      value: "10",
      description: "in current billing cycle",
    },
    {
      icon: "XCircle",
      title: "Cancelled Orders",
      value: "12 ($1,432.10)",
      change: "+20%",
      changeType: "increase",
      description: "vs. last month",
      invertChangeColor: true,
    },
    {
      icon: "Star",
      title: "% Orders with Reviews",
      value: "45.8%",
      change: "+2.3%",
      changeType: "increase",
      description: "vs. last month",
    },
    {
      icon: "Users",
      title: "All-Time Total Buyers",
      value: "1,245",
      description: "SOB: 980 | Repeat: 265",
    },
  ],
  revenueByDay: [
    { date: "2024-05-01", revenue: 2000 },
    { date: "2024-05-02", revenue: 2200 },
    { date: "2024-05-03", revenue: 2500 },
    { date: "2024-05-04", revenue: 2100 },
    { date: "2024-05-05", revenue: 2800 },
    { date: "2024-05-06", revenue: 3000, note: "Launched new ad campaign." },
    { date: "2024-05-07", revenue: 3200 },
    { date: "2024-05-08", revenue: 2900 },
    { date: "2024-05-09", revenue: 3500 },
    { date: "2024-05-10", revenue: 3700 },
    { date: "2024-05-11", revenue: 4000 },
    { date: "2024-05-12", revenue: 3800, note: "Updated gig pricing." },
    { date: "2024-05-13", revenue: 4200 },
    { date: "2024-05-14", revenue: 4500 },
    { date: "2024-05-15", revenue: 4300 },
    { date: "2024-05-16", revenue: 4600 },
    { date: "2024-05-17", revenue: 4400 },
    { date: "2024-05-18", revenue: 4800 },
    { date: "2024-05-19", revenue: 5000, note: "Holiday sale started." },
    { date: "2024-05-20", revenue: 5200 },
    { date: "2024-05-21", revenue: 5100 },
    { date: "2024-05-22", revenue: 5300 },
    { date: "2024-05-23", revenue: 5500 },
    { date: "2024-05-24", revenue: 5400 },
    { date: "2024-05-25", revenue: 5800 },
    { date: "2024-05-26", revenue: 5600 },
    { date: "2024-05-27", revenue: 6000 },
    { date: "2024-05-28", revenue: 5900 },
    { date: "2024-05-29", revenue: 6200 },
    { date: "2024-05-30", revenue: 6100 },
  ],
   previousRevenueByDay: [
    { date: "2024-04-01", revenue: 1800 },
    { date: "2024-04-02", revenue: 1900 },
    { date: "2024-04-03", revenue: 2200 },
    { date: "2024-04-04", revenue: 2000 },
    { date: "2024-04-05", revenue: 2500 },
    { date: "2024-04-06", revenue: 2600 },
    { date: "2024-04-07", revenue: 2800 },
    { date: "2024-04-08", revenue: 2700 },
    { date: "2024-04-09", revenue: 3100 },
    { date: "2024-04-10", revenue: 3300 },
    { date: "2024-04-11", revenue: 3500 },
    { date: "2024-04-12", revenue: 3400 },
    { date: "2024-04-13", revenue: 3800 },
    { date: "2024-04-14", revenue: 4100 },
    { date: "2024-04-15", revenue: 3900 },
    { date: "2024-04-16", revenue: 4200 },
    { date: "2024-04-17", revenue: 4000 },
    { date: "2024-04-18", revenue: 4400 },
    { date: "2024-04-19", revenue: 4600 },
    { date: "2024-04-20", revenue: 4700 },
    { date: "2024-04-21", revenue: 4600 },
    { date: "2024-04-22", revenue: 4800 },
    { date: "2024-04-23", revenue: 5000 },
    { date: "2024-04-24", revenue: 4900 },
    { date: "2024-04-25", revenue: 5300 },
    { date: "2024-04-26", revenue: 5100 },
    { date: "2024-04-27", revenue: 5500 },
    { date: "2024-04-28", revenue: 5400 },
    { date: "2024-04-29", revenue: 5700 },
    { date: "2024-04-30", revenue: 5600 },
  ],
  recentOrders: [
    {
      id: "ORD001",
      clientName: "Olivia Martin",
      clientEmail: "olivia.martin@email.com",
      amount: 1999.0,
    },
    {
      id: "ORD002",
      clientName: "Jackson Lee",
      clientEmail: "jackson.lee@email.com",
      amount: 399.0,
    },
    {
      id: "ORD003",
      clientName: "Isabella Nguyen",
      clientEmail: "isabella.nguyen@email.com",
      amount: 299.0,
    },
    {
      id: "ORD004",
      clientName: "William Kim",
      clientEmail: "will@email.com",
      amount: 999.0,
    },
    {
      id: "ORD005",
      clientName: "Sofia Davis",
      clientEmail: "sofia.davis@email.com",
      amount: 499.0,
    },
  ],
  topClients: [
    { name: "Liam Johnson", amount: 4500 },
    { name: "Noah Williams", amount: 3200 },
    { name: "Olivia Martin", amount: 2800 },
    { name: "Emma Brown", amount: 2500 },
    { name: "Ava Jones", amount: 1900 },
  ],
  incomeBySource: [
    { source: "Web Design", amount: 15231.89 },
    { source: "Consulting", amount: 12500.00 },
    { source: "Logo Design", amount: 8000.00 },
    { source: "SEO Services", amount: 7500.00 },
    { source: "Maintenance", amount: 2000.00 },
  ],
  aiInsights:
    "Your revenue is trending positively. Consider offering tiered packages for Consulting to increase average order value. Client acquisition is strong, but focus on strategies to improve the repeat client rate, such as loyalty discounts or follow-up services.",
};
