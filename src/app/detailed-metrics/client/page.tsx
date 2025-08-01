
"use client";

import { useState, useEffect, memo } from "react";
import { useSearchParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { type ClientMetricData } from "@/lib/services/analyticsService";
import { ClientMetrics } from "@/components/detailed-metrics/client-metrics";
import { Skeleton } from "@/components/ui/skeleton";

const ClientMetricsPage = () => {
    const searchParams = useSearchParams();
    const { toast } = useToast();
    
    const [clientMetrics, setClientMetrics] = useState<ClientMetricData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    
    useEffect(() => {
        async function fetchClientMetrics() {
            if (!from || !to) return;
            setIsLoading(true);
            
            try {
                const res = await fetch(`/api/analytics/client-metrics?from=${from}&to=${to}`);
                if (!res.ok) throw new Error('Failed to fetch client metrics.');
                const data = await res.json();
                setClientMetrics(data);
            } catch (e: any) {
                 console.error(e);
                 toast({
                    variant: 'destructive',
                    title: 'Error Loading Metrics',
                    description: e.message || 'Could not load client metrics data.',
                });
            } finally {
                setIsLoading(false);
            }
        }
        fetchClientMetrics();
    }, [from, to, toast]);

    return (
        <>
            {isLoading ? <Skeleton className="h-[400px] w-full" /> : clientMetrics && <ClientMetrics data={clientMetrics} />}
        </>
    );
}

export default memo(ClientMetricsPage);
