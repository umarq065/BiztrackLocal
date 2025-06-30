
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

const growthMetrics = [
    { name: "Monthly Revenue Growth (%)", value: "2.5%", formula: "((This Month’s Revenue - Last Month’s Revenue) / Last Month’s Revenue) × 100", change: "+0.5%", changeType: "increase" as const },
    { name: "Net Profit Growth (%)", value: "3.1%", formula: "((This Period's Net Profit - Last Period's) / Last Period's) × 100", change: "+0.8%", changeType: "increase" as const },
    { name: "Client Growth Rate (%)", value: "10%", formula: "((New Clients - Lost Clients) / Clients Last Month) × 100", change: "-2.0%", changeType: "decrease" as const },
    { name: "Average Order Value (AOV) Growth (%)", value: "1.2%", formula: "Growth rate of AOV over a period", change: "+0.3%", changeType: "increase" as const },
    { name: "High-Value Client Growth Rate (%)", value: "8%", formula: "Growth rate of clients in top spending quintile", change: "+1.5%", changeType: "increase" as const },
    { name: "Income Source/Gig Growth Rate (%)", value: "12%", formula: "Growth rate of top-performing income sources or gigs", change: "+2.2%", changeType: "increase" as const },
];

export function GrowthMetrics() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart className="h-6 w-6 text-primary" />
          <span>Growth Metrics</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {growthMetrics.map((metric) => {
            const isPositive = metric.changeType === "increase";
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
