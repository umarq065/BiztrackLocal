import {
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Stat } from "@/lib/placeholder-data";
import {
  ArrowUp,
  ArrowDown,
  Users,
  ShoppingCart,
  DollarSign,
  BarChart,
  CreditCard,
  Repeat,
  UserPlus,
  TrendingUp,
  Goal,
  Calendar,
  XCircle,
  Star,
  Eye,
  MousePointerClick,
  Percent,
  MessageSquare,
  HeartPulse,
  type LucideIcon,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

const iconMap: { [key: string]: LucideIcon } = {
  Users,
  ShoppingCart,
  DollarSign,
  BarChart,
  CreditCard,
  Repeat,
  UserPlus,
  TrendingUp,
  Goal,
  Calendar,
  XCircle,
  Star,
  Eye,
  MousePointerClick,
  Percent,
  MessageSquare,
  HeartPulse,
};

export default function StatCard({
  icon,
  title,
  value,
  change,
  changeType,
  description,
  progressValue,
  className,
  invertChangeColor,
  color,
  highlight,
  highlightValue,
  breakdown,
  contentClassName,
}: Stat & { contentClassName?: string }) {
  const Icon = iconMap[icon];

  if (!Icon) {
    return null;
  }

  const isPositive = invertChangeColor ? changeType === "decrease" : changeType === "increase";

  return (
    <div
      className={cn("relative group/stat", className)}
    >
      <div
        className={cn(
          "absolute -inset-px rounded-lg bg-[conic-gradient(from_var(--gradient-angle)_at_50%_50%,white_0deg,transparent_60deg)] opacity-0 blur-sm transition-opacity duration-500 group-hover/stat:opacity-75 group-hover/stat:animate-spin-gradient"
        )}
        aria-hidden="true"
      />
      <div
        className={cn(
          "relative z-10 h-full w-full rounded-lg border bg-card text-card-foreground shadow-sm",
          highlight === 'top-border' && color && "border-t-4",
          contentClassName
        )}
        style={highlight === 'top-border' && color ? { borderTopColor: color } as React.CSSProperties : {}}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold transition-all duration-300 group-hover/stat:text-shadow-[0_0_15px_white]">
            {value}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            <div className="flex items-center">
              {change && (
                <span
                  className={cn(
                    "flex items-center gap-1",
                    isPositive
                      ? "text-green-600"
                      : "text-red-600"
                  )}
                >
                  {changeType === "increase" ? (
                    <ArrowUp className="h-3 w-3" />
                  ) : (
                    <ArrowDown className="h-3 w-3" />
                  )}
                  {change}
                </span>
              )}
              {typeof description === "string" && <span className="ml-1">{description}</span>}
            </div>
            {typeof description !== "string" && !breakdown && <div className="mt-1">{description}</div>}
          </div>
          {progressValue !== undefined && (
            <Progress value={progressValue} className="mt-2 h-1" style={{ '--color': color } as React.CSSProperties} />
          )}
          {breakdown && (
            <div className="mt-4 space-y-2">
              <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
                {breakdown.map((item) => (
                  <div
                    key={item.label}
                    className="h-full"
                    style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
                    title={`${item.label}: ${item.percentage}%`}
                  />
                ))}
              </div>
              <div className="flex flex-wrap justify-between gap-x-4 gap-y-1 text-xs">
                {breakdown.map((item) => (
                  <div key={item.label} className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-muted-foreground">{item.label}:</span>
                    <span className="font-medium">{item.value} ({item.percentage}%)</span>
                    <span
                      className={cn(
                        "flex items-center gap-0.5",
                        item.changeType === 'increase' ? "text-green-600" : "text-red-600"
                      )}>
                      ({item.changeType === 'increase' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}{item.change.replace(/[+-]/g, '')})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </div>
    </div>
  );
}
