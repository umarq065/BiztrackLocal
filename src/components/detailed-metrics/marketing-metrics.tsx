
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Megaphone, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

const marketingMetrics = [
    { name: "Cost per Lead (CPL)", value: "$25.50", formula: "Total Marketing Spend / Number of Leads Generated", change: "-5.0%", changeType: "decrease" as const, invertColor: true },
    { name: "Marketing ROI (ROMI)", value: "450%", formula: "((Revenue from Marketing - Marketing Cost) / Marketing Cost) × 100", change: "+50%", changeType: "increase" as const },
    { name: "Engagement Rate", value: "3.5%", formula: "((Likes + Comments + Shares) / Followers) × 100", change: "+0.3%", changeType: "increase" as const },
    { name: "Conversion Rate (from traffic)", value: "1.8%", formula: "(Number of Clients / Website Visitors) × 100", change: "+0.2%", changeType: "increase" as const },
];

export function MarketingMetrics() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Megaphone className="h-6 w-6 text-primary" />
          <span>Marketing Metrics</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {marketingMetrics.map((metric) => {
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
