
"use client";

import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUp, ArrowDown, EyeOff, BarChart, Eye, MousePointerClick, MessageSquare, Percent } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { format, subDays, differenceInDays } from "date-fns";
import type { DateRange } from "react-day-picker";
import { Skeleton } from "../ui/skeleton";
import type { PerformanceMetricData } from "@/lib/services/analyticsService";
import { useToast } from "@/hooks/use-toast";

const formatValue = (value: number, type: 'number' | 'currency' | 'percentage') => {
    switch (type) {
        case 'currency': return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        case 'percentage': return `${value.toFixed(1)}%`;
        default: return value.toLocaleString();
    }
}

interface PerformanceMetricsProps {
    date: DateRange | undefined;
    selectedSources: string[];
}

export function PerformanceMetrics({ date, selectedSources }: PerformanceMetricsProps) {
  const [showChart, setShowChart] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [metrics, setMetrics] = useState<PerformanceMetricData | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchData() {
        if (!date?.from || !date?.to || selectedSources.length === 0) {
            setIsLoading(false);
            setMetrics(null);
            return;
        }
        setIsLoading(true);
        try {
            const query = new URLSearchParams({
                from: format(date.from, 'yyyy-MM-dd'),
                to: format(date.to, 'yyyy-MM-dd'),
                sources: selectedSources.join(','),
            });
            const res = await fetch(`/api/analytics/performance-metrics?${query.toString()}`);
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Failed to fetch performance metrics');
            }
            const data: PerformanceMetricData = await res.json();
            setMetrics(data);
        } catch (e) {
            console.error("Error fetching performance metrics:", e);
            toast({
                variant: "destructive",
                title: "Error",
                description: (e as Error).message || "Could not load performance metrics.",
            });
            setMetrics(null);
        } finally {
            setIsLoading(false);
        }
    }
    fetchData();
  }, [date, selectedSources, toast]);

  const previousPeriodLabel = useMemo(() => {
      if (!date?.from || !date?.to) return "previous period";
      const duration = differenceInDays(date.to, date.from);
      const prevTo = subDays(date.from, 1);
      const prevFrom = subDays(prevTo, duration);
      return `from ${format(prevFrom, 'MMM d')} to ${format(prevTo, 'MMM d')}`;
  }, [date]);

  const renderMetricCard = (
      name: string,
      data: PerformanceMetricData[keyof PerformanceMetricData],
      formula: string,
      type: 'number' | 'percentage' = 'number',
      invertColor = false
  ) => {
      const { value, change, previousValue, previousPeriodChange } = data;
      
      const changeType = change >= 0 ? "increase" : "decrease";
      const isPositive = invertColor ? changeType === "decrease" : changeType === "increase";

      const prevChangeType = previousPeriodChange >= 0 ? "increase" : "decrease";
      const isPrevPositive = invertColor ? prevChangeType === "decrease" : prevChangeType === "increase";
      
      const displayValue = formatValue(value, type);
      const displayPreviousValue = formatValue(previousValue, type);

      const displayChange = type === 'percentage' ? `${change.toFixed(1)}pp` : `${Math.abs(change).toFixed(1)}%`;
      const displayPrevChange = type === 'percentage' ? `${previousPeriodChange.toFixed(1)}pp` : `${Math.abs(previousPeriodChange).toFixed(1)}%`;


      return (
          <div key={name} className="rounded-lg border bg-background/50 p-4 flex flex-col justify-between">
              <div>
                  <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-muted-foreground">{name}</p>
                      {change != null && (
                          <span className={cn("flex items-center gap-1 text-xs font-semibold", isPositive ? "text-green-600" : "text-red-600")}>
                              {changeType === "increase" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                              {displayChange}
                          </span>
                      )}
                  </div>
                  <p className="text-2xl font-bold mt-1">{displayValue}</p>
              </div>
              <div className="mt-2 pt-2 border-t space-y-1 text-xs">
                   {previousPeriodChange != null && (
                        <p className={cn("flex items-center gap-1 font-semibold", isPrevPositive ? "text-green-600" : "text-red-600")}>
                            {prevChangeType === "increase" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                            {displayPrevChange}
                        </p>
                   )}
                   <p className="text-muted-foreground">vs {displayPreviousValue} ({previousPeriodLabel})</p>
                   <p className="text-muted-foreground pt-1">{formula}</p>
              </div>
          </div>
      );
  }

  const renderContent = () => {
    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[180px] w-full" />)}
            </div>
        )
    }

    if (!metrics) {
        return <p className="text-muted-foreground">Could not load performance data. Please select a valid date range and at least one income source.</p>
    }
    
    const metricsToShow = [
        { name: "Impressions", data: metrics.impressions, formula: "Total views of your gigs/profiles", type: 'number' as const },
        { name: "Clicks", data: metrics.clicks, formula: "Total clicks on your gigs/profiles", type: 'number' as const },
        { name: "Messages", data: metrics.messages, formula: "Total initial messages from new clients", type: 'number' as const },
        { name: "Click-Through Rate (CTR)", data: metrics.ctr, formula: "(Clicks / Impressions) * 100", type: 'percentage' as const },
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricsToShow.map(m => renderMetricCard(m.name, m.data, m.formula, m.type))}
      </div>
    )
  };

  return (
      <Card>
          <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                  <BarChart className="h-6 w-6 text-primary" />
                  Performance Metrics
              </CardTitle>
              <Button variant="outline" size="sm" onClick={() => setShowChart(!showChart)} disabled>
                  {showChart ? <EyeOff className="mr-2 h-4 w-4" /> : <BarChart className="mr-2 h-4 w-4" />} {showChart ? "Hide Graph" : "Show Graph"}
              </Button>
          </CardHeader>
          <CardContent>
              {renderContent()}
          </CardContent>
           {showChart && (
            <CardContent>
                <p className="text-muted-foreground">Chart for performance metrics will be available soon.</p>
            </CardContent>
          )}
      </Card>
  );
}
