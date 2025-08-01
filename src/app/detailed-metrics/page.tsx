
"use client";

import { useState, useEffect, memo, useCallback, useMemo } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { format, subDays, differenceInDays } from 'date-fns';
import type { DateRange } from "react-day-picker";
import { DateFilter } from "@/components/dashboard/date-filter";
import { FinancialMetrics } from "@/components/detailed-metrics/financial-metrics";
import { ClientMetrics } from "@/components/detailed-metrics/client-metrics";
import { SalesMetrics } from "@/components/detailed-metrics/sales-metrics";
import { MarketingMetrics } from "@/components/detailed-metrics/marketing-metrics";
import { ProjectMetrics } from "@/components/detailed-metrics/project-metrics";
import { GrowthMetrics } from "@/components/detailed-metrics/growth-metrics";
import { type GrowthMetricData, type FinancialMetricData, type ClientMetricData } from "@/lib/services/analyticsService";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const DetailedMetricsPageComponent = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [date, setDate] = useState<DateRange | undefined>(() => {
    const fromParam = searchParams.get('from');
    const toParam = searchParams.get('to');
    if (fromParam && toParam) {
        const from = new Date(fromParam.replace(/-/g, '/'));
        const to = new Date(toParam.replace(/-/g, '/'));
        if (!isNaN(from.getTime()) && !isNaN(to.getTime())) {
            return { from, to };
        }
    }
    const today = new Date();
    const from = new Date(today.getFullYear(), today.getMonth(), 1);
    return { from, to: today };
  });

  const [growthMetrics, setGrowthMetrics] = useState<GrowthMetricData | null>(null);
  const [financialMetrics, setFinancialMetrics] = useState<FinancialMetricData | null>(null);
  const [clientMetrics, setClientMetrics] = useState<ClientMetricData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const createQueryString = useCallback(
    (paramsToUpdate: Record<string, string | null>) => {
        const params = new URLSearchParams(searchParams.toString());
        for (const [name, value] of Object.entries(paramsToUpdate)) {
            if (value) {
                params.set(name, value);
            } else {
                params.delete(name);
            }
        }
        return params.toString();
    },
    [searchParams]
  );
  
  const handleSetDate = (newDate: DateRange | undefined) => {
    setDate(newDate);
    router.push(`${pathname}?${createQueryString({
        from: newDate?.from ? format(newDate.from, 'yyyy-MM-dd') : null,
        to: newDate?.to ? format(newDate.to, 'yyyy-MM-dd') : null,
    })}`, { scroll: false });
  };
  
  useEffect(() => {
    async function fetchAllMetrics() {
      if (!date?.from || !date?.to) return;
      setIsLoading(true);
      
      const from = format(date.from, 'yyyy-MM-dd');
      const to = format(date.to, 'yyyy-MM-dd');
      
      try {
        const [growthRes, financialRes, clientRes] = await Promise.all([
            fetch(`/api/analytics/growth?from=${from}&to=${to}`),
            fetch(`/api/analytics/financials?from=${from}&to=${to}`),
            fetch(`/api/analytics/client-metrics?from=${from}&to=${to}`)
        ]);

        if (!growthRes.ok) throw new Error('Failed to fetch growth metrics.');
        if (!financialRes.ok) throw new Error('Failed to fetch financial metrics.');
        if (!clientRes.ok) throw new Error('Failed to fetch client metrics.');
        
        const growthData = await growthRes.json();
        const financialData = await financialRes.json();
        const clientData = await clientRes.json();

        setGrowthMetrics(growthData);
        setFinancialMetrics(financialData);
        setClientMetrics(clientData);

      } catch (e: any) {
        console.error(e);
        toast({
          variant: 'destructive',
          title: 'Error Loading Metrics',
          description: e.message || 'Could not load key metrics data.',
        });
      } finally {
        setIsLoading(false);
      }
    }
    fetchAllMetrics();
  }, [date, toast]);

  const previousPeriodLabel = useMemo(() => {
    if (!date?.from || !date?.to) return "previous period";
    const duration = differenceInDays(date.to, date.from);
    const prevTo = subDays(date.from, 1);
    const prevFrom = subDays(prevTo, duration);
    return `from ${format(prevFrom, 'MMM d')} - ${format(prevTo, 'MMM d, yyyy')}`;
  }, [date]);


  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center">
        <h1 className="font-headline text-lg font-semibold md:text-2xl">
          Detailed Metrics
        </h1>
        <div className="ml-auto flex items-center gap-2">
          <DateFilter date={date} setDate={handleSetDate} />
        </div>
      </div>

      <Tabs defaultValue="financials" className="space-y-4">
        <TabsList>
          <TabsTrigger value="financials">Financial</TabsTrigger>
          <TabsTrigger value="clients">Client</TabsTrigger>
          <TabsTrigger value="growth">Growth</TabsTrigger>
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="marketing">Marketing</TabsTrigger>
          <TabsTrigger value="project">Project & Delivery</TabsTrigger>
        </TabsList>
        <TabsContent value="financials" className="space-y-4">
          {isLoading ? <Skeleton className="h-[400px] w-full" /> : financialMetrics && <FinancialMetrics data={financialMetrics} previousPeriodLabel={previousPeriodLabel} />}
        </TabsContent>
        <TabsContent value="clients" className="space-y-4">
          {isLoading ? <Skeleton className="h-[400px] w-full" /> : clientMetrics && <ClientMetrics data={clientMetrics} previousPeriodLabel={previousPeriodLabel} />}
        </TabsContent>
        <TabsContent value="growth" className="space-y-4">
          {isLoading ? <Skeleton className="h-[400px] w-full" /> : growthMetrics && <GrowthMetrics data={growthMetrics} previousPeriodLabel={previousPeriodLabel} />}
        </TabsContent>
        <TabsContent value="sales" className="space-y-4">
          <SalesMetrics />
        </TabsContent>
        <TabsContent value="marketing" className="space-y-4">
          <MarketingMetrics />
        </TabsContent>
        <TabsContent value="project" className="space-y-4">
          <ProjectMetrics />
        </TabsContent>
      </Tabs>
    </main>
  );
}

const MemoizedDetailedMetricsPage = memo(DetailedMetricsPageComponent);

export default function DetailedMetricsPage() {
  return <MemoizedDetailedMetricsPage />;
}
