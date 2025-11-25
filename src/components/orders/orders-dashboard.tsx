
"use client";

import { useState, useMemo, useEffect, useCallback, memo } from "react";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import { Upload, FileUp, Loader2, Search, Trash2, ShoppingCart } from "lucide-react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

import { Button, buttonVariants } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { DateFilter } from "@/components/dashboard/date-filter";
import type { IncomeSource } from "@/lib/data/incomes-data";
import { type Order, type OrderFormValues } from "@/lib/data/orders-data";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { OrdersTable } from "@/components/orders/orders-table";
import { OrderFormDialog } from "@/components/orders/order-form-dialog";
import { ImportOrdersDialog } from "@/components/orders/import-orders-dialog";
import { SingleImportDialog } from "@/components/orders/single-import-dialog";

// A more robust date parsing function to avoid performance issues.
const parseDateString = (dateString: string): Date => {
    const [year, month, day] = dateString.split('-').map(Number);
    // In JavaScript's Date, months are 0-indexed (0 for January, 11 for December)
    return new Date(year, month - 1, day);
};

const INITIAL_LOAD_COUNT = 50;
const LOAD_MORE_COUNT = 50;

export function OrdersDashboard() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [incomeSources, setIncomeSources] = useState<IncomeSource[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
    const [editingOrder, setEditingOrder] = useState<Order | null>(null);

    const [importDialogOpen, setImportDialogOpen] = useState(false);
    const [singleImportDialogOpen, setSingleImportDialogOpen] = useState(false);

    const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
    const { toast } = useToast();

    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const sortParam = searchParams.get('sort');
    const searchQuery = searchParams.get('q') || "";
    const [localSearch, setLocalSearch] = useState(searchQuery);

    const [initialFormValues, setInitialFormValues] = useState<Partial<OrderFormValues> | undefined>(undefined);

    // Effect to handle URL-based pre-filling
    useEffect(() => {
        const orderIdParam = searchParams.get('order id');
        const gigNameParam = searchParams.get('gig name');

        if (orderIdParam || gigNameParam) {
            const dateParam = searchParams.get('date');
            const clientUsernameParam = searchParams.get('client username');
            const amountParam = searchParams.get('amount');

            let parsedDate = undefined;
            if (dateParam) {
                // Try parsing MM/DD/YYYY first
                const parts = dateParam.split('/');
                if (parts.length === 3) {
                    parsedDate = new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]));
                } else {
                    parsedDate = new Date(dateParam);
                }
            }

            let foundSource = "";
            let foundGig = "";

            if (gigNameParam) {
                foundGig = gigNameParam;
                // Find source that contains this gig
                const sourceWithGig = incomeSources.find(source =>
                    source.gigs.some(gig => gig.name.toLowerCase() === gigNameParam.toLowerCase())
                );
                if (sourceWithGig) {
                    foundSource = sourceWithGig.name;
                }
            }

            setInitialFormValues({
                id: orderIdParam || "",
                date: parsedDate,
                username: clientUsernameParam || "",
                amount: amountParam ? parseFloat(amountParam) : undefined,
                gig: foundGig,
                source: foundSource,
                status: "In Progress", // Default as per requirement
            });

            // Only open if we haven't already opened it for this specific request
            // We can check if the form is already open to prevent loops, 
            // but for now, we'll assume the user lands on this URL to create an order.
            setIsFormDialogOpen(true);
        }
    }, [searchParams, incomeSources]);

    const [visibleCounts, setVisibleCounts] = useState({
        all: INITIAL_LOAD_COUNT,
        "in-progress": INITIAL_LOAD_COUNT,
        completed: INITIAL_LOAD_COUNT,
        cancelled: INITIAL_LOAD_COUNT,
    });

    const [selectedOrders, setSelectedOrders] = useState<Record<string, boolean>>({});
    const [deletingSelected, setDeletingSelected] = useState(false);

    const [date, setDate] = useState<DateRange | undefined>(() => {
        const fromParam = searchParams.get('from');
        const toParam = searchParams.get('to');
        if (fromParam && toParam) {
            const from = new Date(fromParam);
            const to = new Date(toParam);
            if (!isNaN(from.getTime()) && !isNaN(to.getTime())) {
                return { from, to };
            }
        }
        return undefined;
    });

    const fetchOrders = useCallback(async () => {
        try {
            const ordersRes = await fetch('/api/orders');
            if (!ordersRes.ok) throw new Error('Failed to fetch orders');
            const ordersData = await ordersRes.json();
            setOrders(ordersData);
        } catch (e) {
            console.error(e);
            toast({ variant: "destructive", title: "Error", description: "Failed to reload orders." });
        }
    }, [toast]);

    useEffect(() => {
        async function fetchData() {
            setIsLoading(true);
            try {
                const [ordersRes, incomesRes] = await Promise.all([
                    fetch('/api/orders'),
                    fetch('/api/incomes')
                ]);

                if (!ordersRes.ok || !incomesRes.ok) {
                    throw new Error('Failed to fetch initial data');
                }

                const ordersData = await ordersRes.json();
                const incomesData = await incomesRes.json();

                setOrders(ordersData);
                setIncomeSources(incomesData);

            } catch (e) {
                console.error(e);
                toast({ variant: "destructive", title: "Error", description: "Failed to load data." });
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, [toast]);

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

    useEffect(() => {
        setLocalSearch(searchQuery);
    }, [searchQuery]);

    useEffect(() => {
        const handler = setTimeout(() => {
            if (localSearch !== searchQuery) {
                router.push(`${pathname}?${createQueryString({ q: localSearch || null })}`);
            }
        }, 300);

        return () => {
            clearTimeout(handler);
        };
    }, [localSearch, searchQuery, router, pathname, createQueryString]);

    const handleSetDate = (newDate: DateRange | undefined) => {
        setDate(newDate);
        router.push(`${pathname}?${createQueryString({
            from: newDate?.from ? newDate.from.toISOString().split('T')[0] : null,
            to: newDate?.to ? newDate.to.toISOString().split('T')[0] : null,
            q: searchQuery || null
        })}`, { scroll: false });
    };

    useEffect(() => {
        if (!searchParams.has('from') && !searchParams.has('to')) {
            const today = new Date();
            const startOfYear = new Date(today.getFullYear(), 0, 1);
            setDate({ from: startOfYear, to: today });
        }
    }, [searchParams]);

    const sortConfig = useMemo(() => {
        if (!sortParam) return { key: 'date' as keyof Order, direction: 'descending' as const };
        const [key, direction] = sortParam.split('_');
        return { key: key as keyof Order, direction: direction as 'ascending' | 'descending' };
    }, [sortParam]);

    const requestSort = (key: keyof Order) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        const newSortParam = `${key}_${direction}`;
        router.push(`${pathname}?${createQueryString({ sort: newSortParam })}`);
    };

    const handleOpenDialog = (order: Order | null = null) => {
        setEditingOrder(order);
        setIsFormDialogOpen(true);
    };

    const handleOrderAdded = (newOrder: Order) => {
        setOrders(prev => [newOrder, ...prev]);
    };

    const handleOrderImported = (newOrder: Order) => {
        setOrders(prev => [newOrder, ...prev]);
    };

    const handleOrderUpdated = (updatedOrder: Order) => {
        setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
    };

    const handleDeleteOrder = async () => {
        if (!orderToDelete) return;
        setIsSubmitting(true);
        try {
            const response = await fetch(`/api/orders/${orderToDelete.id}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                throw new Error('Failed to delete order');
            }
            setOrders(orders.filter(o => o.id !== orderToDelete.id));
            toast({
                title: "Order Deleted",
                description: `Order ${orderToDelete.id} has been removed.`,
            });
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: (error as Error).message,
            });
        } finally {
            setIsSubmitting(false);
            setOrderToDelete(null);
        }
    };

    const handleDeleteSelectedOrders = async () => {
        setIsSubmitting(true);
        const idsToDelete = Object.keys(selectedOrders).filter(id => selectedOrders[id]);
        try {
            const response = await fetch('/api/orders/bulk-delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderIds: idsToDelete }),
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error || 'Failed to delete selected orders');
            }
            setOrders(prev => prev.filter(o => !idsToDelete.includes(o.id)));
            setSelectedOrders({});
            toast({ title: 'Orders Deleted', description: result.message });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
        } finally {
            setIsSubmitting(false);
            setDeletingSelected(false);
        }
    };

    const parsedOrders = useMemo(() => {
        return orders.map(order => ({ ...order, dateObj: parseDateString(order.date) }));
    }, [orders]);


    const filteredOrders = useMemo(() => {
        let results = parsedOrders;

        if (date?.from || date?.to) {
            results = results.filter(order => {
                const orderDate = order.dateObj;
                const from = date?.from;
                const to = date?.to;

                if (from && !isNaN(from.getTime()) && orderDate < from) {
                    return false;
                }

                if (to && !isNaN(to.getTime())) {
                    const toDateEnd = new Date(to);
                    toDateEnd.setHours(23, 59, 59, 999);
                    if (orderDate > toDateEnd) {
                        return false;
                    }
                }

                return true;
            });
        }

        if (searchQuery) {
            const lowercasedQuery = searchQuery.toLowerCase();
            results = results.filter(order =>
                order.id.toLowerCase().includes(lowercasedQuery) ||
                order.clientUsername.toLowerCase().includes(lowercasedQuery) ||
                order.source.toLowerCase().includes(lowercasedQuery) ||
                (order.gig && order.gig.toLowerCase().includes(lowercasedQuery))
            );
        }

        return results;

    }, [date, parsedOrders, searchQuery]);

    const sortedOrders = useMemo(() => {
        let sortableItems = [...filteredOrders];
        if (sortConfig.key) {
            const key = sortConfig.key;
            sortableItems.sort((a, b) => {
                let aValue: any, bValue: any;

                if (key === 'date') {
                    aValue = a.dateObj.getTime();
                    bValue = b.dateObj.getTime();
                } else {
                    aValue = a[key as keyof Order];
                    bValue = b[key as keyof Order];
                }

                if (aValue === undefined || aValue === null) return 1;
                if (bValue === undefined || bValue === null) return -1;

                if (aValue < bValue) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [filteredOrders, sortConfig]);

    const inProgressOrders = useMemo(() => sortedOrders.filter(o => o.status === 'In Progress'), [sortedOrders]);
    const completedOrders = useMemo(() => sortedOrders.filter(o => o.status === 'Completed'), [sortedOrders]);
    const cancelledOrders = useMemo(() => sortedOrders.filter(o => o.status === 'Cancelled'), [sortedOrders]);

    const numSelected = Object.values(selectedOrders).filter(Boolean).length;

    const renderContent = () => {
        if (isLoading) {
            return <Skeleton className="h-[400px] w-full" />
        }

        const renderTabContent = (
            orderList: (Order & { dateObj: Date; })[],
            tabKey: keyof typeof visibleCounts
        ) => {
            const visibleOrderList = orderList;
            return (
                <div className="space-y-4">
                    <OrdersTable
                        orders={visibleOrderList}
                        onEdit={handleOpenDialog}
                        onDelete={setOrderToDelete}
                        requestSort={requestSort}
                        sortConfig={sortConfig}
                        selectedOrders={selectedOrders}
                        onSelectionChange={setSelectedOrders}
                    />
                </div>
            );
        };

        return (
            <Tabs defaultValue="in-progress" onValueChange={() => setSelectedOrders({})}>
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="in-progress">In Progress ({inProgressOrders.length})</TabsTrigger>
                    <TabsTrigger value="completed">Completed ({completedOrders.length})</TabsTrigger>
                    <TabsTrigger value="cancelled">Cancelled ({cancelledOrders.length})</TabsTrigger>
                    <TabsTrigger value="all">All ({sortedOrders.length})</TabsTrigger>
                </TabsList>
                <TabsContent value="in-progress" className="mt-4">
                    {renderTabContent(inProgressOrders, "in-progress")}
                </TabsContent>
                <TabsContent value="completed" className="mt-4">
                    {renderTabContent(completedOrders, "completed")}
                </TabsContent>
                <TabsContent value="cancelled" className="mt-4">
                    {renderTabContent(cancelledOrders, "cancelled")}
                </TabsContent>
                <TabsContent value="all" className="mt-4">
                    {renderTabContent(sortedOrders, "all")}
                </TabsContent>
            </Tabs>
        )
    }


    return (
        <main className="flex flex-1 flex-col gap-6 p-4 md:gap-8 md:p-8 bg-muted/30 dark:bg-gradient-to-br dark:from-[#0f172a] dark:via-[#1e1b4b] dark:to-[#0f172a] min-h-screen">
            {/* Header Section */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-violet-600 to-purple-600 p-8 text-white shadow-xl">
                <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-2">
                        <h1 className="font-headline text-3xl font-bold tracking-tight md:text-4xl">
                            Manage Orders
                        </h1>
                        <p className="text-blue-100/80 max-w-md text-sm md:text-base">
                            Track and manage your client orders, view financial summaries, and handle imports efficiently.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <Button
                            onClick={() => handleOpenDialog()}
                            size="lg"
                            className="bg-white text-blue-600 hover:bg-blue-50 shadow-lg border-0 font-semibold"
                        >
                            Add New Order
                        </Button>
                        <div className="flex gap-2">
                            <Button variant="outline" size="icon" onClick={() => setSingleImportDialogOpen(true)} className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white" title="Import Single Order">
                                <FileUp className="h-5 w-5" />
                            </Button>
                            <Button variant="outline" size="icon" onClick={() => setImportDialogOpen(true)} className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white" title="Bulk Import">
                                <Upload className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Decorative background elements */}
                <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
                <div className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl" />
            </div>

            {/* Metrics Summary */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border-border/50 dark:border-white/10 dark:bg-white/5 dark:backdrop-blur-sm shadow-sm hover:shadow-md transition-all hover:bg-accent/50 dark:hover:bg-white/10">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                        <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                            <ShoppingCart className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{orders.length}</div>
                        <p className="text-xs text-muted-foreground">All time orders</p>
                    </CardContent>
                </Card>
                <Card className="border-border/50 dark:border-white/10 dark:bg-white/5 dark:backdrop-blur-sm shadow-sm hover:shadow-md transition-all hover:bg-accent/50 dark:hover:bg-white/10">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending</CardTitle>
                        <div className="h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
                            <Loader2 className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{inProgressOrders.length}</div>
                        <p className="text-xs text-muted-foreground">Orders in progress</p>
                    </CardContent>
                </Card>
                <Card className="border-border/50 dark:border-white/10 dark:bg-white/5 dark:backdrop-blur-sm shadow-sm hover:shadow-md transition-all hover:bg-accent/50 dark:hover:bg-white/10">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Completed</CardTitle>
                        <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
                            <FileUp className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{completedOrders.length}</div>
                        <p className="text-xs text-muted-foreground">Successfully delivered</p>
                    </CardContent>
                </Card>
                <Card className="border-border/50 dark:border-white/10 dark:bg-white/5 dark:backdrop-blur-sm shadow-sm hover:shadow-md transition-all hover:bg-accent/50 dark:hover:bg-white/10">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Cancelled</CardTitle>
                        <div className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400">
                            <Trash2 className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{cancelledOrders.length}</div>
                        <p className="text-xs text-muted-foreground">Orders cancelled</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters and Actions Bar */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-border/50 dark:border-white/10 bg-card/50 dark:bg-white/5 dark:backdrop-blur-sm p-4 shadow-sm">
                <div className="flex flex-1 items-center gap-4">
                    <div className="relative flex-1 md:max-w-sm">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search orders..."
                            className="pl-9 bg-muted/50 border-border/50 focus:bg-background transition-colors"
                            value={localSearch}
                            onChange={(e) => setLocalSearch(e.target.value)}
                        />
                    </div>
                    <DateFilter date={date} setDate={handleSetDate} absoluteDuration={true} />
                </div>

                {numSelected > 0 && (
                    <div className="flex items-center gap-3 animate-in fade-in slide-in-from-right-4">
                        <span className="text-sm font-medium text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
                            {numSelected} selected
                        </span>
                        <Button variant="destructive" size="sm" onClick={() => setDeletingSelected(true)} className="shadow-sm">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                        </Button>
                    </div>
                )}
            </div>

            {/* Main Content Area */}
            <Card className="border-border/50 dark:border-white/10 dark:bg-white/5 dark:backdrop-blur-sm shadow-lg dark:shadow-blue-900/20 overflow-hidden">
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="flex h-[400px] items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <Tabs defaultValue="in-progress" onValueChange={() => setSelectedOrders({})} className="w-full">
                            <div className="border-b border-border/50 dark:border-white/10 px-6 py-4 bg-muted/10 dark:bg-white/5">
                                <TabsList className="grid w-full max-w-2xl grid-cols-4 bg-muted/50 dark:bg-black/20 p-1">
                                    <TabsTrigger value="in-progress" className="data-[state=active]:bg-white dark:data-[state=active]:bg-white/10 data-[state=active]:text-foreground dark:data-[state=active]:text-white data-[state=active]:shadow-sm transition-all">
                                        In Progress
                                    </TabsTrigger>
                                    <TabsTrigger value="completed" className="data-[state=active]:bg-white dark:data-[state=active]:bg-white/10 data-[state=active]:text-foreground dark:data-[state=active]:text-white data-[state=active]:shadow-sm transition-all">
                                        Completed
                                    </TabsTrigger>
                                    <TabsTrigger value="cancelled" className="data-[state=active]:bg-white dark:data-[state=active]:bg-white/10 data-[state=active]:text-foreground dark:data-[state=active]:text-white data-[state=active]:shadow-sm transition-all">
                                        Cancelled
                                    </TabsTrigger>
                                    <TabsTrigger value="all" className="data-[state=active]:bg-white dark:data-[state=active]:bg-white/10 data-[state=active]:text-foreground dark:data-[state=active]:text-white data-[state=active]:shadow-sm transition-all">
                                        All Orders
                                    </TabsTrigger>
                                </TabsList>
                            </div>

                            <TabsContent value="in-progress" className="m-0">
                                <OrdersTable
                                    orders={inProgressOrders}
                                    onEdit={handleOpenDialog}
                                    onDelete={setOrderToDelete}
                                    requestSort={requestSort}
                                    sortConfig={sortConfig}
                                    selectedOrders={selectedOrders}
                                    onSelectionChange={setSelectedOrders}
                                />
                            </TabsContent>
                            <TabsContent value="completed" className="m-0">
                                <OrdersTable
                                    orders={completedOrders}
                                    onEdit={handleOpenDialog}
                                    onDelete={setOrderToDelete}
                                    requestSort={requestSort}
                                    sortConfig={sortConfig}
                                    selectedOrders={selectedOrders}
                                    onSelectionChange={setSelectedOrders}
                                />
                            </TabsContent>
                            <TabsContent value="cancelled" className="m-0">
                                <OrdersTable
                                    orders={cancelledOrders}
                                    onEdit={handleOpenDialog}
                                    onDelete={setOrderToDelete}
                                    requestSort={requestSort}
                                    sortConfig={sortConfig}
                                    selectedOrders={selectedOrders}
                                    onSelectionChange={setSelectedOrders}
                                />
                            </TabsContent>
                            <TabsContent value="all" className="m-0">
                                <OrdersTable
                                    orders={sortedOrders}
                                    onEdit={handleOpenDialog}
                                    onDelete={setOrderToDelete}
                                    requestSort={requestSort}
                                    sortConfig={sortConfig}
                                    selectedOrders={selectedOrders}
                                    onSelectionChange={setSelectedOrders}
                                />
                            </TabsContent>
                        </Tabs>
                    )}
                </CardContent>
            </Card>

            <OrderFormDialog
                open={isFormDialogOpen}
                onOpenChange={setIsFormDialogOpen}
                editingOrder={editingOrder}
                incomeSources={incomeSources}
                onOrderAdded={handleOrderAdded}
                onOrderUpdated={handleOrderUpdated}
                initialValues={initialFormValues}
            />

            <ImportOrdersDialog
                open={importDialogOpen}
                onOpenChange={setImportDialogOpen}
                incomeSources={incomeSources}
                onImportSuccess={fetchOrders}
            />

            <SingleImportDialog
                open={singleImportDialogOpen}
                onOpenChange={setSingleImportDialogOpen}
                incomeSources={incomeSources}
                onOrderImported={handleOrderImported}
            />

            <AlertDialog open={!!orderToDelete} onOpenChange={(open) => !open && setOrderToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the order {orderToDelete?.id}.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setOrderToDelete(null)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteOrder} className={cn(buttonVariants({ variant: "destructive" }), { "opacity-50": isSubmitting })} disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={deletingSelected} onOpenChange={setDeletingSelected}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete {numSelected} Orders?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action is permanent and cannot be undone. Are you sure you want to delete the selected orders?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteSelectedOrders} className={cn(buttonVariants({ variant: "destructive" }))} disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Delete Selected"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </main>
    );
}
