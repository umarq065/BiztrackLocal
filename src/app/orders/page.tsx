
"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import { CalendarIcon, MoreHorizontal, Star, ArrowUpDown, Edit, Trash2 } from "lucide-react";
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
import { initialIncomeSources } from "@/lib/data/incomes-data";


interface Order {
    id: string;
    clientUsername: string;
    date: string;
    amount: number;
    source: string;
    gig?: string;
    status: 'Completed' | 'In Progress' | 'Cancelled';
    rating?: number;
    cancellationReasons?: string[];
}

const initialOrders: Order[] = [
    { id: 'ORD001', clientUsername: 'olivia.m', date: '2024-05-20', amount: 1999.00, source: 'Web Design', gig: 'Acme Corp Redesign', status: 'Completed', rating: 5 },
    { id: 'ORD002', clientUsername: 'jackson.l', date: '2024-05-21', amount: 399.00, source: 'Consulting', gig: 'Q1 Strategy Session', status: 'Completed', rating: 4.2 },
    { id: 'ORD003', clientUsername: 'isabella.n', date: '2024-05-22', amount: 299.00, source: 'Logo Design', gig: "Brand Identity for 'Innovate'", status: 'Cancelled', cancellationReasons: ["Not satisfied with design"] },
    { id: 'ORD004', clientUsername: 'will.k', date: '2024-05-23', amount: 999.00, source: 'Web Design', gig: 'Startup Landing Page', status: 'In Progress' },
    { id: 'ORD005', clientUsername: 'sofia.d', date: '2024-05-24', amount: 499.00, source: 'SEO Services', gig: 'Monthly SEO Retainer', status: 'Completed', rating: 3.7 },
];

const clients = [
  { username: "olivia.m", name: "Olivia Martin" },
  { username: "jackson.l", name: "Jackson Lee" },
  { username: "isabella.n", name: "Isabella Nguyen" },
  { username: "will.k", name: "William Kim" },
  { username: "sofia.d", name: "Sofia Davis" },
];

const incomeSourceNames = initialIncomeSources.map(s => s.name);

const orderFormSchema = z.object({
  date: z.date({ required_error: "An order date is required." }),
  id: z.string().min(1, "Order ID is required."),
  username: z.string().min(1, "Username is required."),
  amount: z.coerce.number().positive({ message: "Amount must be positive." }),
  source: z.string().min(1, "Source is required."),
  gig: z.string().min(1, "Gig is required."),
  rating: z.coerce.number().min(0, "Rating must be at least 0").max(5, "Rating cannot be more than 5").optional(),
  isCancelled: z.boolean().default(false),
  cancellationReasons: z.array(z.string()).optional(),
  customCancellationReason: z.string().optional(),
});

type OrderFormValues = z.infer<typeof orderFormSchema>;

const cancelOrderFormSchema = z.object({
  cancellationReasons: z.array(z.string()).optional(),
  customCancellationReason: z.string().optional(),
}).refine(
  (data) => (data.cancellationReasons?.length ?? 0) > 0 || (data.customCancellationReason?.trim() ?? "") !== "",
  {
    message: "At least one cancellation reason must be provided.",
    path: ["cancellationReasons"],
  }
);
type CancelOrderFormValues = z.infer<typeof cancelOrderFormSchema>;


const cancellationReasonsList = [
    "Canceled without requirements",
    "Expectations beyond requirements",
    "Not satisfied with design",
    "Not satisfied with animations",
    "Late delivery",
    "Unresponsive buyer",
];

const StarDisplay = ({ rating }: { rating?: number }) => {
    if (rating === undefined) return <span className="text-muted-foreground">N/A</span>;
    return (
        <div className="flex items-center gap-1">
            <Star className="h-4 w-4 text-primary" />
            <span>{rating.toFixed(1)}</span>
        </div>
    );
};


