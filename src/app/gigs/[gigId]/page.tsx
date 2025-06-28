"use client";

import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import StatCard from "@/components/dashboard/stat-card";
import GigAnalyticsChart from "@/components/gigs/analytics-chart";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { DateRange } from "react-day-picker";
import { DateFilter } from "@/components/dashboard/date-filter";

// Mock data for a single gig. In a real app, you'd fetch this.
const gigData = {
  name: "Acme Corp Redesign",
  source: "Web Design",
  creationDate: "2023-01-15",
  stats: [
    {
      icon: "Eye",
      title: "Impressions",
      value: "12,450",
      change: "+20.1%",
      changeType: "increase" as const,
      description: "from last month",
    },
    {
      icon: "MousePointerClick",
      title: "Clicks",
      value: "980",
      change: "+15.2%",
      changeType: "increase" as const,
      description: "from last month",
    },
    {
      icon: "MessageSquare",
      title: "Messages",
      value: "125",
      change: "+30",
      changeType: "increase" as const,
      description: "from last month",
    },
    {
      icon: "ShoppingCart",
      title: "Orders",
      value: "45",
      change: "+5",
      changeType: "increase" as const,
      description: "from last month",
    },
    {
      icon: "Percent",
      title: "Click-Through Rate (CTR)",
      value: "7.87%",
      change: "-1.2%",
      changeType: "decrease" as const,
      description: "from last month",
    },
  ],
  analyticsData: [
    { date: "2024-05-01", impressions: 300, clicks: 20, messages: 5, orders: 2 },
    { date: "2024-05-05", impressions: 450, clicks: 35, messages: 10, orders: 4 },
    { date: "2024-05-10", impressions: 600, clicks: 50, messages: 15, orders: 7 },
    { date: "2024-05-15", impressions: 550, clicks: 45, messages: 20, orders: 6 },
    { date: "2024-05-20", impressions: 700, clicks: 60, messages: 25, orders: 9 },
    { date: "2024-05-25", impressions: 820, clicks: 75, messages: 30, orders: 12 },
  ],
  mergeHistory: [
    {
      date: "2023-03-10",
      mergedGig: "Old Acme Project",
      action: "Merged into 'Acme Corp Redesign'",
    },
    {
      date: "2023-02-20",
      mergedGig: "Acme Landing Page Draft",
      action: "Merged into 'Acme Corp Redesign'",
    },
  ],
};

const chartConfig = {
    impressions: {
      label: "Impressions",
      color: "hsl(var(--chart-1))",
    },
    clicks: {
      label: "Clicks",
      color: "hsl(var(--chart-2))",
    },
    messages: {
      label: "Messages",
      color: "hsl(var(--chart-3))",
    },
    orders: {
      label: "Orders",
      color: "hsl(var(--chart-4))",
    },
  } as const;


export default function GigAnalyticsPage({ params }: { params: { gigId: string } }) {
  // In a real app, you would use params.gigId to fetch data.
  // For now, we'll use the mock data.
  const [activeMetrics, setActiveMetrics] = useState<Record<string, boolean>>({
    impressions: true,
    clicks: true,
    messages: true,
    orders: true,
  });

  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(gigData.analyticsData[0].date),
    to: new Date(gigData.analyticsData[gigData.analyticsData.length - 1].date),
  });

  const handleMetricToggle = (metric: keyof typeof chartConfig) => {
    setActiveMetrics((prev) => ({
      ...prev,
      [metric]: !prev[metric],
    }));
  };

  const filteredAnalyticsData = useMemo(() => {
    return gigData.analyticsData.filter(item => {
        const itemDate = new Date(item.date);
        if (date?.from && itemDate < date.from) return false;
        if (date?.to) {
            const toDateEnd = new Date(date.to);
            toDateEnd.setHours(23, 59, 59, 999);
            if (itemDate > toDateEnd) return false;
        }
        return true;
    });
  }, [date]);

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center">
        <h1 className="font-headline text-lg font-semibold md:text-2xl">
          Gig Analytics: <span className="text-primary">{gigData.name}</span>
        </h1>
        <div className="ml-auto">
            <DateFilter date={date} setDate={setDate} />
        </div>
      </div>
       <CardDescription>From Income Source: {gigData.source}</CardDescription>

      <section>
        <h2 className="text-xl font-semibold mb-4">Performance Overview</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {gigData.stats.map((stat) => (
            <StatCard key={stat.title} {...stat} />
          ))}
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
         <Card className="lg:col-span-2">
            <CardHeader>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <CardTitle>Impressions, Clicks, Messages & Orders</CardTitle>
                        <CardDescription>Performance over the selected period.</CardDescription>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                        {(Object.keys(chartConfig) as Array<keyof typeof chartConfig>).map((metric) => (
                            <div key={metric} className="flex items-center gap-2">
                                <Checkbox
                                    id={`metric-${metric}`}
                                    checked={activeMetrics[metric]}
                                    onCheckedChange={() => handleMetricToggle(metric)}
                                    style={{
                                        '--chart-color': chartConfig[metric].color,
                                    } as React.CSSProperties}
                                    className="data-[state=checked]:bg-[var(--chart-color)] data-[state=checked]:border-[var(--chart-color)] border-muted-foreground"
                                />
                                <Label htmlFor={`metric-${metric}`} className="capitalize">
                                    {chartConfig[metric].label}
                                </Label>
                            </div>
                        ))}
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <GigAnalyticsChart data={filteredAnalyticsData} activeMetrics={activeMetrics} />
            </CardContent>
        </Card>
         <Card>
            <CardHeader>
                <CardTitle>Gig History</CardTitle>
                <CardDescription>
                    Key events in this gig's lifecycle.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Event</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                         <TableRow>
                            <TableCell>{gigData.creationDate}</TableCell>
                            <TableCell>
                                <Badge variant="secondary">Gig Created</Badge>
                            </TableCell>
                        </TableRow>
                        {gigData.mergeHistory.map((event, index) => (
                            <TableRow key={index}>
                                <TableCell>{event.date}</TableCell>
                                <TableCell>
                                    <div className="font-medium">{event.action}</div>
                                    <div className="text-sm text-muted-foreground">Source: {event.mergedGig}</div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
      </div>
    </main>
  );
}
