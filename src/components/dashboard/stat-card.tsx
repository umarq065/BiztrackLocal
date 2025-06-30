import {
  Card,
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
}: Stat) {
  const Icon = iconMap[icon];

  if (!Icon) {
    return null; 
  }

  const isPositive = invertChangeColor ? changeType === "decrease" : changeType === "increase";

  return (
    <Card
      className={cn(
        "relative overflow-hidden group transition-all duration-300 hover:shadow-[0_0_20px_var(--glow-color)]",
        className
      )}
      style={color ? { '--glow-color': color } as React.CSSProperties : undefined}
    >
      <div className="relative z-10">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold transition-all duration-300 group-hover:text-shadow-[0_0_10px_var(--glow-color)]">
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
            {typeof description !== "string" && <div className="mt-1">{description}</div>}
          </div>
          {progressValue !== undefined && (
             <Progress value={progressValue} className="mt-2 h-1" style={{ '--color': color } as React.CSSProperties} />
          )}
        </CardContent>
      </div>
      {color && (
         <div
            className="absolute bottom-[-50%] left-1/2 -translate-x-1/2 w-[200%] h-[100%] z-0 opacity-40 blur-3xl animate-pulse-glow"
            style={{
                backgroundImage: `radial-gradient(circle, ${color} 0%, transparent 70%)`
            }}
        />
      )}
    </Card>
  );
}
