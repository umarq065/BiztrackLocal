"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon, MoreHorizontal, Star } from "lucide-react";

import { Button } from "@/components/ui/button";
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
    Form,
    FormControl,
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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";


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
];

const clients = [
  { username: "olivia.m", name: "Olivia Martin" },
  { username: "jackson.l", name: "Jackson Lee" },
  { username: "isabella.n", name: "Isabella Nguyen" },
  { username: "will.k", name: "William Kim" },
  { username: "sofia.d", name: "Sofia Davis" },
];

const incomeSources = ["Comprehensive Web Design & Development for Enterprise", "Consulting", "Logo Design", "SEO Services and Digital Marketing Campaigns", "Maintenance", "Web Design"];

const orderFormSchema = z.object({
  date: z.date({ required_error: "An order date is required." }),
  id: z.string().min(1, "Order ID is required."),
  username: z.string().min(1, "Username is required."),
  amount: z.coerce.number().positive({ message: "Amount must be positive." }),
  source: z.string().min(1, "Source is required."),
  rating: z.coerce.number().min(0, "Rating must be at least 0").max(5, "Rating cannot be more than 5").optional(),
  isCancelled: z.boolean().default(false),
});

type OrderFormValues = z.infer<typeof orderFormSchema>;

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
    const [open, setOpen] = useState(false);
    const { toast } = useToast();

    const form = useForm<OrderFormValues>({
        resolver: zodResolver(orderFormSchema),
        defaultValues: {
            isCancelled: false,
        }
    });

    const handleOpenChange = (isOpen: boolean) => {
        if (isOpen) {
            form.reset({
                date: new Date(),
                id: `ORD${(orders.length + 1).toString().padStart(3, '0')}`,
                username: "",
                amount: undefined,
                source: "",
                rating: undefined,
                isCancelled: false,
            });
        }
        setOpen(isOpen);
    };

    function onSubmit(values: OrderFormValues) {
        const newOrder: Order = {
            id: values.id,
            clientUsername: values.username,
            date: format(values.date, "yyyy-MM-dd"),
            amount: values.amount,
            source: values.source,
            rating: values.rating,
            status: values.isCancelled ? 'Cancelled' : 'Completed',
        };
        setOrders([newOrder, ...orders]);
        toast({
            title: "Order Added",
            description: `Order ${newOrder.id} has been successfully created.`,
        });
        setOpen(false);
    }

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center">
        <h1 className="font-headline text-lg font-semibold md:text-2xl">
          Orders
        </h1>
        <div className="ml-auto">
            <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button>Add New Order</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Add New Order</DialogTitle>
                    <DialogDescription>
                        Fill in the details below to create a new order.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="date"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                    <FormLabel>Order Date*</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                            variant={"outline"}
                                            className={cn(
                                                "pl-3 text-left font-normal",
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
                                    <Input placeholder="e.g., ORD006" {...field} />
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
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select an income source" />
                                        </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {incomeSources.map(source => (
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

                        <DialogFooter>
                            <DialogClose asChild>
                                <Button type="button" variant="secondary">Cancel</Button>
                            </DialogClose>
                            <Button type="submit">Add Order</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
            </Dialog>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Manage Orders</CardTitle>
          <CardDescription>
            A list of all your recent orders.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Order ID</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Gig</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>{order.date}</TableCell>
                  <TableCell className="font-medium">{order.id}</TableCell>
                  <TableCell>{clients.find(c => c.username === order.clientUsername)?.name || order.clientUsername}</TableCell>
                  <TableCell>${order.amount.toFixed(2)}</TableCell>
                  <TableCell>
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
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                        <DropdownMenuItem>Edit</DropdownMenuItem>
                        <DropdownMenuItem>Mark as Cancelled</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}
