
"use client";

import { useState, useCallback, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { format, subDays, differenceInDays } from 'date-fns';
import type { DateRange } from "react-day-picker";
import { DateFilter } from "@/components/dashboard/date-filter";
import { ClientMetrics } from "@/components/detailed-metrics/client-metrics";
import { GrowthMetrics } from "@/components/detailed-metrics/growth-metrics";
import { MarketingMetrics } from "@/components/detailed-metrics/marketing-metrics";
import { ProjectMetrics } from "@/components/detailed-metrics/project-metrics";
import { OrderMetrics } from "@/components/detailed-metrics/order-metrics";
import { FinancialMetrics } from "@/components/detailed-metrics/financial-metrics";
import IncomeSourceFilter from "@/components/detailed-metrics/income-source-filter";
import type { IncomeSource } from "@/lib/data/incomes-data";


export default function DetailedMetricsPage() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [date, setDate] = useState<DateRange | undefined>(undefined);
    const [allIncomeSources, setAllIncomeSources] = useState<string[]>([]);
    const [selectedSources, setSelectedSources] = useState<string[]>([]);
    const [isSourcesLoading, setIsSourcesLoading] = useState(true);

    useEffect(() => {
        const fromParam = searchParams.get('from');
        const toParam = searchParams.get('to');
        if (fromParam && toParam) {
            const from = new Date(fromParam.replace(/-/g, '/'));
            const to = new Date(toParam.replace(/-/g, '/'));
            if (!isNaN(from.getTime()) && !isNaN(to.getTime())) {
                setDate({ from, to });
            }
        } else {
             const today = new Date();
             const from = new Date(today.getFullYear(), today.getMonth(), 1);
             setDate({ from, to: today });
        }
        
        async function fetchSources() {
            setIsSourcesLoading(true);
            try {
                const res = await fetch('/api/incomes');
                if (!res.ok) throw new Error('Failed to fetch income sources');
                const data: IncomeSource[] = await res.json();
                const sourceNames = data.map(s => s.name);
                setAllIncomeSources(sourceNames);
                setSelectedSources(sourceNames); // Initially select all
            } catch (error) {
                console.error("Error fetching income sources:", error);
            } finally {
                setIsSourcesLoading(false);
            }
        }
        fetchSources();

    }, [searchParams]);

    const createQueryString = useCallback(
        (paramsToUpdate: Record<string, string | null>) => {
            const params = new URLSearchParams(searchParams.toString());
            for (const [name, value] of Object.entries(paramsToUpdate)) {
                if (value && value.length > 0) {
                    params.set(name, value);
                } else {
                    params.delete(name);
                }
            }
            return params.toString();
        },
        [searchParams]
    );
    
    const updateUrl = (newParams: Record<string, string | null>) => {
        router.push(`${pathname}?${createQueryString(newParams)}`, { scroll: false });
    };

    const handleSetDate = (newDate: DateRange | undefined) => {
        setDate(newDate);
        updateUrl({
            from: newDate?.from ? format(newDate.from, 'yyyy-MM-dd') : null,
            to: newDate?.to ? format(newDate.to, 'yyyy-MM-dd') : null,
        });
    };

    const previousPeriodLabel = (() => {
        if (!date?.from || !date?.to) return "previous period";
        const duration = differenceInDays(date.to, date.from);
        const prevTo = subDays(date.from, 1);
        const prevFrom = subDays(prevTo, duration);
        return `from ${format(prevFrom, 'MMM d')} - ${format(prevTo, 'MMM d, yyyy')}`;
    })();


    return (
        <main className="flex flex-1 flex-col gap-6 p-4 md:gap-8 md:p-8">
            <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="font-headline text-lg font-semibold md:text-2xl">
                    Detailed Metrics
                </h1>
                <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center ml-auto">
                     <div className="grid gap-1">
                        <IncomeSourceFilter 
                            sources={allIncomeSources}
                            selectedSources={selectedSources}
                            onSelectionChange={setSelectedSources}
                            isLoading={isSourcesLoading}
                        />
                        <div className="h-5"></div>
                    </div>
                    <DateFilter date={date} setDate={handleSetDate} />
                </div>
            </div>

            <div className="space-y-6">
                <FinancialMetrics date={date} selectedSources={selectedSources} />
                <OrderMetrics date={date} selectedSources={selectedSources} />
                <ClientMetrics date={date} selectedSources={selectedSources} />
                <GrowthMetrics date={date} selectedSources={selectedSources} previousPeriodLabel={previousPeriodLabel} />
                <MarketingMetrics date={date} />
                <ProjectMetrics date={date} />
            </div>
        </main>
    );
}
