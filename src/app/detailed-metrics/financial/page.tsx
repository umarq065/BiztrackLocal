
"use client";

import { useState, useEffect, memo } from "react";
import { useSearchParams } from "next/navigation";
import { format } from 'date-fns';
import { useToast } from "@/hooks/use-toast";
import { type FinancialMetricData } from "@/lib/services/analyticsService";
import { FinancialMetrics } from "@/components/detailed-metrics/financial-metrics";
import { Skeleton } from "@/components/ui/skeleton";

const FinancialMetricsPage = () => {
    const searchParams = useSearchParams();
    const { toast } = useToast();

    const [financialMetrics, setFinancialMetrics] = useState<FinancialMetricData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const from = searchParams.get('from');
    const to = searchParams.get('to');

    useEffect(() => {
        async function fetchFinancialMetrics() {
            if (!from || !to) return;
            setIsLoading(true);

            try {
                const res = await fetch(`/api/analytics/financials?from=${from}&to=${to}`);
                if (!res.ok) throw new Error('Failed to fetch financial metrics.');
                const data = await res.json();
                setFinancialMetrics(data);
            } catch (e: any) {
                console.error(e);
                toast({
                    variant: 'destructive',
                    title: 'Error Loading Metrics',
                    description: e.message || 'Could not load financial metrics data.',
                });
            } finally {
                setIsLoading(false);
            }
        }
        fetchFinancialMetrics();
    }, [from, to, toast]);

    return (
        <>
            {isLoading ? <Skeleton className="h-[400px] w-full" /> : financialMetrics && <FinancialMetrics data={financialMetrics} />}
        </>
    );
};

export default memo(FinancialMetricsPage);
