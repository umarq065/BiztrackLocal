

"use client";

import { useState, useEffect, lazy, Suspense, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { type DashboardData, type Stat, financialCardsData } from "@/lib/placeholder-data";
import RecentOrders from "./recent-orders";
import AiInsights from "./ai-insights";
import type { DateRange } from "react-day-picker";
import { DashboardHeader } from "./dashboard-header";
import { StatsGrid } from "./stats-grid";
import { Skeleton } from "@/components/ui/skeleton";
import { FinancialStatCard } from "./financial-stat-card";
import RevenueChart from "./revenue-chart";
import { PerformanceRadialChart } from "./performance-radial-chart";
import StatCard from "./stat-card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { CalendarIcon, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { orderFormSchema, cancellationReasonsList, type OrderFormValues } from "@/lib/data/orders-data";
import { initialIncomeSources } from "@/lib/data/incomes-data";
import type { RecentOrder, Order } from "@/lib/placeholder-data";


// Lazy load heavy chart components to speed up initial page load
const TopClientsChart = lazy(() => import("./top-clients-chart"));
const IncomeChart = lazy(() => import("./income-chart"));

const incomeSourceNames = initialIncomeSources.map(s => s.name);

interface DashboardClientProps extends DashboardData {
  initialMonthlyTargets: Record<string, number>;
}

export function DashboardClient({
  stats: initialStats,
  revenueByDay,
  previousRevenueByDay,
  recentOrders: initialRecentOrders,
  aiInsights,
  topClients,
  incomeBySource,
  initialMonthlyTargets,
}: DashboardClientProps) {
  const [stats, setStats] = useState<Stat[]>(initialStats);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [dashboardMetrics, setDashboardMetrics] = useState<{
    monthlyTarget: number;
    requiredDailyRevenue: number;
    performance: number;
    revenueByDay: any[];
    previousRevenueByDay: any[];
    keyMetrics?: {
      adr: number;
      rdr: number;
      target: number;
    };
    orderMetrics?: {
      total: number;
      cancelled: number;
      withReviews: number;
      buyers: number;
    };
  }>({
    monthlyTarget: 0,
    requiredDailyRevenue: 0,
    performance: 0,
    revenueByDay: [],
    previousRevenueByDay: [],
  });

  const [financialStats, setFinancialStats] = useState(financialCardsData);
  const [monthlyTargets, setMonthlyTargets] = useState<Record<string, number>>(initialMonthlyTargets);

  const [date, setDate] = useState<DateRange | undefined>(() => {
    const fromParam = searchParams.get('from');
    const toParam = searchParams.get('to');
    if (fromParam && toParam) {
      const from = toZonedTime(fromParam, 'UTC');
      const to = toZonedTime(toParam, 'UTC');
      if (!isNaN(from.getTime()) && !isNaN(to.getTime())) {
        return { from, to };
      }
    }
    const today = new Date();
    const from = new Date(today.getFullYear(), today.getMonth(), 1);
    return { from, to: today };
  });

  const [daysLeft, setDaysLeft] = useState(0);

  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>(initialRecentOrders);
  const [editingOrder, setEditingOrder] = useState<RecentOrder | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const { toast } = useToast();

  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderFormSchema),
  });

  const orderStatus = form.watch("status");
  const selectedSource = form.watch("source");

  const currentMonthKey = useMemo(() => {
    const today = new Date();
    return format(today, 'yyyy-MM');
  }, []);

  // Calculate Performance locally to ensure immediate updates when target changes
  const performanceValue = useMemo(() => {
    const target = monthlyTargets[currentMonthKey] || 0;
    if (target === 0) return 0;

    // Use the fetched total revenue for the month if available, otherwise fallback
    const backendTarget = dashboardMetrics.monthlyTarget || 1; // avoid div by 0
    const impliedMonthRevenue = (dashboardMetrics.performance / 100) * backendTarget;

    return (impliedMonthRevenue / target) * 100;
  }, [monthlyTargets, currentMonthKey, dashboardMetrics.performance, dashboardMetrics.monthlyTarget]);

  const rdrStat = useMemo(() => {
    // Use the backend provided RDR if available, otherwise fallback to local calculation
    // But backend RDR is accurate based on month-to-date revenue.
    // If we want to update it based on changed target locally:

    const target = monthlyTargets[currentMonthKey] || 0;
    // We need the revenue so far this month.
    const backendTarget = dashboardMetrics.monthlyTarget || 0;
    const impliedMonthRevenue = (dashboardMetrics.performance / 100) * backendTarget;

    const remainingRevenue = Math.max(0, target - impliedMonthRevenue);
    const requiredDaily = daysLeft > 0 ? remainingRevenue / daysLeft : 0;

    return {
      title: "Req. Daily Revenue (RDR)",
      value: `$${requiredDaily.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      description: "To meet your monthly target",
      icon: "Goal",
    };
  }, [monthlyTargets, currentMonthKey, daysLeft, dashboardMetrics.performance, dashboardMetrics.monthlyTarget]);

  const keyMetrics = useMemo(() => {
    return [
      {
        title: "Avg Daily Revenue (ADR)",
        value: `$${dashboardMetrics.keyMetrics?.adr.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}`,
        description: "Average revenue per day",
        icon: "TrendingUp"
      },
      rdrStat,
      {
        title: `Target for ${format(new Date(), 'MMMM')}`,
        value: `$${(monthlyTargets[currentMonthKey] || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        description: `Revenue goal for ${format(new Date(), 'MMMM yyyy')}`,
        icon: "Target"
      }
    ] as Stat[];
  }, [dashboardMetrics.keyMetrics, rdrStat, monthlyTargets, currentMonthKey]);

  const otherMetrics = useMemo(() => [
    {
      title: "Total Orders (Completed)",
      value: dashboardMetrics.orderMetrics?.total.toString() || "0",
      description: "Orders completed in period",
      icon: "ShoppingBag",
      color: "hsl(var(--chart-1))"
    },
    {
      title: "Cancelled Orders",
      value: dashboardMetrics.orderMetrics?.cancelled.toString() || "0",
      description: "Orders cancelled in period",
      icon: "XCircle",
      color: "hsl(var(--destructive))"
    },
    {
      title: "% Orders with Reviews",
      value: `${dashboardMetrics.orderMetrics?.total ? Math.round((dashboardMetrics.orderMetrics.withReviews / dashboardMetrics.orderMetrics.total) * 100) : 0}%`,
      description: "Completion rate",
      icon: "Star",
      color: "hsl(var(--chart-2))"
    },
    {
      title: "All-Time Total Buyers",
      value: dashboardMetrics.orderMetrics?.buyers.toString() || "0",
      description: "Unique clients",
      icon: "Users",
      color: "hsl(var(--chart-3))"
    },
  ], [dashboardMetrics.orderMetrics]);

  const buyersMetric = useMemo(() => ({
    title: "Buyers",
    value: dashboardMetrics.orderMetrics?.buyers.toString() || "0",
    description: "Total unique buyers",
    icon: "Users",
    change: "+0%", // Placeholder
    changeType: "increase" as const
  }), [dashboardMetrics.orderMetrics]);

  useEffect(() => {
    async function fetchOverview() {
      if (!date?.from || !date?.to) return;
      try {
        const query = new URLSearchParams({
          from: format(date.from, 'yyyy-MM-dd'),
          to: format(date.to, 'yyyy-MM-dd'),
        });
        const res = await fetch(`/api/dashboard/overview?${query.toString()}`);
        if (!res.ok) throw new Error('Failed to fetch overview');
        const data = await res.json();

        setDashboardMetrics({
          monthlyTarget: data.monthlyTarget,
          requiredDailyRevenue: data.requiredDailyRevenue,
          performance: data.performance,
          revenueByDay: data.revenueByDay,
          previousRevenueByDay: data.previousRevenueByDay,
          keyMetrics: data.keyMetrics,
          orderMetrics: data.orderMetrics
        });

        setFinancialStats([
          {
            title: "Total Revenue",
            value: `$${data.totalRevenue.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            change: `${data.totalRevenue.change >= 0 ? '+' : ''}${data.totalRevenue.change.toFixed(1)}%`,
            changeType: data.totalRevenue.change >= 0 ? "increase" : "decrease",
            dateRange: "vs. last period",
            chartData: data.revenueByDay || [],
            chartType: "bar",
            gradient: "revenue"
          },
          {
            title: "Net Profit",
            value: `$${data.netProfit.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            change: `${data.netProfit.change >= 0 ? '+' : ''}${data.netProfit.change.toFixed(1)}%`,
            changeType: data.netProfit.change >= 0 ? "increase" : "decrease",
            dateRange: "vs. last period",
            chartData: data.revenueByDay || [], // Ideally profit by day
            chartType: "line",
            gradient: "profit"
          },
          {
            title: "Pending Orders",
            value: data.pendingOrders.value.toString(),
            change: `${data.pendingOrders.change >= 0 ? '+' : ''}${data.pendingOrders.change.toFixed(1)}%`,
            changeType: data.pendingOrders.change >= 0 ? "increase" : "decrease",
            dateRange: "vs. last period",
            chartData: Array.from({ length: 10 }, () => ({ value: Math.random() * 10 })),
            chartType: "bar",
            gradient: "expenses"
          },
          {
            title: "Avg. Order Value",
            value: `$${data.averageOrderValue.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            change: `${data.averageOrderValue.change >= 0 ? '+' : ''}${data.averageOrderValue.change.toFixed(1)}%`,
            changeType: data.averageOrderValue.change >= 0 ? "increase" : "decrease",
            dateRange: "vs. last period",
            chartData: Array.from({ length: 10 }, () => ({ value: Math.random() * 100 })),
            chartType: "bar",
            gradient: "aov"
          }
        ]);
      } catch (error) {
        console.error("Error fetching dashboard overview:", error);
      }
    }
    fetchOverview();
  }, [date]);

  const totalRevenue = useMemo(() => revenueByDay.reduce((sum, day) => sum + day.revenue, 0), [revenueByDay]);

  const availableGigs = useMemo(() => {
    if (!selectedSource) return [];
    const sourceData = initialIncomeSources.find(s => s.name === selectedSource);
    return sourceData ? sourceData.gigs : [];
  }, [selectedSource]);

  const createQueryString = (name: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(name, value);
    return params.toString();
  };

  const handleSetDate = (newDate: DateRange | undefined) => {
    setDate(newDate);
    const params = new URLSearchParams(searchParams.toString());
    if (newDate?.from) {
      params.set('from', format(newDate.from, 'yyyy-MM-dd'));
    } else {
      params.delete('from');
    }
    if (newDate?.to) {
      params.set('to', format(newDate.to, 'yyyy-MM-dd'));
    } else {
      params.delete('to');
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleSetTarget = async (newTarget: number, month: string, year: number) => {
    const monthIndex = new Date(Date.parse(month + " 1, 2021")).getMonth();
    const monthKey = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;

    const updatedTargets = { ...monthlyTargets, [monthKey]: newTarget };
    setMonthlyTargets(updatedTargets);

    try {
      await fetch('/api/monthly-targets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year, month: monthIndex + 1, target: newTarget }),
      });
      toast({ title: "Target Set", description: `Target for ${month} ${year} set to $${newTarget.toLocaleString()}.` });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to save target to the database.' });
      setMonthlyTargets(monthlyTargets);
    }
  };

  const handleEditOrder = (orderId: string) => {
    const orderToEdit = recentOrders.find(o => o.id === orderId);
    if (orderToEdit) {
      setEditingOrder(orderToEdit);
      const predefinedReasons = orderToEdit.cancellationReasons?.filter(r => cancellationReasonsList.includes(r)) || [];
      const customReason = orderToEdit.cancellationReasons?.find(r => !cancellationReasonsList.includes(r)) || '';

      form.reset({
        id: orderToEdit.id,
        username: orderToEdit.username,
        date: toZonedTime(orderToEdit.date, 'UTC'),
        amount: orderToEdit.amount,
        source: orderToEdit.source,
        gig: orderToEdit.gig,
        status: orderToEdit.status,
        rating: orderToEdit.rating,
        cancellationReasons: predefinedReasons,
        customCancellationReason: customReason,
      });

      setIsEditDialogOpen(true);
    }
  };

  const onEditSubmit = (values: OrderFormValues) => {
    let finalCancellationReasons: string[] | undefined = undefined;
    if (values.status === 'Cancelled') {
      const reasons = values.cancellationReasons || [];
      if (values.customCancellationReason && values.customCancellationReason.trim()) {
        reasons.push(values.customCancellationReason.trim());
      }
      if (reasons.length > 0) {
        finalCancellationReasons = reasons;
      }
    }

    const updatedOrder: RecentOrder = {
      ...editingOrder!,
      username: values.username,
      avatarUrl: editingOrder!.avatarUrl, // Fix: Preserve avatarUrl
      date: format(values.date, "yyyy-MM-dd"),
      amount: values.amount,
      source: values.source,
      gig: values.gig,
      status: values.status,
      rating: values.rating ?? undefined,
      cancellationReasons: finalCancellationReasons,
    };

    setRecentOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
    toast({
      title: "Order Updated",
      description: `Order ${updatedOrder.id} has been successfully updated.`,
    });

    setIsEditDialogOpen(false);
    setEditingOrder(null);
  };

  return (
    <>
      <main className="flex flex-1 flex-col gap-8 p-6 md:gap-10 md:p-10 bg-background min-h-screen animate-in fade-in duration-500">
        <DashboardHeader
          date={date}
          setDate={handleSetDate}
          onSetTarget={handleSetTarget}
          daysLeft={daysLeft}
          monthlyTargets={monthlyTargets}
        />

        <section>
          <h2 className="text-xl font-semibold mb-4 text-foreground">Financial Overview</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {financialStats.map((card) => (
              <FinancialStatCard key={card.title} {...card} />
            ))}
          </div>
        </section>

        <div className="grid grid-cols-1 gap-4 md:gap-8 lg:grid-cols-5">
          <div className="lg:col-span-4">
            <Suspense fallback={<Skeleton className="h-[340px] w-full" />}>
              <RevenueChart
                data={dashboardMetrics.revenueByDay.length > 0 ? dashboardMetrics.revenueByDay : revenueByDay}
                previousData={dashboardMetrics.previousRevenueByDay.length > 0 ? dashboardMetrics.previousRevenueByDay : previousRevenueByDay}
                requiredDailyRevenue={dashboardMetrics.requiredDailyRevenue}
              />
            </Suspense>
          </div>
          <div className="lg:col-span-1">
            <Suspense fallback={<Skeleton className="h-full w-full rounded-lg" />}>
              <PerformanceRadialChart performance={dashboardMetrics.performance} />
            </Suspense>
          </div>
        </div>

        <StatsGrid
          title="Key Metrics"
          stats={keyMetrics}
          gridClassName="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
        />

        <StatsGrid
          title="Other Metrics"
          stats={otherMetrics}
          gridClassName="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
        />

        <section>
          <h2 className="text-xl font-semibold mb-4">Buyer Breakdown</h2>
          {buyersMetric && (
            <div className="mt-4">
              <StatCard {...buyersMetric} />
            </div>
          )}
        </section>

        <div className="grid grid-cols-1 gap-4 md:gap-8 lg:grid-cols-3">
          <Suspense fallback={<Skeleton className="h-[300px] w-full rounded-lg" />}>
            <TopClientsChart data={topClients} totalRevenue={totalRevenue} />
          </Suspense>
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

        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>
              An overview of your most recent orders.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RecentOrders orders={recentOrders} onEditOrder={handleEditOrder} />
          </CardContent>
        </Card>

      </main>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Order</DialogTitle>
            <DialogDescription>
              Fill in the details below to update the order.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onEditSubmit)} className="space-y-4">
              <div className="space-y-4 max-h-[70vh] overflow-y-auto p-1 pr-4">

                <div className="space-y-4 rounded-md border p-4">
                  <FormLabel className="text-base font-semibold">Order Details</FormLabel>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Order Date*</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Order ID*</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., ORD006" {...field} disabled={!!editingOrder} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount*</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="e.g., 499.99" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4 rounded-md border p-4">
                  <FormLabel className="text-base font-semibold">Client & Source</FormLabel>
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username*</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., olivia.m" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="source"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Source*</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select an income source" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {incomeSourceNames.map(source => (
                                <SelectItem key={source} value={source}>{source}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="gig"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gig*</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                            disabled={!selectedSource || availableGigs.length === 0}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={!selectedSource ? "Select a source first" : "Select a gig"} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {availableGigs.map(gig => (
                                <SelectItem key={gig.id} value={gig.name}>{gig.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-4 rounded-md border p-4">
                  <FormLabel className="text-base font-semibold">Status & Rating</FormLabel>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Order Status*</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="In Progress">In Progress</SelectItem>
                              <SelectItem value="Completed">Completed</SelectItem>
                              <SelectItem value="Cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="rating"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Rating (0.0 - 5.0)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.1"
                              placeholder="e.g., 4.2"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))}
                              value={field.value ?? ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  {orderStatus === 'Cancelled' && (
                    <div className="space-y-4 pt-4">
                      <FormField
                        control={form.control}
                        name="cancellationReasons"
                        render={() => (
                          <FormItem>
                            <div className="mb-4">
                              <FormLabel className="text-base">Reason for Cancellation</FormLabel>
                              <FormDescription>
                                Select any applicable reasons.
                              </FormDescription>
                            </div>
                            <div className="space-y-2">
                              {cancellationReasonsList.map((reason) => (
                                <FormField
                                  key={reason}
                                  control={form.control}
                                  name="cancellationReasons"
                                  render={({ field }) => {
                                    return (
                                      <FormItem
                                        key={reason}
                                        className="flex flex-row items-start space-x-3 space-y-0"
                                      >
                                        <FormControl>
                                          <Checkbox
                                            checked={field.value?.includes(reason)}
                                            onCheckedChange={(checked) => {
                                              return checked
                                                ? field.onChange([...(field.value || []), reason])
                                                : field.onChange(
                                                  field.value?.filter(
                                                    (value) => value !== reason
                                                  )
                                                )
                                            }}
                                          />
                                        </FormControl>
                                        <FormLabel className="font-normal">
                                          {reason}
                                        </FormLabel>
                                      </FormItem>
                                    )
                                  }}
                                />
                              ))}
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="customCancellationReason"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Other Reason</FormLabel>
                            <FormControl>
                              <Textarea placeholder="If other, please specify reason for cancellation..." {...field} value={field.value ?? ''} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                </div>
              </div>

              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="secondary">Cancel</Button>
                </DialogClose>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
