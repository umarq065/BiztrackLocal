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
}: Stat) {
  const Icon = iconMap[icon];

  if (!Icon) {
    return null; 
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-xs text-muted-foreground mt-1">
          <div className="flex items-center">
            {change && (
                <span
                className={cn(
                    "flex items-center gap-1",
                    changeType === "increase"
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
          <Progress value={progressValue} className="mt-2 h-2" />
        )}
      </CardContent>
    </Card>
  );
}
