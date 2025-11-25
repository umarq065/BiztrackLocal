
"use client";

import { lazy, Suspense, useState, useMemo, useEffect, useCallback } from "react";
import NProgressLink from "@/components/layout/nprogress-link";
import { notFound, useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
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
import { DollarSign, ShoppingCart, BarChart, Calendar, ArrowLeft, Pencil, Star, HeartPulse, Loader2, Globe } from "lucide-react";
import type { Stat } from "@/lib/placeholder-data";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { format, parseISO } from "date-fns";
import { getClientStatus, type Client } from "@/lib/data/clients-data";
import { type Order } from "@/lib/data/orders-data";
import { EditClientDialog } from "@/components/clients/edit-client-dialog";
import { cn } from "@/lib/utils";
import type { IncomeSource } from "@/lib/data/incomes-data";
import { MonthYearPicker } from "@/components/clients/month-year-picker";

const ClientOrderHistoryChart = lazy(() => import("@/components/clients/client-order-history-chart"));

import { socialPlatforms } from "@/lib/data/clients-data";

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
  // Handles both "YYYY-MM-DD" and full ISO strings like "2024-07-29T10:00:00.000Z"
  // The 'T00:00:00' ensures it's parsed as local time, not UTC, preventing off-by-one day errors.
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return parseISO(`${dateString}T00:00:00`);
  }
  return parseISO(dateString);
};

