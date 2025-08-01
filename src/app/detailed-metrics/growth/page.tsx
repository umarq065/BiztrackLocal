
"use client";

import { useState, useEffect, memo } from "react";
import { useSearchParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { type GrowthMetricData } from "@/lib/services/analyticsService";
import { GrowthMetrics } from "@/components/detailed-metrics/growth-metrics";
import { Skeleton } from "@/components/ui/skeleton";

const GrowthMetricsPage = () => {
    const searchParams = useSearchParams();
    const { toast } = useToast();

    const [growthMetrics, setGrowthMetrics] = useState<GrowthMetricData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const from = searchParams.get('from');
    const to = searchParams.get('to');

    useEffect(() => {
        async function fetchGrowthMetrics() {
            if (!from || !to) return;
            setIsLoading(true);

            try {
                const res = await fetch(`/api/analytics/growth?from=${from}&to=${to}`);
                if (!res.ok) throw new Error('Failed to fetch growth metrics.');
                const data = await res.json();
                setGrowthMetrics(data);
            } catch (e: any) {
                 console.error(e);
                 toast({
                    variant: 'destructive',
                    title: 'Error Loading Metrics',
                    description: e.message || 'Could not load growth metrics data.',
                });
            } finally {
                setIsLoading(false);
            }
        }
        fetchGrowthMetrics();
    }, [from, to, toast]);

    return (
        <>
            {isLoading ? <Skeleton className="h-[400px] w-full" /> : growthMetrics && <GrowthMetrics data={growthMetrics} />}
        </>
    );
};

export default memo(GrowthMetricsPage);
