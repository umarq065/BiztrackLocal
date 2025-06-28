"use client";

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

// Mock data for a single gig. In a real app, you'd fetch this.
const gigData = {
  name: "Acme Corp Redesign",
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
      icon: "Percent",
      title: "Click-Through Rate (CTR)",
      value: "7.87%",
      change: "-1.2%",
      changeType: "decrease" as const,
      description: "from last month",
    },
    {
      icon: "ShoppingCart",
      title: "Orders from Gig",
      value: "45",
      change: "+5",
      changeType: "increase" as const,
      description: "from last month",
    },
  ],
  analyticsData: [
    { date: "2024-05-01", impressions: 300, clicks: 20 },
    { date: "2024-05-05", impressions: 450, clicks: 35 },
    { date: "2024-05-10", impressions: 600, clicks: 50 },
    { date: "2024-05-15", impressions: 550, clicks: 45 },
    { date: "2024-05-20", impressions: 700, clicks: 60 },
    { date: "2024-05-25", impressions: 820, clicks: 75 },
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


export default function GigAnalyticsPage({ params }: { params: { gigId: string } }) {
  // In a real app, you would use params.gigId to fetch data.
  // For now, we'll use the mock data.

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center">
        <h1 className="font-headline text-lg font-semibold md:text-2xl">
          Gig Analytics: <span className="text-primary">{gigData.name}</span>
        </h1>
      </div>

      <section>
        <h2 className="text-xl font-semibold mb-4">Performance Overview</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {gigData.stats.map((stat) => (
            <StatCard key={stat.title} {...stat} />
          ))}
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
         <Card className="lg:col-span-2">
            <CardHeader>
                <CardTitle>Impressions & Clicks</CardTitle>
                <CardDescription>Performance over the last 30 days.</CardDescription>
            </CardHeader>
            <CardContent>
                <GigAnalyticsChart data={gigData.analyticsData} />
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
