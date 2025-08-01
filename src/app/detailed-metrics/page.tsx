
"use client";

import { useState, useCallback, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { format, subDays, differenceInDays } from 'date-fns';
import type { DateRange } from "react-day-picker";
import { DateFilter } from "@/components/dashboard/date-filter";
import { FinancialMetrics } from "@/components/detailed-metrics/financial-metrics";
import { ClientMetrics } from "@/components/detailed-metrics/client-metrics";
import { GrowthMetrics } from "@/components/detailed-metrics/growth-metrics";
import { SalesMetrics } from "@/components/detailed-metrics/sales-metrics";
import { MarketingMetrics } from "@/components/detailed-metrics/marketing-metrics";
import { ProjectMetrics } from "@/components/detailed-metrics/project-metrics";

export default function DetailedMetricsPage() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [date, setDate] = useState<DateRange | undefined>();

    useEffect(() => {
        const fromParam = searchParams.get('from');
        const toParam = searchParams.get('to');
        if (fromParam && toParam) {
            const from = new Date(fromParam.replace(/-/g, '/'));
            const to = new Date(toParam.replace(/-/g, '/'));
            if (!isNaN(from.getTime()) && !isNaN(to.getTime())) {
                setDate({ from, to });
                return;
            }
        }
        // Fallback to default if params are invalid or not present
        const today = new Date();
        const from = new Date(today.getFullYear(), today.getMonth(), 1);
        setDate({ from, to: today });
    }, [searchParams]);

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

    const fromParam = searchParams.get('from');
    const toParam = searchParams.get('to');
    const previousPeriodLabel = (() => {
        if (!fromParam || !toParam) return "previous period";
        const from = new Date(fromParam.replace(/-/g, '/'));
        const to = new Date(toParam.replace(/-/g, '/'));
        const duration = differenceInDays(to, from);
        const prevTo = subDays(from, 1);
        const prevFrom = subDays(prevTo, duration);
        return `from ${format(prevFrom, 'MMM d')} - ${format(prevTo, 'MMM d, yyyy')}`;
    })();


    return (
        <main className="flex flex-1 flex-col gap-6 p-4 md:gap-8 md:p-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <h1 className="font-headline text-lg font-semibold md:text-2xl">
                    Detailed Metrics
                </h1>
                <div className="ml-auto flex items-center gap-2">
                    <DateFilter date={date} setDate={handleSetDate} />
                </div>
            </div>

            <div className="space-y-6">
                <FinancialMetrics previousPeriodLabel={previousPeriodLabel} />
                <ClientMetrics />
                <GrowthMetrics previousPeriodLabel={previousPeriodLabel} />
                <SalesMetrics />
                <MarketingMetrics />
                <ProjectMetrics />
            </div>
        </main>
    );
}
