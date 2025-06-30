
"use client";

import { useState, useEffect } from "react";
import type { DateRange } from "react-day-picker";
import { DateFilter } from "@/components/dashboard/date-filter";
import { FinancialMetrics } from "@/components/detailed-metrics/financial-metrics";
import { ClientMetrics } from "@/components/detailed-metrics/client-metrics";
import { SalesMetrics } from "@/components/detailed-metrics/sales-metrics";
import { MarketingMetrics } from "@/components/detailed-metrics/marketing-metrics";
import { ProjectMetrics } from "@/components/detailed-metrics/project-metrics";
import { TeamMetrics } from "@/components/detailed-metrics/team-metrics";
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

export default function DetailedMetricsPage() {
  const [date, setDate] = useState<DateRange | undefined>();
  const [source, setSource] = useState("all");

  useEffect(() => {
    const today = new Date();
    const from = new Date(today.getFullYear(), today.getMonth(), 1);
    setDate({ from, to: today });
  }, []);

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
          <DateFilter date={date} setDate={setDate} />
        </div>
      </div>

      <div className="space-y-8">
        <GrowthMetrics />
        <FinancialMetrics />
        <ClientMetrics />
        <SalesMetrics />
        <MarketingMetrics />
        <ProjectMetrics />
        <TeamMetrics />
      </div>
    </main>
  );
}
