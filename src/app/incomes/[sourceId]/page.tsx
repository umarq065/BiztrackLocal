
"use client";

import { useMemo, lazy, Suspense } from "react";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Eye,
  MousePointerClick,
  MessageSquare,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import StatCard from "@/components/dashboard/stat-card";
import { Skeleton } from "@/components/ui/skeleton";
import NProgressLink from "@/components/layout/nprogress-link";
import { Button } from "@/components/ui/button";
import { initialIncomeSources } from "@/lib/data/incomes-data";
import { format } from "date-fns";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  ChartContainer,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

const performanceChartConfig = {
  impressions: { label: "Impressions", color: "hsl(var(--chart-1))" },
  clicks: { label: "Clicks", color: "hsl(var(--chart-2))" },
} satisfies ChartConfig;

const messagesChartConfig = {
  messages: { label: "Messages", color: "hsl(var(--chart-3))" },
} satisfies ChartConfig;

const ChartComponent = ({ data, config, lines, yAxisLabel }: { data: any[], config: ChartConfig, lines: {key: string, color: string}[], yAxisLabel?: string }) => {
    if (!data || data.length === 0) {
        return (
            <div className="flex h-[300px] w-full items-center justify-center">
                <p className="text-muted-foreground">No data to display chart.</p>
            </div>
        );
    }
    return (
        <ChartContainer config={config} className="h-[300px] w-full">
            <LineChart accessibilityLayer data={data} margin={{ top: 20, right: 20, left: 10, bottom: 0 }}>
                <CartesianGrid vertical={false} />
                <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => format(new Date(value), "MMM d")}
                />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} label={yAxisLabel} />
                <Tooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                {lines.map(line => (
                     <Line key={line.key} dataKey={line.key} type="natural" stroke={line.color} strokeWidth={2} dot={false} />
                ))}
            </LineChart>
        </ChartContainer>
    );
}

export default function SourceAnalyticsPage({
  params,
}: {
  params: { sourceId: string };
}) {
  const source = initialIncomeSources.find((s) => s.id === params.sourceId);

  if (!source) {
    notFound();
  }

  const {
    aggregatedAnalytics,
    aggregatedMessages,
    totalImpressions,
    totalClicks,
    totalMessagesFromGigs,
    totalMessagesFromSource,
  } = useMemo(() => {
    let totalImpressions = 0;
    let totalClicks = 0;
    let totalMessagesFromGigs = 0;
    let totalMessagesFromSource = 0;
    const analyticsMap = new Map<string, { impressions: number; clicks: number }>();
    const messagesMap = new Map<string, { messages: number }>();

    source.gigs.forEach((gig) => {
        totalMessagesFromGigs += gig.messages || 0;
        gig.analytics?.forEach((analytic) => {
            totalImpressions += analytic.impressions;
            totalClicks += analytic.clicks;
            const existing = analyticsMap.get(analytic.date) || { impressions: 0, clicks: 0 };
            analyticsMap.set(analytic.date, {
                impressions: existing.impressions + analytic.impressions,
                clicks: existing.clicks + analytic.clicks,
            });
        });
    });

    source.dataPoints?.forEach((dp) => {
        totalMessagesFromSource += dp.messages;
        const existing = messagesMap.get(dp.date) || { messages: 0 };
        messagesMap.set(dp.date, {
            messages: existing.messages + dp.messages,
        });
    });

    const aggregatedAnalytics = Array.from(analyticsMap.entries())
        .map(([date, data]) => ({ date, ...data }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const aggregatedMessages = Array.from(messagesMap.entries())
        .map(([date, data]) => ({ date, ...data }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return {
        aggregatedAnalytics,
        aggregatedMessages,
        totalImpressions,
        totalClicks,
        totalMessagesFromGigs,
        totalMessagesFromSource,
    };
  }, [source]);

  const sourceStats = [
    { icon: "Eye", title: "Total Impressions", value: totalImpressions.toLocaleString(), description: "Across all gigs in this source" },
    { icon: "MousePointerClick", title: "Total Clicks", value: totalClicks.toLocaleString(), description: "Across all gigs in this source" },
    { icon: "MessageSquare", title: "Total Messages", value: (totalMessagesFromGigs + totalMessagesFromSource).toLocaleString(), description: `from source & gigs` },
  ];

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center">
        <h1 className="font-headline text-lg font-semibold md:text-2xl">
          Source Analytics: <span className="text-primary">{source.name}</span>
        </h1>
        <div className="ml-auto">
          <NProgressLink href="/incomes" passHref>
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Incomes
            </Button>
          </NProgressLink>
        </div>
      </div>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Overall Performance</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {sourceStats.map((stat) => (
            <StatCard key={stat.title} {...stat} />
          ))}
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
            <CardHeader>
                <CardTitle>Aggregated Gig Performance</CardTitle>
                <CardDescription>Impressions and Clicks from all gigs in this source.</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
                <Suspense fallback={<Skeleton className="h-[300px] w-full" />}>
                   <ChartComponent 
                     data={aggregatedAnalytics} 
                     config={performanceChartConfig}
                     lines={[
                         { key: "impressions", color: "var(--color-impressions)" },
                         { key: "clicks", color: "var(--color-clicks)" },
                     ]}
                   />
                </Suspense>
            </CardContent>
        </Card>
         <Card>
            <CardHeader>
                <CardTitle>Source Messages</CardTitle>
                <CardDescription>Messages received directly for this source.</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
                <Suspense fallback={<Skeleton className="h-[300px] w-full" />}>
                   <ChartComponent 
                     data={aggregatedMessages} 
                     config={messagesChartConfig}
                     lines={[
                         { key: "messages", color: "var(--color-messages)" },
                     ]}
                   />
                </Suspense>
            </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>Gigs in this Source</CardTitle>
            <CardDescription>A list of all gigs associated with {source.name}.</CardDescription>
        </CardHeader>
        <CardContent>
             <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Gig Name</TableHead>
                        <TableHead>Date Added</TableHead>
                        <TableHead className="text-right">Messages</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {source.gigs.map(gig => (
                         <TableRow key={gig.id}>
                            <TableCell className="font-medium">
                                <NProgressLink href={`/gigs/${gig.id}`} className="hover:underline">
                                    {gig.name}
                                </NProgressLink>
                            </TableCell>
                            <TableCell>{format(new Date(gig.date), "PPP")}</TableCell>
                            <TableCell className="text-right">{gig.messages ?? <span className="text-muted-foreground">N/A</span>}</TableCell>
                         </TableRow>
                    ))}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
    </main>
  );
}
