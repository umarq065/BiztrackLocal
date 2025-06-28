
"use client";

import NProgressLink from "@/components/layout/nprogress-link";
import { notFound } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
import { Facebook, Twitter, Linkedin, Github, Globe, DollarSign, ShoppingCart, BarChart, Calendar, ArrowLeft } from "lucide-react";
import type { Stat } from "@/lib/placeholder-data";
import ClientOrderHistoryChart from "@/components/clients/client-order-history-chart";
import { Button } from "@/components/ui/button";


// Mock data - in a real app, this would be fetched from a database
interface Client {
    id: string;
    username: string;
    name?: string;
    email?: string;
    source: string;
    socialLinks?: { platform: string; url: string }[];
    clientType: 'New' | 'Repeat';
    clientSince: string;
    totalOrders: number;
    totalEarning: number;
    lastOrder: string;
}

const initialClients: Client[] = [
  { id: "1", name: "Olivia Martin", username: "olivia.m", email: "olivia.martin@email.com", source: "Comprehensive Web Design & Development for Enterprise", clientType: "Repeat", clientSince: "2023-01-15", totalOrders: 5, totalEarning: 8500, lastOrder: "2024-05-20", socialLinks: [{platform: "LinkedIn", url: "#"}, {platform: "Twitter", url: "#"}] },
  { id: "2", name: "Jackson Lee", username: "jackson.l", email: "jackson.lee@email.com", source: "Consulting", clientType: "New", clientSince: "2024-03-10", totalOrders: 1, totalEarning: 1200, lastOrder: "2024-05-21", socialLinks: [{platform: "GitHub", url: "#"}] },
  { id: "3", name: "Isabella Nguyen", username: "isabella.n", email: "isabella.nguyen@email.com", source: "Logo Design", clientType: "Repeat", clientSince: "2022-11-05", totalOrders: 8, totalEarning: 4500, lastOrder: "2024-05-18", socialLinks: [] },
  { id: "4", name: "William Kim", username: "will.k", email: "will@email.com", source: "Comprehensive Web Design & Development for Enterprise", clientType: "Repeat", clientSince: "2023-08-20", totalOrders: 3, totalEarning: 6200, lastOrder: "2024-04-30", socialLinks: [{platform: "Website", url: "#"}] },
  { id: "5", name: "Sofia Davis", username: "sofia.d", email: "sofia.davis@email.com", source: "SEO Services and Digital Marketing Campaigns", clientType: "New", clientSince: "2024-04-01", totalOrders: 2, totalEarning: 1800, lastOrder: "2024-05-24", socialLinks: [{platform: "Facebook", url: "#"}, {platform: "Twitter", url: "#"}] },
];

interface Order {
    id: string;
    clientUsername: string;
    date: string;
    amount: number;
    source: string;
    gig?: string;
    status: 'Completed' | 'In Progress' | 'Cancelled';
    rating?: number;
}

const initialOrders: Order[] = [
    { id: 'ORD001', clientUsername: 'olivia.m', date: '2024-05-20', amount: 1999.00, source: 'Comprehensive Web Design & Development for Enterprise', gig: 'Acme Corp Redesign', status: 'Completed', rating: 5 },
    { id: 'ORD002', clientUsername: 'jackson.l', date: '2024-05-21', amount: 399.00, source: 'Consulting', gig: 'Q1 Strategy Session', status: 'Completed', rating: 4.2 },
    { id: 'ORD003', clientUsername: 'isabella.n', date: '2024-05-22', amount: 299.00, source: 'Logo Design', gig: "Brand Identity for 'Innovate'", status: 'Cancelled' },
    { id: 'ORD004', clientUsername: 'will.k', date: '2024-05-23', amount: 999.00, source: 'Web Design', gig: 'Startup Landing Page', status: 'In Progress' },
    { id: 'ORD005', clientUsername: 'sofia.d', date: '2024-05-24', amount: 499.00, source: 'SEO Services and Digital Marketing Campaigns', gig: 'Monthly SEO Retainer', status: 'Completed', rating: 3.7 },
    { id: 'ORD006', clientUsername: 'olivia.m', date: '2024-04-15', amount: 2500.00, source: 'Comprehensive Web Design & Development for Enterprise', gig: 'E-commerce Platform', status: 'Completed', rating: 4.8 },
    { id: 'ORD007', clientUsername: 'isabella.n', date: '2024-03-18', amount: 500.00, source: 'Logo Design', gig: 'Branding Refresh', status: 'Completed', rating: 5 },
];


