"use client";

import { useState, lazy, Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, ArrowUp, ArrowDown, EyeOff, BarChart } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const ProjectMetricsChart = lazy(() => import("@/components/detailed-metrics/project-metrics-chart"));

const projectMetrics = [
    { name: "Revisions per Project", value: "1.8", formula: "Total Number of Revisions / Total Projects Delivered", change: "+0.2", changeType: "increase" as const, invertColor: true },
    { name: "Order Completion Rate (%)", value: "96%", formula: "(Completed Tasks / Total Tasks Assigned) × 100", change: "-1%", changeType: "decrease" as const },
];

export function ProjectMetrics() {
  const [showChart, setShowChart] = useState(false);
  const [activeMetrics, setActiveMetrics] = useState({
    revisions: true,
    completionRate: true,
  });

  const handleMetricToggle = (metric: keyof typeof activeMetrics) => {
    setActiveMetrics((prev) => ({ ...prev, [metric]: !prev[metric] }));
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-6 w-6 text-primary" />
          <span>Project & Delivery Metrics</span>
        </CardTitle>
        <Button variant="outline" size="sm" onClick={() => setShowChart(!showChart)}>
            {showChart ? <EyeOff className="mr-2 h-4 w-4" /> : <BarChart className="mr-2 h-4 w-4" />}
            {showChart ? "Hide Graph" : "Show Graph"}
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
          {projectMetrics.map((metric) => {
            const isPositive = metric.invertColor ? metric.changeType === "decrease" : metric.changeType === "increase";
            return (
                <div key={metric.name} className="rounded-lg border bg-background/50 p-4 flex flex-col justify-between">
                <div>
                    <p className="text-sm font-medium text-muted-foreground">{metric.name}</p>
                    <p className="text-2xl font-bold mt-1">{metric.value}</p>
                </div>
                <div className="mt-2 pt-2 border-t space-y-1">
                    {metric.change && (
                        <div className="flex items-center text-xs">
                            <span
                                className={cn(
                                    "flex items-center gap-1 font-semibold",
                                    isPositive ? "text-green-600" : "text-red-600"
                                )}
                            >
                                {metric.changeType === "increase" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                                {metric.change}
                            </span>
                            <span className="ml-1 text-muted-foreground">vs selected period</span>
                        </div>
                    )}
                    <p className="text-xs text-muted-foreground">{metric.formula}</p>
                </div>
                </div>
            )
          })}
        </div>
      </CardContent>
      {showChart && (
        <CardContent>
             <Suspense fallback={<Skeleton className="h-[300px] w-full" />}>
                <ProjectMetricsChart activeMetrics={activeMetrics} onMetricToggle={handleMetricToggle} />
            </Suspense>
        </CardContent>
      )}
    </Card>
  );
}