export default function ClientDetailsPage() {
  const params = useParams();
  const username = params.username as string;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [client, setClient] = useState<Client | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [incomeSources, setIncomeSources] = useState<IncomeSource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const [fromDate, setFromDate] = useState<{ month: number; year: number } | null>(() => {
    const fromM = searchParams.get('fromMonth');
    const fromY = searchParams.get('fromYear');
    if (fromM && fromY) return { month: parseInt(fromM), year: parseInt(fromY) };
    return null;
  });
  const [toDate, setToDate] = useState<{ month: number; year: number } | null>(() => {
    const toM = searchParams.get('toMonth');
    const toY = searchParams.get('toYear');
    if (toM && toY) return { month: parseInt(toM), year: parseInt(toY) };
    return null;
  });

  const createQueryString = useCallback(
    (paramsToUpdate: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [name, value] of Object.entries(paramsToUpdate)) {
        if (value) {
          params.set(name, value);
        } else {
          params.delete(name);
        }
      }
      return params.toString();
    },
    [searchParams]
  );

  const updateUrlWithDate = (from: typeof fromDate, to: typeof toDate) => {
    router.push(`${pathname}?${createQueryString({
      fromMonth: from ? String(from.month) : null,
      fromYear: from ? String(from.year) : null,
      toMonth: to ? String(to.month) : null,
      toYear: to ? String(to.year) : null,
    })}`, { scroll: false });
  };


  useEffect(() => {
    async function fetchData() {
      if (!username) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const [clientRes, incomesRes, ordersRes] = await Promise.all([
          fetch(`/api/clients/by-username/${username}`),
          fetch('/api/incomes'),
          fetch('/api/orders')
        ]);

        if (clientRes.status === 404) {
          notFound();
          return;
        }

        if (!clientRes.ok || !incomesRes.ok || !ordersRes.ok) {
          throw new Error('Failed to fetch data');
        }

        const currentClient: Client = await clientRes.json();
        const incomesData: IncomeSource[] = await incomesRes.json();
        const ordersData: Order[] = await ordersRes.json();

        setClient(currentClient);
        setIncomeSources(incomesData);
        setOrders(ordersData);

      } catch (err) {
        console.error("Failed to fetch client details:", err);
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

  const handleClientUpdated = (updatedClient: Client) => {
    setClient(updatedClient);
  };

  const clientOrders = useMemo(() => {
    if (!client) return [];
    let clientOrders = orders
      .filter(o => o.clientUsername === client?.username)
      .map(o => ({ ...o, dateObj: parseDateString(o.date) }));

    if (fromDate || toDate) {
      clientOrders = clientOrders.filter(order => {
        const orderDate = order.dateObj;
        if (fromDate) {
          const filterFromDate = new Date(fromDate.year, fromDate.month - 1, 1);
          if (orderDate < filterFromDate) return false;
        }
        if (toDate) {
          const filterToDate = new Date(toDate.year, toDate.month, 0); // Last day of month
          if (orderDate > filterToDate) return false;
        }
        return true;
      });
    }

    return clientOrders;
  }, [orders, client, fromDate, toDate]);

  const clientStatus = useMemo(() => {
    if (!client) return { text: "Inactive", color: "bg-red-500" };
    return getClientStatus(client.lastOrder);
  }, [client]);

  const clientStats = useMemo((): Stat[] => {
    if (!client) return [];

    const filteredTotalEarning = clientOrders.reduce((sum, order) => sum + order.amount, 0);
    const filteredTotalOrders = clientOrders.length;

    return [
      {
        icon: "HeartPulse",
        title: "Client Status",
        value: (
          <div className="flex items-center gap-2">
            <span className={cn("h-3 w-3 rounded-full shadow-sm", clientStatus.color)} />
            <span>{clientStatus.text}</span>
          </div>
        ),
        description: `Based on last order date`,
        color: "hsl(var(--chart-1))",
        highlight: "top-border"
      },
      {
        icon: "DollarSign",
        title: "Total Revenue",
        value: `$${filteredTotalEarning.toLocaleString()}`,
        description: `from ${filteredTotalOrders} orders`,
        color: "hsl(var(--chart-2))",
        highlight: "top-border"
      },
      {
        icon: "ShoppingCart",
        title: "Total Orders",
        value: `${filteredTotalOrders}`,
        description: "in selected period",
        color: "hsl(var(--chart-3))",
        highlight: "top-border"
      },
      {
        icon: "BarChart",
        title: "Avg. Order Value",
        value: `$${filteredTotalOrders > 0 ? (filteredTotalEarning / filteredTotalOrders).toFixed(2) : '0.00'}`,
        description: "in selected period",
        color: "hsl(var(--chart-4))",
        highlight: "top-border"
      },
      {
        icon: "Calendar",
        title: "Client Since",
        value: client.clientSince !== 'N/A' ? format(parseDateString(client.clientSince), "PPP") : "N/A",
        description: client.lastOrder !== 'N/A' ? `Last order on ${format(parseDateString(client.lastOrder), "PPP")}` : "No orders yet",
        color: "hsl(var(--chart-5))",
        highlight: "top-border"
      },
    ];
  }, [client, clientStatus, clientOrders]);

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
    <main className="flex flex-1 flex-col min-h-screen bg-muted/10">
      {/* Banner Section */}
      <div className="relative h-48 w-full bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-soft-light"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
      </div>

      <div className="container mx-auto px-4 md:px-8 -mt-12 relative z-10 mb-8">
        <div className="flex flex-col md:flex-row items-start gap-6">
          {/* Avatar */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-br from-pink-500 to-violet-500 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-500"></div>
            <Avatar className="h-32 w-32 border-4 border-background shadow-xl relative">
              <AvatarImage src={client.avatarUrl || `https://placehold.co/100x100.png?text=${(client.name || client.username).charAt(0)}`} alt="Avatar" className="object-cover" />
              <AvatarFallback className="text-4xl bg-muted">{(client.name || client.username).charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            {client.isVip && (
              <div className="absolute -bottom-2 -right-2 bg-yellow-400 text-yellow-900 p-1.5 rounded-full border-4 border-background shadow-sm" title="VIP Client">
                <Star className="h-5 w-5 fill-current" />
              </div>
            )}
          </div>

          {/* Client Info & Actions */}
          <div className="flex-1 pt-14 md:pt-12 w-full">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
                    {client.name || client.username}
                  </h1>
                  <Badge variant={client.clientType === 'New' ? 'secondary' : 'default'} className="text-sm px-3 py-0.5 shadow-sm">
                    {client.clientType} Client
                  </Badge>
                </div>
                <p className="text-muted-foreground text-lg font-medium">@{client.username}</p>

                <div className="mt-4 flex items-center gap-3">
                  {client.socialLinks?.map((link, i) => (
                    <a
                      key={i}
                      href={link.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="p-2 rounded-full bg-background border shadow-sm hover:bg-muted hover:scale-105 transition-all duration-200 text-muted-foreground hover:text-primary"
                    >
                      <SocialIcon platform={link.platform} />
                    </a>
                  ))}
                </div>
              </div>

              {/* Actions Toolbar */}
              <div className="flex flex-col items-end gap-3 w-full md:w-auto">
                <div className="flex items-center gap-2 bg-background/50 backdrop-blur-sm p-1 rounded-lg border shadow-sm">
                  <MonthYearPicker date={fromDate} setDate={(d) => { setFromDate(d); updateUrlWithDate(d, toDate); }} label="From" />
                  <div className="w-px h-8 bg-border mx-1"></div>
                  <MonthYearPicker date={toDate} setDate={(d) => { setToDate(d); updateUrlWithDate(fromDate, d); }} label="To" />
                </div>

                <div className="flex items-center gap-2">
                  <NProgressLink href="/clients">
                    <Button variant="outline" size="sm" className="shadow-sm hover:bg-muted">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back
                    </Button>
                  </NProgressLink>
                  <EditClientDialog
                    open={isEditDialogOpen}
                    onOpenChange={setIsEditDialogOpen}
                    client={client}
                    onClientUpdated={handleClientUpdated}
                    incomeSources={incomeSources.map(s => s.name)}
                  >
                    <Button size="sm" className="shadow-sm bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 border-0">
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit Profile
                    </Button>
                  </EditClientDialog>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-8 pb-8 space-y-8">
        <section>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <BarChart className="h-5 w-5 text-primary" />
            Client Overview
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {clientStats.map((stat, index) => (
              <StatCard
                key={index}
                {...stat}
                className="hover:scale-105 transition-transform duration-300 hover:shadow-lg border-primary/10 bg-gradient-to-br from-background to-muted/30"
              />
            ))}
          </div>
        </section>

        <div className="grid gap-4 md:grid-cols-3 mt-8">
          <Card className="md:col-span-2 border-primary/10 shadow-sm hover:shadow-md transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 bg-primary/10 rounded-full">
                  <Star className="h-4 w-4 text-primary" />
                </div>
                Strategic Brief
              </CardTitle>
              <CardDescription>Key notes and tags for this client.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-yellow-50/50 dark:bg-yellow-900/10 p-4 rounded-lg border border-yellow-100 dark:border-yellow-900/20">
                <h3 className="text-sm font-medium mb-2 text-yellow-800 dark:text-yellow-200">Key Notes</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {client.notes || "No notes added yet."}
                </p>
              </div>
              {client.tags && client.tags.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {client.tags.map(tag => <Badge key={tag} variant="outline" className="bg-background hover:bg-muted">{tag}</Badge>)}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          <Card className="md:col-span-1 border-primary/10 shadow-sm hover:shadow-md transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 bg-primary/10 rounded-full">
                  <HeartPulse className="h-4 w-4 text-primary" />
                </div>
                Contact Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                <div className="h-8 w-8 rounded-full bg-background flex items-center justify-center border shadow-sm">
                  <span className="text-xs font-bold">@</span>
                </div>
                <div>
                  <p className="font-medium">Email</p>
                  <p className="text-muted-foreground">{client.email || "Not provided"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                <div className="h-8 w-8 rounded-full bg-background flex items-center justify-center border shadow-sm">
                  <DollarSign className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-medium">Primary Source</p>
                  <p className="text-muted-foreground">{client.source}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-3 mt-8">
          <Card className="md:col-span-3 border-primary/10 shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/20 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5 text-primary" />
                    Order History
                  </CardTitle>
                  <CardDescription>A list of all orders from this client in the selected period.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/10 hover:bg-muted/10">
                    <TableHead className="pl-6">Order ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right pr-6">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientOrders.length > 0 ? clientOrders.map(order => (
                    <TableRow key={order.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-medium pl-6">
                        <a
                          href={`https://www.fiverr.com/orders/${order.id}/activities`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline text-primary font-mono bg-primary/5 px-2 py-1 rounded"
                        >
                          {order.id}
                        </a>
                      </TableCell>
                      <TableCell>{format(order.dateObj, "PPP")}</TableCell>
                      <TableCell>
                        <Badge variant={order.status === 'Cancelled' ? 'destructive' : order.status === 'Completed' ? 'default' : 'secondary'} className="shadow-sm">
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-6 font-semibold">${order.amount.toFixed(2)}</TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <ShoppingCart className="h-8 w-8 opacity-20" />
                          <p>No orders found for this client in the selected period.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <section className="mt-8">
          <Card className="border-primary/10 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart className="h-5 w-5 text-primary" />
                Order Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<Skeleton className="h-[400px] w-full rounded-lg" />}>
                <ClientOrderHistoryChart data={clientOrders} />
              </Suspense>
            </CardContent>
          </Card>
        </section>

      </div>
    </main>
  );
}
