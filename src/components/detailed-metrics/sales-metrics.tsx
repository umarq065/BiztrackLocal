
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

const salesMetrics = [
    { name: "Lead Conversion Rate (%)", value: "18.5%", formula: "(Number of Sales / Number of Leads) × 100", change: "+1.2%", changeType: "increase" as const },
    { name: "Quote-to-Close Ratio (%)", value: "65%", formula: "(Accepted Proposals / Total Proposals Sent) × 100", change: "+5.0%", changeType: "increase" as const },
    { name: "Win Rate (%)", value: "75%", formula: "(Deals Closed / Total Opportunities) × 100", change: "+2.1%", changeType: "increase" as const },
    { name: "Response Time", value: "1.2 hours", formula: "Average time taken to reply to inquiries", change: "-10%", changeType: "decrease" as const, invertColor: true },
];

export function SalesMetrics() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-primary" />
          <span>Sales & Conversion Metrics</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {salesMetrics.map((metric) => {
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
