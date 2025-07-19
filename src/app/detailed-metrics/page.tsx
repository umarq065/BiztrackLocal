

"use client";

import { useState, useEffect, memo, useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { format } from 'date-fns';
import type { DateRange } from "react-day-picker";
import { DateFilter } from "@/components/dashboard/date-filter";
import { FinancialMetrics } from "@/components/detailed-metrics/financial-metrics";
import { ClientMetrics } from "@/components/detailed-metrics/client-metrics";
import { SalesMetrics } from "@/components/detailed-metrics/sales-metrics";
import { MarketingMetrics } from "@/components/detailed-metrics/marketing-metrics";
import { ProjectMetrics } from "@/components/detailed-metrics/project-metrics";
import { GrowthMetrics } from "@/components/detailed-metrics/growth-metrics";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { initialIncomeSources } from "@/lib/data/incomes-data";

const incomeSourceNames = initialIncomeSources.map((s) => s.name);

const DetailedMetricsPageComponent = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

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

  const [source, setSource] = useState("all");

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


  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center">
        <h1 className="font-headline text-lg font-semibold md:text-2xl">
          Detailed Metrics
        </h1>
        <div className="ml-auto flex items-center gap-2">
           <Select value={source} onValueChange={setSource}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              {incomeSourceNames.map((sourceName) => (
                <SelectItem key={sourceName} value={sourceName}>
                  {sourceName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DateFilter date={date} setDate={handleSetDate} />
        </div>
      </div>

      <div className="space-y-8">
        <GrowthMetrics />
        <FinancialMetrics />
        <ClientMetrics />
        <SalesMetrics />
        <MarketingMetrics />
        <ProjectMetrics />
      </div>
    </main>
  );
}

const MemoizedDetailedMetricsPage = memo(DetailedMetricsPageComponent);

export default function DetailedMetricsPage() {
  return <MemoizedDetailedMetricsPage />;
}
