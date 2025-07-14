

"use client";

import { useState, useMemo, useEffect, useCallback, memo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import { CalendarIcon, MoreHorizontal, Star, ArrowUpDown, Edit, Trash2, Upload, FileUp, Loader2, Search } from "lucide-react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
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
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { DateFilter } from "@/components/dashboard/date-filter";
import { Textarea } from "@/components/ui/textarea";
import type { IncomeSource } from "@/lib/data/incomes-data";
import { orderFormSchema, type Order, cancellationReasonsList, type OrderFormValues } from "@/lib/data/orders-data";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";


const clients = [
  { username: "olivia.m", name: "Olivia Martin" },
  { username: "jackson.l", name: "Jackson Lee" },
  { username: "isabella.n", name: "Isabella Nguyen" },
  { username: "will.k", name: "William Kim" },
  { username: "sofia.d", name: "Sofia Davis" },
];

const StarDisplay = ({ rating }: { rating?: number | null }) => {
    if (rating == null) return <span className="text-muted-foreground">N/A</span>;
    return (
        <div className="flex items-center gap-1">
            <Star className="h-4 w-4 text-primary" />
            <span>{rating.toFixed(1)}</span>
        </div>
    );
};

// A more robust date parsing function to avoid performance issues.
const parseDateString = (dateString: string): Date => {
  const [year, month, day] = dateString.split('-').map(Number);
  // In JavaScript's Date, months are 0-indexed (0 for January, 11 for December)
  return new Date(year, month - 1, day);
};

const importFormSchema = z.object({
    source: z.string().optional(),
    file: z.any().optional(),
});

const ORDERS_TO_LOAD = 50;

interface OrdersTableProps {
    orders: (Order & { dateObj: Date })[];
    onEdit: (order: Order) => void;
    onDelete: (order: Order) => void;
}

const OrdersTable = ({ orders, onEdit, onDelete }: OrdersTableProps) => {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Gig</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {orders.length > 0 ? (
                    orders.map((order) => (
                        <TableRow key={order.id}>
                            <TableCell>{format(order.dateObj, 'PPP')}</TableCell>
                            <TableCell className="font-medium">{order.id}</TableCell>
                            <TableCell>{clients.find(c => c.username === order.clientUsername)?.name || order.clientUsername}</TableCell>
                            <TableCell className="text-right">${order.amount.toFixed(2)}</TableCell>
                            <TableCell>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <span className="inline-block max-w-[120px] truncate">
                                                {order.source}
                                            </span>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>{order.source}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </TableCell>
                            <TableCell>{order.gig || <span className="text-muted-foreground">N/A</span>}</TableCell>
                            <TableCell>
                                <StarDisplay rating={order.rating} />
                            </TableCell>
                            <TableCell>
                                <Badge variant={order.status === 'Cancelled' ? 'destructive' : order.status === 'Completed' ? 'default' : 'secondary'}>
                                    {order.status}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button aria-haspopup="true" size="icon" variant="ghost">
                                            <MoreHorizontal className="h-4 w-4" />
                                            <span className="sr-only">Toggle menu</span>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(order); }}>
                                            <Edit className="mr-2 h-4 w-4" />
                                            Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            className="text-destructive focus:text-destructive"
                                            onClick={(e) => { e.stopPropagation(); onDelete(order); }}
                                        >
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))
                ) : (
                    <TableRow>
                        <TableCell colSpan={9} className="h-24 text-center">
                            No orders found.
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    );
};

