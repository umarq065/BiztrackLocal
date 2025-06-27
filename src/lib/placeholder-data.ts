export interface Stat {
  icon: string;
  title: string;
  value: string;
  change?: string;
  changeType?: "increase" | "decrease";
  description: string;
}

export interface RecentOrder {
  id: string;
  clientName: string;
  clientEmail: string;
  amount: number;
}

export interface IncomeBySource {
  source: string;
  amount: number;
  fill: string;
}

export interface RevenueByDay {
  date: string;
  revenue: number;
}

export interface DashboardData {
  stats: Stat[];
  revenueByDay: RevenueByDay[];
  incomeBySource: IncomeBySource[];
  recentOrders: RecentOrder[];
  aiInsights: string;
}

export const dashboardData: DashboardData = {
  stats: [
    {
      icon: "DollarSign",
      title: "Total Revenue",
      value: "$0.00",
      description: "",
    },
    {
      icon: "CreditCard",
      title: "Total Expenses",
      value: "$0.00",
      description: "",
    },
    {
      icon: "TrendingUp",
      title: "Net Profit",
      value: "$0.00",
      description: "",
    },
    {
      icon: "Goal",
      title: "Target for June",
      value: "$0.00",
      description: "",
    },
    {
      icon: "BarChart",
      title: "Performance vs Target",
      value: "0.0%",
      description: "",
    },
    {
      icon: "DollarSign",
      title: "Avg Daily Revenue (ADR)",
      value: "$0.00",
      description: "",
    },
    {
      icon: "DollarSign",
      title: "Req. Daily Revenue (RDR)",
      value: "$0.00",
      description: "",
    },
    {
      icon: "BarChart",
      title: "Avg Order Value (AOV)",
      value: "$0.00",
      description: "",
    },
    {
      icon: "ShoppingCart",
      title: "Total Orders (Completed)",
      value: "0",
      description: "",
    },
    {
      icon: "Repeat",
      title: "Repeat Buyers",
      value: "0 (0.0%)",
      description: "",
    },
    {
      icon: "UserPlus",
      title: "New Buyers",
      value: "0 (0.0%)",
      description: "No new buyer data for comparison.",
    },
    {
      icon: "Calendar",
      title: "Days Left in Month",
      value: "2",
      description: "",
    },
    {
      icon: "XCircle",
      title: "Cancelled Orders",
      value: "0 ($0.00)",
      description: "",
    },
    {
      icon: "Star",
      title: "% Orders with Reviews",
      value: "0.0%",
      description: "",
    },
    {
      icon: "Users",
      title: "All-Time Total Buyers",
      value: "0",
      description: "SOB: 0 | Repeat: 0",
    },
  ],
  revenueByDay: [
    { date: "2024-05-01", revenue: 2000 },
    { date: "2024-05-02", revenue: 2200 },
    { date: "2024-05-03", revenue: 2500 },
    { date: "2024-05-04", revenue: 2100 },
    { date: "2024-05-05", revenue: 2800 },
    { date: "2024-05-06", revenue: 3000 },
    { date: "2024-05-07", revenue: 3200 },
    { date: "2024-05-08", revenue: 2900 },
    { date: "2024-05-09", revenue: 3500 },
    { date: "2024-05-10", revenue: 3700 },
    { date: "2024-05-11", revenue: 4000 },
    { date: "2024-05-12", revenue: 3800 },
    { date: "2024-05-13", revenue: 4200 },
    { date: "2024-05-14", revenue: 4500 },
    { date: "2024-05-15", revenue: 4300 },
  ],
  incomeBySource: [
    { source: "Web Design", amount: 15231, fill: "var(--color-chart-1)" },
    { source: "Consulting", amount: 10432, fill: "var(--color-chart-2)" },
    { source: "Logo Design", amount: 8900, fill: "var(--color-chart-3)" },
    { source: "SEO Services", amount: 6400, fill: "var(--color-chart-4)" },
    { source: "Maintenance", amount: 4268, fill: "var(--color-chart-5)" },
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
  aiInsights:
    "Your revenue is trending positively, driven by Web Design services. Consider offering tiered packages for Consulting to increase average order value. Client acquisition is strong, but focus on strategies to improve the repeat client rate, such as loyalty discounts or follow-up services.",
};
