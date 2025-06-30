
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

const projectMetrics = [
    { name: "Average Project Delivery Time", value: "12 days", formula: "Sum of all Delivery Times / Total Projects Delivered", change: "-1 day", changeType: "decrease" as const, invertColor: true },
    { name: "Revisions per Project", value: "1.8", formula: "Total Number of Revisions / Total Projects Delivered", change: "+0.2", changeType: "increase" as const, invertColor: true },
    { name: "Utilization Rate (%)", value: "88%", formula: "(Billable Hours / Total Work Hours Available) × 100", change: "+5%", changeType: "increase" as const },
    { name: "Task Completion Rate (%)", value: "96%", formula: "(Completed Tasks / Total Tasks Assigned) × 100", change: "-1%", changeType: "decrease" as const },
];

export function ProjectMetrics() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-6 w-6 text-primary" />
          <span>Project & Delivery Metrics</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
    </Card>
  );
}