const OrdersPageComponent = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [incomeSources, setIncomeSources] = useState<IncomeSource[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [importDialogOpen, setImportDialogOpen] = useState(false);
    const [singleImportDialogOpen, setSingleImportDialogOpen] = useState(false);
    const [editingOrder, setEditingOrder] = useState<Order | null>(null);
    const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
    const { toast } = useToast();
    
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const sortParam = searchParams.get('sort');
    const searchQuery = searchParams.get('q') || "";
    const [localSearch, setLocalSearch] = useState(searchQuery);

    const [visibleOrdersCount, setVisibleOrdersCount] = useState(ORDERS_TO_LOAD);

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

    const form = useForm<OrderFormValues>({
        resolver: zodResolver(orderFormSchema),
        defaultValues: {
            date: undefined,
            id: "",
            username: "",
            amount: undefined,
            source: "",
            gig: "",
            status: "In Progress",
            rating: undefined,
            cancellationReasons: [],
            customCancellationReason: "",
        }
    });

    const importForm = useForm<z.infer<typeof importFormSchema>>({
        resolver: zodResolver(importFormSchema),
    });

    const orderStatus = form.watch("status");
    const selectedSource = form.watch("source");

    const availableGigs = useMemo(() => {
        if (!selectedSource) return [];
        const sourceData = incomeSources.find(s => s.name === selectedSource);
        return sourceData ? sourceData.gigs : [];
    }, [selectedSource, incomeSources]);

    useEffect(() => {
        if (selectedSource) {
            form.resetField("gig", { defaultValue: "" });
        }
    }, [selectedSource, form]);

    const handleOpenDialog = (order: Order | null = null) => {
        if (order) {
            setEditingOrder(order);
            const predefinedReasons = order.cancellationReasons?.filter(r => cancellationReasonsList.includes(r)) || [];
            const customReason = order.cancellationReasons?.find(r => !cancellationReasonsList.includes(r)) || '';

            form.reset({
                id: order.id,
                username: order.clientUsername,
                date: parseDateString(order.date),
                amount: order.amount,
                source: order.source,
                gig: order.gig,
                status: order.status,
                rating: order.rating,
                cancellationReasons: predefinedReasons,
                customCancellationReason: customReason,
            });
        } else {
            setEditingOrder(null);
            form.reset({
                date: new Date(),
                id: "",
                username: "",
                amount: undefined,
                source: "",
                gig: "",
                status: "In Progress",
                rating: undefined,
                cancellationReasons: [],
                customCancellationReason: "",
            });
        }
        setDialogOpen(true);
    };

    async function onSubmit(values: OrderFormValues) {
        setIsSubmitting(true);
        const endpoint = editingOrder ? `/api/orders/${editingOrder.id}` : '/api/orders';
        const method = editingOrder ? 'PUT' : 'POST';

        try {
            const response = await fetch(endpoint, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(values),
            });

            if (!response.ok) {
                 const errorData = await response.json();
                if (response.status === 400 && errorData.details) {
                    errorData.details.forEach((err: any) => {
                        form.setError(err.path[0] as keyof OrderFormValues, {
                            type: 'server',
                            message: err.message,
                        });
                    });
                     toast({
                        variant: "destructive",
                        title: "Invalid Input",
                        description: "Please check the highlighted fields.",
                    });
                } else {
                    throw new Error(errorData.error || `Failed to ${editingOrder ? 'update' : 'add'} order`);
                }
                setIsSubmitting(false);
                return;
            }
            
            const resultOrder = await response.json();
            
            if (editingOrder) {
                setOrders(orders.map(o => o.id === editingOrder.id ? resultOrder : o));
                toast({
                    title: "Order Updated",
                    description: `Order ${resultOrder.id} has been successfully updated.`,
                });
            } else {
                setOrders([resultOrder, ...orders]);
                toast({
                    title: "Order Added",
                    description: `Order ${resultOrder.id} has been successfully created.`,
                });
            }
            setDialogOpen(false);
            setEditingOrder(null);
        } catch (error) {
             toast({
                variant: "destructive",
                title: "Error submitting form",
                description: (error as Error).message,
            });
        } finally {
            setIsSubmitting(false);
        }
    }

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

    const requestSort = (key: keyof Order) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        const newSortParam = `${key}_${direction}`;
        router.push(`${pathname}?${createQueryString({ sort: newSortParam })}`, { scroll: false });
    };

    const getSortIndicator = (key: keyof Order) => {
        if (sortConfig.key === key) {
            return <ArrowUpDown className="ml-2 h-4 w-4" />;
        }
        return <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />;
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
                    aValue = a.dateObj;
                    bValue = b.dateObj;
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

    const visibleInProgressOrders = useMemo(() => inProgressOrders.slice(0, visibleOrdersCount), [inProgressOrders, visibleOrdersCount]);
    const visibleCompletedOrders = useMemo(() => completedOrders.slice(0, visibleOrdersCount), [completedOrders, visibleOrdersCount]);
    const visibleCancelledOrders = useMemo(() => cancelledOrders.slice(0, visibleOrdersCount), [cancelledOrders, visibleOrdersCount]);
    const visibleAllOrders = useMemo(() => sortedOrders.slice(0, visibleOrdersCount), [sortedOrders, visibleOrdersCount]);


    const handleLoadMore = () => {
        setVisibleOrdersCount(prev => prev + ORDERS_TO_LOAD);
    };

    const handleTabChange = () => {
        setVisibleOrdersCount(ORDERS_TO_LOAD);
    };

    const renderContent = () => {
        if (isLoading) {
            return <Skeleton className="h-[400px] w-full" />
        }
        return (
            <Tabs defaultValue="in-progress" onValueChange={handleTabChange}>
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="in-progress">In Progress ({inProgressOrders.length})</TabsTrigger>
                    <TabsTrigger value="completed">Completed ({completedOrders.length})</TabsTrigger>
                    <TabsTrigger value="cancelled">Cancelled ({cancelledOrders.length})</TabsTrigger>
                    <TabsTrigger value="all">All ({sortedOrders.length})</TabsTrigger>
                </TabsList>
                <TabsContent value="in-progress" className="mt-4">
                    <OrdersTable
                        orders={visibleInProgressOrders}
                        onEdit={handleOpenDialog}
                        onDelete={setOrderToDelete}
                    />
                    {inProgressOrders.length > visibleInProgressOrders.length && (
                        <div className="mt-6 flex justify-center">
                            <Button onClick={handleLoadMore}>Load More</Button>
                        </div>
                    )}
                </TabsContent>
                <TabsContent value="completed" className="mt-4">
                    <OrdersTable
                        orders={visibleCompletedOrders}
                        onEdit={handleOpenDialog}
                        onDelete={setOrderToDelete}
                    />
                    {completedOrders.length > visibleCompletedOrders.length && (
                        <div className="mt-6 flex justify-center">
                            <Button onClick={handleLoadMore}>Load More</Button>
                        </div>
                    )}
                </TabsContent>
                <TabsContent value="cancelled" className="mt-4">
                     <OrdersTable
                        orders={visibleCancelledOrders}
                        onEdit={handleOpenDialog}
                        onDelete={setOrderToDelete}
                    />
                    {cancelledOrders.length > visibleCancelledOrders.length && (
                        <div className="mt-6 flex justify-center">
                            <Button onClick={handleLoadMore}>Load More</Button>
                        </div>
                    )}
                </TabsContent>
                <TabsContent value="all" className="mt-4">
                     <OrdersTable
                        orders={visibleAllOrders}
                        onEdit={handleOpenDialog}
                        onDelete={setOrderToDelete}
                    />
                    {sortedOrders.length > visibleAllOrders.length && (
                        <div className="mt-6 flex justify-center">
                            <Button onClick={handleLoadMore}>Load More</Button>
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        )
    }


  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center">
        <h1 className="font-headline text-lg font-semibold md:text-2xl">
          Orders
        </h1>
        <div className="ml-auto flex flex-wrap items-center gap-2">
            <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Search orders..."
                    className="pl-8 sm:w-[200px] md:w-[250px]"
                    value={localSearch}
                    onChange={(e) => setLocalSearch(e.target.value)}
                />
            </div>
            <DateFilter date={date} setDate={handleSetDate} />
             <Button variant="default" onClick={() => setSingleImportDialogOpen(true)}>
                <FileUp className="mr-2 h-4 w-4" />
                Import Single Order
            </Button>
            <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
                <Upload className="mr-2 h-4 w-4" />
                Import Orders
            </Button>
            <Button onClick={() => handleOpenDialog()}>Add New Order</Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Manage Orders</CardTitle>
          <CardDescription>
            A sortable list of all your recent orders.
          </CardDescription>
        </CardHeader>
        <CardContent>
            {renderContent()}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{editingOrder ? 'Edit Order' : 'Add New Order'}</DialogTitle>
                    <DialogDescription>
                        Fill in the details below to {editingOrder ? 'update the' : 'create a new'} order.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-4 max-h-[70vh] overflow-y-auto p-1 pr-4">
                            
                            <div className="space-y-4 rounded-md border p-4">
                                <FormLabel className="text-base font-semibold">Order Details</FormLabel>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="date"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Order Date*</FormLabel>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <FormControl>
                                                            <Button
                                                                variant={"outline"}
                                                                className={cn(
                                                                    "w-full justify-start text-left font-normal",
                                                                    !field.value && "text-muted-foreground"
                                                                )}
                                                            >
                                                                {field.value ? (
                                                                    format(field.value, "PPP")
                                                                ) : (
                                                                    <span>Pick a date</span>
                                                                )}
                                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                            </Button>
                                                        </FormControl>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0" align="start">
                                                        <Calendar
                                                            mode="single"
                                                            selected={field.value}
                                                            onSelect={field.onChange}
                                                            initialFocus
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="id"
                                        render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Order ID*</FormLabel>
                                            <FormControl>
                                            <Input placeholder="Manually enter order ID" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                        )}
                                    />
                                </div>
                                 <FormField
                                    control={form.control}
                                    name="amount"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Amount*</FormLabel>
                                            <FormControl>
                                                <Input type="number" step="0.01" placeholder="e.g., 499.99" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="space-y-4 rounded-md border p-4">
                                <FormLabel className="text-base font-semibold">Client & Source</FormLabel>
                                <FormField
                                    control={form.control}
                                    name="username"
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>Username*</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g., olivia.m" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                            control={form.control}
                                            name="source"
                                            render={({ field }) => (
                                                <FormItem>
                                                <FormLabel>Source*</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select an income source" />
                                                    </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {incomeSources.map(source => (
                                                            <SelectItem key={source.id} value={source.name}>{source.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    <FormField
                                        control={form.control}
                                        name="gig"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Gig*</FormLabel>
                                                <Select 
                                                    onValueChange={field.onChange} 
                                                    value={field.value}
                                                    disabled={!selectedSource || availableGigs.length === 0}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder={!selectedSource ? "Select a source first" : "Select a gig"} />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {availableGigs.map(gig => (
                                                            <SelectItem key={gig.id} value={gig.name}>{gig.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>
                            
                            <div className="space-y-4 rounded-md border p-4">
                                <FormLabel className="text-base font-semibold">Status & Rating</FormLabel>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="status"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Order Status*</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select a status" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="In Progress">In Progress</SelectItem>
                                                        <SelectItem value="Completed">Completed</SelectItem>
                                                        <SelectItem value="Cancelled">Cancelled</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="rating"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Rating (0.0 - 5.0)</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        step="0.1"
                                                        placeholder="e.g., 4.2"
                                                        {...field}
                                                        onChange={(e) => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))}
                                                        value={field.value ?? ''}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                {orderStatus === 'Cancelled' && (
                                    <div className="space-y-4 pt-4">
                                        <FormField
                                            control={form.control}
                                            name="cancellationReasons"
                                            render={() => (
                                                <FormItem>
                                                    <div className="mb-4">
                                                        <FormLabel className="text-base">Reason for Cancellation</FormLabel>
                                                        <FormDescription>
                                                            Select any applicable reasons.
                                                        </FormDescription>
                                                    </div>
                                                    <div className="space-y-2">
                                                        {cancellationReasonsList.map((reason) => (
                                                            <FormField
                                                                key={reason}
                                                                control={form.control}
                                                                name="cancellationReasons"
                                                                render={({ field }) => {
                                                                    return (
                                                                        <FormItem
                                                                            key={reason}
                                                                            className="flex flex-row items-start space-x-3 space-y-0"
                                                                        >
                                                                            <FormControl>
                                                                                <Checkbox
                                                                                    checked={field.value?.includes(reason)}
                                                                                    onCheckedChange={(checked) => {
                                                                                        return checked
                                                                                            ? field.onChange([...(field.value || []), reason])
                                                                                            : field.onChange(
                                                                                                field.value?.filter(
                                                                                                    (value) => value !== reason
                                                                                                )
                                                                                            )
                                                                                    }}
                                                                                />
                                                                            </FormControl>
                                                                            <FormLabel className="font-normal">
                                                                                {reason}
                                                                            </FormLabel>
                                                                        </FormItem>
                                                                    )
                                                                }}
                                                            />
                                                        ))}
                                                    </div>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="customCancellationReason"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Other Reason</FormLabel>
                                                    <FormControl>
                                                        <Textarea placeholder="If other, please specify reason for cancellation..." {...field} value={field.value ?? ''} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        <DialogFooter>
                            <DialogClose asChild>
                                <Button type="button" variant="secondary">Cancel</Button>
                            </DialogClose>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {editingOrder ? 'Save Changes' : 'Add Order'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
      </Dialog>

      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="sm:max-w-xl">
            <DialogHeader>
                <DialogTitle>Import Orders from CSV</DialogTitle>
                <DialogDescription>
                    Upload a CSV file to bulk import orders.
                </DialogDescription>
            </DialogHeader>
            <Form {...importForm}>
                <form className="space-y-4 py-4">
                    <div className="rounded-md border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-950">
                        <h4 className="mb-2 text-sm font-semibold text-yellow-900 dark:text-yellow-200">CSV Import Guidelines</h4>
                        <ul className="list-disc space-y-1 pl-5 text-xs text-yellow-800 dark:text-yellow-300">
                            <li>Essential CSV headers (case-insensitive): <strong>Date</strong>, <strong>Client Username</strong>, <strong>Amount</strong>.</li>
                            <li>Optional headers: <strong>Order ID</strong>, <strong>Gig Name</strong>, <strong>Type</strong>.</li>
                            <li>If <strong>'Order ID'</strong> is provided, rows with the same Order ID will be combined: amounts are summed, other details (like Gig Name) are taken from the first row for that ID. The combined Order ID must be <strong>unique</strong> in the database. If 'Order ID' is blank for a row, it's treated as a unique order.</li>
                            <li>Optional 'Type' column (e.g., "Order", "Order Extra"). Defaults to "Order" if missing. This is stored for your reference.</li>
                            <li>Fields with commas must be in double quotes (e.g., "My Gig, with details"). Escaped double quotes: "My ""quoted"" Gig".</li>
                            <li>Date format: MM/DD/YYYY, YY-MM-DD, etc. (standard parsable formats).</li>
                            <li>Max <strong>2000 orders</strong> per file.</li>
                            <li>New clients and gigs (for selected income source) are <strong>auto-created</strong>.</li>
                        </ul>
                    </div>
                    <FormField
                        control={importForm.control}
                        name="source"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Income Source</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger id="import-source">
                                            <SelectValue placeholder="Select an income source" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {incomeSources.map(source => (
                                            <SelectItem key={source.id} value={source.name}>{source.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormDescription>
                                    New gigs from your CSV will be added to this source.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormItem>
                         <FormLabel htmlFor="csv-file">CSV File</FormLabel>
                         <FormControl>
                            <Input id="csv-file" type="file" accept=".csv" />
                         </FormControl>
                    </FormItem>
                </form>
            </Form>
            <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="secondary">Cancel</Button>
                </DialogClose>
                <Button type="submit">Import</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={singleImportDialogOpen} onOpenChange={setSingleImportDialogOpen}>
        <DialogContent className="sm:max-w-xl">
            <DialogHeader>
                <DialogTitle>Import Single Order from CSV</DialogTitle>
                <DialogDescription>
                    Upload a CSV file to import a single order. The file should contain only one order record.
                </DialogDescription>
            </DialogHeader>
            <Form {...importForm}>
                <form className="space-y-4 py-4">
                    <div className="rounded-md border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-950">
                        <h4 className="mb-2 text-sm font-semibold text-yellow-900 dark:text-yellow-200">CSV Import Guidelines</h4>
                        <ul className="list-disc space-y-1 pl-5 text-xs text-yellow-800 dark:text-yellow-300">
                             <li>Essential CSV headers (case-insensitive): <strong>Date</strong>, <strong>Client Username</strong>, <strong>Amount</strong>.</li>
                            <li>Optional headers: <strong>Order ID</strong>, <strong>Gig Name</strong>, <strong>Type</strong>.</li>
                            <li>If <strong>'Order ID'</strong> is provided, rows with the same Order ID will be combined: amounts are summed, other details (like Gig Name) are taken from the first row for that ID. The combined Order ID must be <strong>unique</strong> in the database. If 'Order ID' is blank for a row, it's treated as a unique order.</li>
                            <li>Optional 'Type' column (e.g., "Order", "Order Extra"). Defaults to "Order" if missing. This is stored for your reference.</li>
                            <li>Fields with commas must be in double quotes (e.g., "My Gig, with details"). Escaped double quotes: "My ""quoted"" Gig".</li>
                            <li>Date format: MM/DD/YYYY, YY-MM-DD, etc. (standard parsable formats).</li>
                            <li>New clients and gigs (for selected income source) are <strong>auto-created</strong>.</li>
                        </ul>
                    </div>
                    <FormField
                        control={importForm.control}
                        name="source"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Income Source</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger id="import-source-single">
                                            <SelectValue placeholder="Select an income source" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {incomeSources.map(source => (
                                            <SelectItem key={source.id} value={source.name}>{source.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormDescription>
                                    New gigs from your CSV will be added to this source.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormItem>
                         <FormLabel htmlFor="csv-file-single">CSV File</FormLabel>
                         <FormControl>
                            <Input id="csv-file-single" type="file" accept=".csv" />
                         </FormControl>
                    </FormItem>
                </form>
            </Form>
            <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="secondary">Cancel</Button>
                </DialogClose>
                <Button type="submit">Import</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

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
    </main>
  );
}


const MemoizedOrdersPage = memo(OrdersPageComponent);

export default function OrdersPage() {
  return <MemoizedOrdersPage />;
}
