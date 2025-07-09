
"use client";

import { lazy, Suspense, useState } from "react";
import NProgressLink from "@/components/layout/nprogress-link";
import { notFound, useParams } from "next/navigation";
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
import { Facebook, Twitter, Linkedin, Github, Globe, DollarSign, ShoppingCart, BarChart, Calendar, ArrowLeft, Pencil, Star, HeartPulse } from "lucide-react";
import type { Stat } from "@/lib/placeholder-data";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { getClientStatus, initialClients as staticClients, type Client } from "@/lib/data/clients-data";
import { initialOrders } from "@/lib/data/orders-data";
import { EditClientDialog } from "@/components/clients/edit-client-dialog";
import { cn } from "@/lib/utils";

const ClientOrderHistoryChart = lazy(() => import("@/components/clients/client-order-history-chart"));

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

// A more robust date parsing function to avoid performance issues.
const parseDateString = (dateString: string): Date => {
  const [year, month, day] = dateString.split('-').map(Number);
  // In JavaScript's Date, months are 0-indexed (0 for January, 11 for December)
  return new Date(year, month - 1, day);
};

export default function ClientDetailsPage() {
  const params = useParams();
  const clientId = params.clientId as string;
  const [clients, setClients] = useState<Client[]>(staticClients);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const client = clients.find(c => c.id === clientId);
  
  if (!client) {
    notFound();
  }

  const handleClientUpdated = (updatedClient: Client) => {
      setClients(prevClients => 
          prevClients.map(c => (c.id === updatedClient.id ? updatedClient : c))
      );
  };
  
  const clientOrders = initialOrders.filter(o => o.clientUsername === client?.username);
  
  const clientStatus = getClientStatus(client.lastOrder);

  const clientStats: Stat[] = [
    {
      icon: "HeartPulse",
      title: "Client Status",
      value: (
          <div className="flex items-center gap-2">
              <span className={cn("h-3 w-3 rounded-full", clientStatus.color)} />
              <span>{clientStatus.text}</span>
          </div>
      ),
      description: `Based on last order date`
    },
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
        value: `$${client.totalOrders > 0 ? (client.totalEarning / client.totalOrders).toFixed(2) : '0.00'}`,
        description: "Average across all orders",
    },
    {
      icon: "Calendar",
      title: "Client Since",
      value: format(parseDateString(client.clientSince), "PPP"),
      description: `Last order on ${format(parseDateString(client.lastOrder), "PPP")}`,
    },
  ];

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
            <Avatar className="h-20 w-20 border">
            <AvatarImage src={client.avatarUrl || `https://placehold.co/100x100.png?text=${(client.name || client.username).charAt(0)}`} alt="Avatar" data-ai-hint="avatar person" />
            <AvatarFallback>{(client.name || client.username).charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
                <div className="flex items-center gap-3">
                    <h1 className="font-headline text-2xl font-semibold md:text-3xl">
                        {client.name || client.username}
                    </h1>
                     {client.isVip && <Badge variant="secondary" className="border-yellow-400 text-yellow-500"><Star className="mr-1 h-3 w-3 fill-yellow-400" /> VIP</Badge>}
                </div>
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
        <div className="flex items-center gap-2">
            <EditClientDialog
              open={isEditDialogOpen}
              onOpenChange={setIsEditDialogOpen}
              client={client}
              onClientUpdated={handleClientUpdated}
            >
                <Button variant="outline">
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit Client
                </Button>
            </EditClientDialog>
            <NProgressLink href="/clients">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </NProgressLink>
        </div>
      </div>
      
      <section>
        <h2 className="text-xl font-semibold mb-4">Client Overview</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {clientStats.map((stat, index) => (
            <StatCard key={index} {...stat} />
          ))}
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-3 mt-8">
        <Card className="md:col-span-2">
            <CardHeader>
                <CardTitle>Strategic Brief</CardTitle>
                <CardDescription>Key notes and tags for this client.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <h3 className="text-sm font-medium mb-2">Key Notes</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {client.notes || "No notes added yet."}
                    </p>
                </div>
                {client.tags && client.tags.length > 0 && (
                    <div>
                        <h3 className="text-sm font-medium mb-2">Tags</h3>
                        <div className="flex flex-wrap gap-2">
                            {client.tags.map(tag => <Badge key={tag} variant="outline">{tag}</Badge>)}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
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
      </div>

      <div className="grid gap-4 md:grid-cols-3 mt-8">
        <Card className="md:col-span-3">
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
                                <TableCell>{format(parseDateString(order.date), "PPP")}</TableCell>
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

      <section className="mt-8">
        <Suspense fallback={<Skeleton className="h-[400px] w-full rounded-lg" />}>
          <ClientOrderHistoryChart data={clientOrders} />
        </Suspense>
      </section>

    </main>
  );
}