export default function OrdersPage() {
    const [orders, setOrders] = useState<Order[]>(initialOrders);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingOrder, setEditingOrder] = useState<Order | null>(null);
    const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);
    const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
    const { toast } = useToast();
    
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const sortParam = searchParams.get('sort');
    const fromParam = searchParams.get('from');
    const toParam = searchParams.get('to');

    const [date, setDate] = useState<DateRange | undefined>(() => {
        if (fromParam && toParam) {
            const from = new Date(fromParam.replace(/-/g, '/'));
            const to = new Date(toParam.replace(/-/g, '/'));
            if (!isNaN(from.getTime()) && !isNaN(to.getTime())) {
                return { from, to };
            }
        }
        return undefined;
    });

    useEffect(() => {
        if (!date) {
            const today = new Date();
            const startOfYear = new Date(today.getFullYear(), 0, 1);
            setDate({ from: startOfYear, to: today });
        }
    }, [date]);

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

    const handleSetDate = (newDate: DateRange | undefined) => {
        setDate(newDate);
        router.push(`${pathname}?${createQueryString({
            from: newDate?.from ? newDate.from.toISOString().split('T')[0] : null,
            to: newDate?.to ? newDate.to.toISOString().split('T')[0] : null,
        })}`);
    };

    const sortConfig = useMemo(() => {
        if (!sortParam) return { key: null, direction: 'ascending' as const };
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
            rating: undefined,
            isCancelled: false,
            cancellationReasons: [],
            customCancellationReason: "",
        }
    });

    const cancelForm = useForm<CancelOrderFormValues>({
        resolver: zodResolver(cancelOrderFormSchema),
        defaultValues: {
            cancellationReasons: [],
            customCancellationReason: "",
        },
    });

    const isCancelled = form.watch("isCancelled");
    const selectedSource = form.watch("source");

    const availableGigs = useMemo(() => {
        if (!selectedSource) return [];
        const sourceData = initialIncomeSources.find(s => s.name === selectedSource);
        return sourceData ? sourceData.gigs : [];
    }, [selectedSource]);

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
                date: new Date(order.date.replace(/-/g, '/')),
                amount: order.amount,
                source: order.source,
                gig: order.gig,
                rating: order.rating,
                isCancelled: order.status === 'Cancelled',
                cancellationReasons: predefinedReasons,
                customCancellationReason: customReason,
            });
        } else {
            setEditingOrder(null);
            form.reset({
                date: new Date(),
                id: `ORD${Math.floor(Math.random() * 1000)}`,
                username: "",
                amount: undefined,
                source: "",
                gig: "",
                rating: undefined,
                isCancelled: false,
                cancellationReasons: [],
                customCancellationReason: "",
            });
        }
        setDialogOpen(true);
    };

    function onSubmit(values: OrderFormValues) {
        let finalCancellationReasons: string[] | undefined = undefined;
        if (values.isCancelled) {
            const reasons = values.cancellationReasons || [];
            if (values.customCancellationReason && values.customCancellationReason.trim()) {
                reasons.push(values.customCancellationReason.trim());
            }
            if (reasons.length > 0) {
                finalCancellationReasons = reasons;
            }
        }

        const newOrder: Order = {
            id: values.id,
            clientUsername: values.username,
            date: format(values.date, "yyyy-MM-dd"),
            amount: values.amount,
            source: values.source,
            gig: values.gig,
            rating: values.rating,
            status: values.isCancelled ? 'Cancelled' : 'Completed',
            cancellationReasons: finalCancellationReasons,
        };

        if (editingOrder) {
            setOrders(orders.map(o => o.id === editingOrder.id ? newOrder : o));
            toast({
                title: "Order Updated",
                description: `Order ${newOrder.id} has been successfully updated.`,
            });
        } else {
            setOrders([newOrder, ...orders]);
            toast({
                title: "Order Added",
                description: `Order ${newOrder.id} has been successfully created.`,
            });
        }
        setDialogOpen(false);
        setEditingOrder(null);
    }
    
    function onCancelSubmit(values: CancelOrderFormValues) {
        if (!orderToCancel) return;

        let finalCancellationReasons: string[] = [];
        if (values.cancellationReasons) {
            finalCancellationReasons = [...values.cancellationReasons];
        }
        if (values.customCancellationReason && values.customCancellationReason.trim()) {
            finalCancellationReasons.push(values.customCancellationReason.trim());
        }

        setOrders(prevOrders => 
            prevOrders.map(o => 
                o.id === orderToCancel.id 
                ? { ...o, status: 'Cancelled', cancellationReasons: finalCancellationReasons } 
                : o
            )
        );
        toast({
            title: "Order Cancelled",
            description: `Order ${orderToCancel.id} has been marked as cancelled.`,
        });
        setOrderToCancel(null);
        cancelForm.reset();
    }

    const handleDeleteOrder = () => {
        if (!orderToDelete) return;
        setOrders(orders.filter(o => o.id !== orderToDelete.id));
        toast({
            title: "Order Deleted",
            description: `Order ${orderToDelete.id} has been removed.`,
        });
        setOrderToDelete(null);
    };

    const requestSort = (key: keyof Order) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        const newSortParam = `${key}_${direction}`;
        router.push(`${pathname}?${createQueryString({ sort: newSortParam })}`);
    };

    const getSortIndicator = (key: keyof Order) => {
        if (sortConfig.key === key) {
            return <ArrowUpDown className="ml-2 h-4 w-4" />;
        }
        return <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />;
    };

    const filteredOrders = useMemo(() => {
        if (!date) {
            return [];
        }
        return orders.filter(order => {
            if (!order.date) return false;
            const orderDate = new Date(order.date.replace(/-/g, '/'));

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
    }, [date, orders]);

    const sortedOrders = useMemo(() => {
        let sortableItems = [...filteredOrders];
        if (sortConfig.key) {
            const key = sortConfig.key;
            sortableItems.sort((a, b) => {
                const aValue = a[key];
                const bValue = b[key];

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

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center">
        <h1 className="font-headline text-lg font-semibold md:text-2xl">
          Orders
        </h1>
        <div className="ml-auto flex items-center gap-2">
            <DateFilter date={date} setDate={handleSetDate} />
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                    <Button variant="ghost" onClick={() => requestSort('date')}>
                        Date {getSortIndicator('date')}
                    </Button>
                </TableHead>
                <TableHead>
                    <Button variant="ghost" onClick={() => requestSort('id')}>
                        Order ID {getSortIndicator('id')}
                    </Button>
                </TableHead>
                <TableHead>
                    <Button variant="ghost" onClick={() => requestSort('clientUsername')}>
                        Client {getSortIndicator('clientUsername')}
                    </Button>
                </TableHead>
                <TableHead className="text-right">
                    <Button variant="ghost" onClick={() => requestSort('amount')}>
                        Amount {getSortIndicator('amount')}
                    </Button>
                </TableHead>
                <TableHead>
                     <Button variant="ghost" onClick={() => requestSort('source')}>
                        Source {getSortIndicator('source')}
                    </Button>
                </TableHead>
                <TableHead>
                    <Button variant="ghost" onClick={() => requestSort('gig')}>
                        Gig {getSortIndicator('gig')}
                    </Button>
                </TableHead>
                <TableHead>
                    <Button variant="ghost" onClick={() => requestSort('rating')}>
                        Rating {getSortIndicator('rating')}
                    </Button>
                </TableHead>
                <TableHead>
                    <Button variant="ghost" onClick={() => requestSort('status')}>
                        Status {getSortIndicator('status')}
                    </Button>
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedOrders.length > 0 ? (
                sortedOrders.map((order) => (
                    <TableRow key={order.id}>
                    <TableCell>{format(new Date(order.date.replace(/-/g, '/')), 'PPP')}</TableCell>
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
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleOpenDialog(order); }}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                            </DropdownMenuItem>
                            {order.status !== 'Cancelled' && (
                                <DropdownMenuItem
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        cancelForm.reset();
                                        setOrderToCancel(order);
                                    }}
                                    className="text-destructive focus:text-destructive"
                                >
                                    Mark as Cancelled
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuItem 
                                className="text-destructive focus:text-destructive" 
                                onClick={(e) => { e.stopPropagation(); setOrderToDelete(order); }}
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
                        No orders found for the selected period.
                    </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{editingOrder ? 'Edit Order' : 'Add New Order'}</DialogTitle>
                    <DialogDescription>
                        Fill in the details below to {editingOrder ? 'update the' : 'create a new'} order.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-4 max-h-[60vh] overflow-y-auto p-1 pr-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="date"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col justify-end">
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
                                        <FormLabel>Order ID</FormLabel>
                                        <FormControl>
                                        <Input placeholder="e.g., ORD006" {...field} disabled={!!editingOrder} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />
                            </div>

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
                                                {incomeSourceNames.map(source => (
                                                    <SelectItem key={source} value={source}>{source}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

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
                                                value={field.value ?? ""}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="isCancelled"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel>
                                        Mark as Cancelled
                                        </FormLabel>
                                    </div>
                                    </FormItem>
                                )}
                            />
                            
                            {isCancelled && (
                                <div className="space-y-4 rounded-md border p-4">
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
                                                    <Textarea placeholder="If other, please specify reason for cancellation..." {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            )}
                        </div>

                        <DialogFooter>
                            <DialogClose asChild>
                                <Button type="button" variant="secondary">Cancel</Button>
                            </DialogClose>
                            <Button type="submit">{editingOrder ? 'Save Changes' : 'Add Order'}</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
      </Dialog>

      <Dialog open={!!orderToCancel} onOpenChange={(isOpen) => { if (!isOpen) setOrderToCancel(null); }}>
        <DialogContent>
            <DialogHeader>
            <DialogTitle>Cancel Order: {orderToCancel?.id}</DialogTitle>
            <DialogDescription>
                Please provide the reason(s) for cancelling this order. This action cannot be undone.
            </DialogDescription>
            </DialogHeader>
            <Form {...cancelForm}>
            <form onSubmit={cancelForm.handleSubmit(onCancelSubmit)} className="space-y-4">
                <div className="space-y-4 max-h-[60vh] overflow-y-auto p-1 pr-4">
                <FormField
                    control={cancelForm.control}
                    name="cancellationReasons"
                    render={() => (
                    <FormItem>
                        <div className="mb-4">
                        <FormLabel className="text-base">Reason for Cancellation</FormLabel>
                        <FormDescription>Select any applicable reasons.</FormDescription>
                        </div>
                        <div className="space-y-2">
                        {cancellationReasonsList.map((reason) => (
                            <FormField
                            key={reason}
                            control={cancelForm.control}
                            name="cancellationReasons"
                            render={({ field }) => (
                                <FormItem key={reason} className="flex flex-row items-start space-x-3 space-y-0">
                                <FormControl>
                                    <Checkbox
                                    checked={field.value?.includes(reason)}
                                    onCheckedChange={(checked) => {
                                        return checked
                                        ? field.onChange([...(field.value || []), reason])
                                        : field.onChange(field.value?.filter((value) => value !== reason));
                                    }}
                                    />
                                </FormControl>
                                <FormLabel className="font-normal">{reason}</FormLabel>
                                </FormItem>
                            )}
                            />
                        ))}
                        </div>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={cancelForm.control}
                    name="customCancellationReason"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Other Reason</FormLabel>
                        <FormControl>
                        <Textarea placeholder="If other, please specify reason for cancellation..." {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                </div>
                <DialogFooter>
                <Button type="button" variant="secondary" onClick={() => setOrderToCancel(null)}>Cancel</Button>
                <Button type="submit" variant="destructive">Confirm Cancellation</Button>
                </DialogFooter>
            </form>
            </Form>
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
            <AlertDialogAction onClick={handleDeleteOrder} className={buttonVariants({ variant: "destructive" })}>
                Delete
            </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