const socialPlatforms = [
    { value: "Facebook", icon: Facebook },
    { value: "Twitter", icon: Twitter },
    { value: "LinkedIn", icon: Linkedin },
    { value: "GitHub", icon: Github },
    { value: "Website", icon: Globe },
];

const SocialIcon = ({ platform }: { platform: string }) => {
    const platformConfig = socialPlatforms.find(p => p.value === platform);
    if (!platformConfig) return <Globe className="h-5 w-5 text-muted-foreground" />;
    const Icon = platformConfig.icon;
    return <Icon className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />;
}

export default function ClientDetailsPage({ params }: { params: { clientId: string } }) {
  const client = initialClients.find(c => c.id === params.clientId);
  
  if (!client) {
    notFound();
  }
  
  const clientOrders = initialOrders.filter(o => o.clientUsername === client?.username);

  const clientStats: Stat[] = [
    {
      icon: "DollarSign",
      title: "Total Revenue",
      value: `$${client.totalEarning.toLocaleString()}`,
      description: `from ${client.totalOrders} orders`,
    },
    {
      icon: "ShoppingCart",
      title: "Total Orders",
      value: `${client.totalOrders}`,
      description: "All-time orders",
    },
    {
        icon: "BarChart",
        title: "Avg. Order Value",
        value: `$${(client.totalEarning / client.totalOrders).toFixed(2)}`,
        description: "Average across all orders",
    },
    {
      icon: "Calendar",
      title: "Client Since",
      value: new Date(client.clientSince).toLocaleDateString(),
      description: `Last order on ${new Date(client.lastOrder).toLocaleDateString()}`,
    },
  ];

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
            <Avatar className="h-20 w-20 border">
            <AvatarImage src={`https://placehold.co/100x100.png?text=${(client.name || client.username).charAt(0)}`} alt="Avatar" data-ai-hint="avatar person" />
            <AvatarFallback>{(client.name || client.username).charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
                <h1 className="font-headline text-2xl font-semibold md:text-3xl">
                    {client.name || client.username}
                </h1>
                <p className="text-muted-foreground">@{client.username}</p>
                <div className="mt-2 flex items-center gap-2">
                    <Badge variant={client.clientType === 'New' ? 'secondary' : 'default'}>
                        {client.clientType} Client
                    </Badge>
                    {client.socialLinks?.map((link, i) => (
                        <a key={i} href={link.url} target="_blank" rel="noreferrer noopener" aria-label={link.platform}>
                            <SocialIcon platform={link.platform} />
                        </a>
                    ))}
                </div>
            </div>
        </div>
        <NProgressLink href="/clients" passHref>
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </NProgressLink>
      </div>
      
      <section>
        <h2 className="text-xl font-semibold mb-4">Client Overview</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {clientStats.map((stat, index) => (
            <StatCard key={index} {...stat} />
          ))}
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-1">
             <CardHeader>
                <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
                <div>
                    <p className="font-medium">Email</p>
                    <p className="text-muted-foreground">{client.email || "Not provided"}</p>
                </div>
                <div>
                    <p className="font-medium">Primary Income Source</p>
                    <p className="text-muted-foreground">{client.source}</p>
                </div>
            </CardContent>
        </Card>
        <Card className="md:col-span-2">
            <CardHeader>
                <CardTitle>Order History</CardTitle>
                <CardDescription>A list of all orders from this client.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Order ID</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {clientOrders.length > 0 ? clientOrders.map(order => (
                            <TableRow key={order.id}>
                                <TableCell className="font-medium">{order.id}</TableCell>
                                <TableCell>{new Date(order.date).toLocaleDateString()}</TableCell>
                                <TableCell>
                                    <Badge variant={order.status === 'Cancelled' ? 'destructive' : order.status === 'Completed' ? 'default' : 'secondary'}>
                                        {order.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">${order.amount.toFixed(2)}</TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">No orders found for this client.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
      </div>

      <section>
        <ClientOrderHistoryChart data={clientOrders} />
      </section>

    </main>
  );
}
