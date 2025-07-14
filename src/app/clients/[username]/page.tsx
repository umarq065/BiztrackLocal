
"use client";

import { lazy, Suspense, useState, useMemo, useEffect } from "react";
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
import { Facebook, Twitter, Linkedin, Github, Globe, DollarSign, ShoppingCart, BarChart, Calendar, ArrowLeft, Pencil, Star, HeartPulse, Loader2 } from "lucide-react";
import type { Stat } from "@/lib/placeholder-data";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { getClientStatus, type Client } from "@/lib/data/clients-data";
import { initialOrders as staticOrdersData, type Order } from "@/lib/data/orders-data";
import { EditClientDialog } from "@/components/clients/edit-client-dialog";
import { cn } from "@/lib/utils";
import type { IncomeSource } from "@/lib/data/incomes-data";

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
  if (!dateString || dateString === 'N/A') {
    return new Date(0); // Return a default date for invalid strings
  }
  const [year, month, day] = dateString.split('-').map(Number);
  // In JavaScript's Date, months are 0-indexed (0 for January, 11 for December)
  return new Date(year, month - 1, day);
};

export default function ClientDetailsPage() {
  const params = useParams();
  const username = params.username as string;
  
  const [client, setClient] = useState<Client | null>(null);
  const [incomeSources, setIncomeSources] = useState<IncomeSource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  useEffect(() => {
    async function fetchData() {
      if (!username) {
        setIsLoading(false);
        // Do not call notFound() here, let the render logic handle it
        return;
      }
      setIsLoading(true);
      try {
        const [clientRes, incomesRes] = await Promise.all([
          fetch(`/api/clients/by-username/${username}`),
          fetch('/api/incomes')
        ]);
        
        if (clientRes.status === 404) {
          // Explicitly trigger notFound only when API confirms it
          notFound();
          return;
        }

        if (!clientRes.ok || !incomesRes.ok) {
          throw new Error('Failed to fetch data');
        }
        const currentClient: Client = await clientRes.json();
        const incomesData: IncomeSource[] = await incomesRes.json();
        
        setClient(currentClient);
        setIncomeSources(incomesData);

      } catch (err) {
        console.error("Failed to fetch client details:", err);
        // If it's a notFound error that was thrown, re-throw it.
        if ((err as any).digest?.startsWith('NEXT_NOT_FOUND')) {
          throw err;
        }
        setClient(null); 
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [username]);


  const initialOrders = useMemo(() => {
    return staticOrdersData.map(o => ({ ...o, dateObj: parseDateString(o.date) }));
  }, []);
  
  const handleClientUpdated = (updatedClient: Client) => {
      setClient(updatedClient);
  };
  
  const clientOrders = useMemo(() => {
    if (!client) return [];
    return initialOrders.filter(o => o.clientUsername === client?.username);
  }, [initialOrders, client]);
  
  const clientStatus = useMemo(() => {
    if (!client) return { text: "Inactive", color: "bg-red-500" };
    return getClientStatus(client.lastOrder);
  }, [client]);

  const clientStats = useMemo((): Stat[] => {
    if (!client) return [];
    return [
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
        value: client.clientSince !== 'N/A' ? format(parseDateString(client.clientSince), "PPP") : "N/A",
        description: client.lastOrder !== 'N/A' ? `Last order on ${format(parseDateString(client.lastOrder), "PPP")}` : "No orders yet",
      },
    ];
  }, [client, clientStatus]);

  if (isLoading) {
    return (
       <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <Skeleton className="h-20 w-20 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-8 w-48" />
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-6 w-40" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-10 w-28" />
                <Skeleton className="h-10 w-24" />
              </div>
            </div>
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-64 w-full" />
       </main>
    )
  }
  
  if (!client) {
    // This case now correctly handles general errors after loading has finished
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Card className="w-full max-w-md">
            <CardHeader>
                <CardTitle>Error Loading Client</CardTitle>
                <CardDescription>We couldn&apos;t load the details for this client. Please try again later.</CardDescription>
            </CardHeader>
            <CardContent>
                <NProgressLink href="/clients">
                  <Button variant="outline" className="w-full">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Client List
                  </Button>
                </NProgressLink>
            </CardContent>
        </Card>
      </div>
    );
  }

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
              incomeSources={incomeSources.map(s => s.name)}
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
                                <TableCell>{format(order.dateObj, "PPP")}</TableCell>
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
