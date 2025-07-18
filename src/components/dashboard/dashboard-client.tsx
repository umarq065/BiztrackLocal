

"use client";

import { useState, useEffect, lazy, Suspense, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { CalendarIcon, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { orderFormSchema, cancellationReasonsList, type OrderFormValues } from "@/lib/data/orders-data";
import { initialIncomeSources } from "@/lib/data/incomes-data";
import type { RecentOrder, Order } from "@/lib/placeholder-data";


// Lazy load heavy chart components to speed up initial page load
const TopClientsChart = lazy(() => import("./top-clients-chart"));
const IncomeChart = lazy(() => import("./income-chart"));

const incomeSourceNames = initialIncomeSources.map(s => s.name);

// A more robust date parsing function to avoid performance issues.
const parseDateString = (dateString: string): Date => {
  const [year, month, day] = dateString.split('-').map(Number);
  // In JavaScript's Date, months are 0-indexed (0 for January, 11 for December)
  return new Date(year, month - 1, day);
};

export function DashboardClient({
  stats: initialStats,
  revenueByDay,
  previousRevenueByDay,
  recentOrders: initialRecentOrders,
  aiInsights,
  topClients,
  incomeBySource,
}: DashboardData) {
  const [stats, setStats] = useState<Stat[]>(initialStats);
  const [date, setDate] = useState<DateRange | undefined>();
  const [daysLeft, setDaysLeft] = useState(0);

  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>(initialRecentOrders);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  const [monthlyTargets, setMonthlyTargets] = useState<Record<string, number>>({ "2024-06": 50000 });

  const { toast } = useToast();

  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderFormSchema),
  });

  const orderStatus = form.watch("status");
  const selectedSource = form.watch("source");
  
  useEffect(() => {
    // This useEffect is now just for setting up dates and initial stats.
    const today = new Date();
    const from = new Date(today.getFullYear(), today.getMonth(), 1);
    setDate({ from: from, to: today });
    
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const remainingDays = lastDayOfMonth.getDate() - today.getDate();
    setDaysLeft(remainingDays);
  }, []);
  
  const currentMonthKey = useMemo(() => {
    const today = new Date();
    return format(today, 'yyyy-MM');
  }, []);
  
  const currentTarget = useMemo(() => {
    return monthlyTargets[currentMonthKey] || 0;
  }, [monthlyTargets, currentMonthKey]);

  useEffect(() => {
    const targetStatIndex = stats.findIndex((s) => s.title.startsWith("Target for"));
    if (targetStatIndex !== -1) {
      const today = new Date();
      const monthKey = format(today, 'yyyy-MM');
      const target = monthlyTargets[monthKey] || 0;
      const monthName = format(today, 'MMMM');
      
      setStats(currentStats => {
        const newStats = [...currentStats];
        newStats[targetStatIndex] = {
          ...newStats[targetStatIndex],
          title: `Target for ${monthName}`,
          value: `$${target.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          description: `Revenue goal for ${monthName} ${today.getFullYear()}`
        };
        // Avoid re-setting state if it's the same to prevent loops
        if (JSON.stringify(newStats) !== JSON.stringify(currentStats)) {
          return newStats;
        }
        return currentStats;
      });
    }
  }, [monthlyTargets, stats]);

  const availableGigs = useMemo(() => {
    if (!selectedSource) return [];
    const sourceData = initialIncomeSources.find(s => s.name === selectedSource);
    return sourceData ? sourceData.gigs : [];
  }, [selectedSource]);

  const handleEditOrder = (orderId: string) => {
    const orderToEdit = recentOrders.find(o => o.id === orderId);
    if (orderToEdit) {
      setEditingOrder(orderToEdit);
      const predefinedReasons = orderToEdit.cancellationReasons?.filter(r => cancellationReasonsList.includes(r)) || [];
      const customReason = orderToEdit.cancellationReasons?.find(r => !cancellationReasonsList.includes(r)) || '';

      form.reset({
          id: orderToEdit.id,
          username: orderToEdit.clientUsername,
          date: parseDateString(orderToEdit.date),
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
      date: format(values.date, "yyyy-MM-dd"),
      amount: values.amount,
      source: values.source,
      gig: values.gig,
      status: values.status,
      rating: values.rating,
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

  const handleSetTarget = (newTarget: number, month: string, year: number) => {
    const monthIndex = new Date(Date.parse(month +" 1, 2021")).getMonth();
    const monthKey = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
    
    const updatedTargets = { ...monthlyTargets, [monthKey]: newTarget };
    setMonthlyTargets(updatedTargets);

    toast({ title: "Target Set", description: `Target for ${month} ${year} set to $${newTarget.toLocaleString()}.` });
  };
  
  const adrStat = stats.find((s) => s.title === "Avg Daily Revenue (ADR)");
  
  const totalRevenue = useMemo(() => revenueByDay.reduce((sum, day) => sum + day.revenue, 0), [revenueByDay]);
  
  const rdrStat = useMemo(() => {
    const today = new Date();
    const monthKey = format(today, 'yyyy-MM');
    const target = monthlyTargets[monthKey] || 0;
    
    const remainingRevenue = Math.max(0, target - totalRevenue);
    const requiredDaily = daysLeft > 0 ? remainingRevenue / daysLeft : 0;
    
    const existingRdrStat = stats.find(s => s.title === "Req. Daily Revenue (RDR)");

    return {
      ...existingRdrStat,
      icon: "Goal",
      title: "Req. Daily Revenue (RDR)",
      value: `$${requiredDaily.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      description: "To meet your monthly target"
    };
  }, [monthlyTargets, totalRevenue, daysLeft, stats, currentMonthKey]);

  const keyMetrics = useMemo(() => {
    const targetStat = stats.find((s) => s.title.startsWith("Target for"));
    return [adrStat, rdrStat, targetStat].filter(Boolean) as Stat[];
  }, [adrStat, rdrStat, stats]);


  const otherMetrics = useMemo(() => stats.filter((s) =>
    [
      "Total Orders (Completed)",
      "Cancelled Orders",
      "% Orders with Reviews",
      "All-Time Total Buyers",
    ].includes(s.title)
  ).map((s, i) => ({
      ...s,
      color: s.title.includes("Cancelled") ? 'hsl(var(--destructive))' : `hsl(var(--chart-${(i % 5) + 1}))`
  })), [stats]);

  const buyersMetric = useMemo(() => stats.find(s => s.title === 'Buyers'), [stats]);

  const performanceValue = useMemo(() => {
    const target = monthlyTargets[currentMonthKey] || 0;
    if (target === 0) return 0;
    return (totalRevenue / target) * 100;
  }, [totalRevenue, monthlyTargets, currentMonthKey]);

  return (
    <>
    <main className="flex flex-1 flex-col gap-6 p-4 md:gap-8 md:p-8">
      <DashboardHeader 
        date={date}
        setDate={setDate}
        onSetTarget={handleSetTarget}
        daysLeft={daysLeft}
        monthlyTargets={monthlyTargets}
      />

      <section>
        <h2 className="text-xl font-semibold mb-4">Financial Overview</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {financialCardsData.map((card) => (
            <FinancialStatCard key={card.title} {...card} />
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 md:gap-8 lg:grid-cols-5">
        <div className="lg:col-span-4">
          <Suspense fallback={<Skeleton className="h-[340px] w-full" />}>
            <RevenueChart
              data={revenueByDay}
              previousData={previousRevenueByDay}
              requiredDailyRevenue={rdrStat.value ? parseFloat(rdrStat.value.replace(/[^0-9.-]+/g, "")) : 0}
            />
          </Suspense>
        </div>
        <div className="lg:col-span-1">
          <Suspense fallback={<Skeleton className="h-full w-full rounded-lg" />}>
            <PerformanceRadialChart performance={performanceValue} />
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
                                                    <Textarea placeholder="If other, please specify reason for cancellation..." {...field} />
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
