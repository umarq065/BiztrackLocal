"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogClose,
} from "@/components/ui/dialog";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import type { IncomeSource } from "@/lib/data/incomes-data";
import { orderFormSchema, type Order, cancellationReasonsList, type OrderFormValues } from "@/lib/data/orders-data";

interface OrderFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editingOrder: Order | null;
    incomeSources: IncomeSource[];
    onOrderAdded: (order: Order) => void;
    onOrderUpdated: (order: Order) => void;
    initialValues?: Partial<OrderFormValues>;
}

const parseDateString = (dateString: string): Date => {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
};

export function OrderFormDialog({
    open,
    onOpenChange,
    editingOrder,
    incomeSources,
    onOrderAdded,
    onOrderUpdated,
    initialValues,
}: OrderFormDialogProps) {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const idCheckTimeout = useRef<NodeJS.Timeout | null>(null);

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

    useEffect(() => {
        if (open) {
            if (editingOrder) {
                const predefinedReasons = editingOrder.cancellationReasons?.filter(r => cancellationReasonsList.includes(r)) || [];
                const customReason = editingOrder.cancellationReasons?.find(r => !cancellationReasonsList.includes(r)) || '';

                form.reset({
                    id: editingOrder.id,
                    username: editingOrder.clientUsername,
                    date: parseDateString(editingOrder.date),
                    amount: editingOrder.amount,
                    source: editingOrder.source,
                    gig: editingOrder.gig,
                    status: editingOrder.status,
                    rating: editingOrder.rating,
                    cancellationReasons: predefinedReasons,
                    customCancellationReason: customReason,
                });
            } else {
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
                    ...initialValues,
                });
            }
        }
    }, [open, editingOrder, form, initialValues]);

    const orderStatus = form.watch("status");
    const selectedSource = form.watch("source");

    const availableGigs = useMemo(() => {
        if (!selectedSource) return [];
        const sourceData = incomeSources.find(s => s.name === selectedSource);
        return sourceData ? sourceData.gigs : [];
    }, [selectedSource, incomeSources]);

    const checkOrderIdUniqueness = async (idToCheck: string): Promise<boolean> => {
        if (!idToCheck || (editingOrder && idToCheck === editingOrder.id)) {
            form.clearErrors("id");
            return true; // Unique (or valid enough)
        }
        try {
            const response = await fetch(`/api/orders/exists/${encodeURIComponent(idToCheck)}`);
            const data = await response.json();
            if (data.exists) {
                form.setError("id", {
                    type: "manual",
                    message: "This Order ID already exists. Please use a unique ID.",
                });
                return false; // Not unique
            } else {
                form.clearErrors("id");
                return true; // Unique
            }
        } catch (error) {
            console.error("Failed to check order ID uniqueness", error);
            return false; // Assume error prevents submission for safety
        }
    };

    const handleOrderIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newId = e.target.value;
        form.setValue("id", newId, { shouldValidate: true });

        if (idCheckTimeout.current) {
            clearTimeout(idCheckTimeout.current);
        }

        idCheckTimeout.current = setTimeout(() => {
            checkOrderIdUniqueness(newId);
        }, 500);
    };

    useEffect(() => {
        return () => {
            if (idCheckTimeout.current) {
                clearTimeout(idCheckTimeout.current);
            }
        };
    }, []);

    // Check uniqueness on mount if initial ID is provided
    useEffect(() => {
        if (open && !editingOrder && initialValues?.id) {
            checkOrderIdUniqueness(initialValues.id);
        }
    }, [open, editingOrder, initialValues]);

    useEffect(() => {
        if (selectedSource) {
            const currentGig = form.getValues("gig");
            const isValid = availableGigs.some(g => g.name === currentGig);
            if (!isValid) {
                form.resetField("gig", { defaultValue: "" });
            }
        }
    }, [selectedSource, availableGigs, form]);

    async function onSubmit(values: OrderFormValues) {
        setIsSubmitting(true);

        // Final uniqueness check before submission
        const isUnique = await checkOrderIdUniqueness(values.id);
        if (!isUnique) {
            setIsSubmitting(false);
            return;
        }

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
                onOrderUpdated(resultOrder);
                toast({
                    title: "Order Updated",
                    description: `Order ${resultOrder.id} has been successfully updated.`,
                });
            } else {
                onOrderAdded(resultOrder);
                toast({
                    title: "Order Added",
                    description: `Order ${resultOrder.id} has been successfully created.`,
                });
            }
            onOpenChange(false);
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

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-6xl max-h-[95vh] flex flex-col p-0 gap-0 border-0 shadow-2xl bg-background/80 backdrop-blur-xl ring-1 ring-white/10 overflow-hidden">
                <DialogHeader className="p-6 pb-6 bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 text-white relative overflow-hidden flex-shrink-0">
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-soft-light"></div>
                    <div className="relative z-10">
                        <DialogTitle className="text-2xl font-bold tracking-tight">
                            {editingOrder ? 'Edit Order' : 'New Order'}
                        </DialogTitle>
                        <DialogDescription className="text-blue-100/80 mt-1 text-base">
                            {editingOrder ? 'Update the order details below.' : 'Create a new order record in the system.'}
                        </DialogDescription>
                    </div>
                    <DialogClose className="absolute right-6 top-6 z-50 rounded-full bg-white/10 p-2 hover:bg-white/20 transition-colors ring-1 ring-white/10">
                        <X className="h-5 w-5 text-white" />
                        <span className="sr-only">Close</span>
                    </DialogClose>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-background to-muted/20">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                            {/* Order Details Section (Violet/Indigo Theme) */}
                            <div className="lg:col-span-12 space-y-4 group">
                                <h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 bg-clip-text text-transparent bg-gradient-to-r from-violet-500 to-fuchsia-500">
                                    <span className="w-1.5 h-1.5 rounded-full bg-violet-500"></span>
                                    Order Details
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 border border-indigo-500/10 rounded-xl bg-indigo-500/5 hover:border-indigo-500/20 hover:bg-indigo-500/10 transition-all duration-300">
                                    <FormField
                                        control={form.control}
                                        name="date"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-col">
                                                <FormLabel className="text-foreground/80">Order Date</FormLabel>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <FormControl>
                                                            <Button
                                                                variant={"outline"}
                                                                className={cn(
                                                                    "h-10 pl-3 text-left font-normal bg-background/50 border-indigo-200/20 focus:border-violet-500 focus:ring-violet-500/20 transition-all",
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
                                                            disabled={(date) =>
                                                                date > new Date() || date < new Date("1900-01-01")
                                                            }
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
                                                <FormLabel className="text-foreground/80">Order ID</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="ORD-..."
                                                        {...field}
                                                        onChange={handleOrderIdChange}
                                                        className="h-10 bg-background/50 border-indigo-200/20 focus:border-violet-500 focus:ring-violet-500/20 transition-all"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            {/* Client & Source Section (Indigo/Violet Theme) */}
                            <div className="lg:col-span-8 space-y-4 group">
                                <h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-violet-500">
                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                                    Client & Source
                                </h3>
                                <div className="p-5 border border-indigo-500/10 rounded-xl bg-indigo-500/5 hover:border-indigo-500/20 hover:bg-indigo-500/10 transition-all duration-300 space-y-6">
                                    <FormField
                                        control={form.control}
                                        name="username"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-foreground/80">Client Username</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="@username"
                                                        {...field}
                                                        className="h-10 bg-background/50 border-indigo-200/20 focus:border-violet-500 focus:ring-violet-500/20 transition-all"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <FormField
                                            control={form.control}
                                            name="source"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-foreground/80">Platform</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger className="h-10 bg-background/50 border-indigo-200/20 focus:ring-violet-500/20 hover:border-violet-500/30 transition-colors">
                                                                <SelectValue placeholder="Select Platform" />
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
                                                    <FormLabel className="text-foreground/80">Gig Type</FormLabel>
                                                    <Select
                                                        onValueChange={field.onChange}
                                                        value={field.value}
                                                        disabled={!selectedSource || availableGigs.length === 0}
                                                    >
                                                        <FormControl>
                                                            <SelectTrigger className="h-10 bg-background/50 border-indigo-200/20 focus:ring-violet-500/20 hover:border-violet-500/30 transition-colors">
                                                                <SelectValue placeholder={!selectedSource ? "Select platform first" : "Select gig"} />
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
                            </div>

                            {/* Status & Financials (Emerald/Teal Theme) */}
                            <div className="lg:col-span-4 space-y-4 group">
                                <h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 to-teal-500">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                    Status & Value
                                </h3>
                                <div className="p-5 border border-emerald-500/10 rounded-xl bg-emerald-500/5 hover:border-emerald-500/20 hover:bg-emerald-500/10 transition-all duration-300 h-full flex flex-col space-y-6">
                                    <FormField
                                        control={form.control}
                                        name="amount"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-foreground/80">Order Value ($)</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500 font-bold">$</span>
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            placeholder="0.00"
                                                            {...field}
                                                            className="pl-7 h-10 bg-background/50 border-emerald-200/20 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all font-mono font-bold"
                                                        />
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="status"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-foreground/80">Current Status</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger className={cn(
                                                            "h-10 border-emerald-200/20 transition-all",
                                                            field.value === 'In Progress' && "text-amber-500",
                                                            field.value === 'Completed' && "text-emerald-500",
                                                            field.value === 'Cancelled' && "text-red-500"
                                                        )}>
                                                            <SelectValue placeholder="Select status" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="In Progress" className="text-amber-500">In Progress</SelectItem>
                                                        <SelectItem value="Completed" className="text-emerald-500">Completed</SelectItem>
                                                        <SelectItem value="Cancelled" className="text-red-500">Cancelled</SelectItem>
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
                                                <FormLabel className="text-foreground/80">Rating (0-5)</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Input
                                                            type="number"
                                                            step="0.1"
                                                            max="5"
                                                            placeholder="-"
                                                            {...field}
                                                            onChange={(e) => {
                                                                const value = e.target.value;
                                                                field.onChange(value === '' ? null : parseFloat(value));
                                                            }}
                                                            value={field.value ?? ''}
                                                            className="h-10 bg-background/50 border-emerald-200/20 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all text-center font-bold"
                                                        />
                                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-500/50">★</div>
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Cancellation Section (Conditional) */}
                        {orderStatus === 'Cancelled' && (
                            <div className="mt-6 p-5 rounded-xl bg-red-500/5 border border-red-500/10 animate-in fade-in slide-in-from-top-4">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="h-1.5 w-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                                    <h3 className="text-sm font-medium text-red-500 uppercase tracking-widest">Cancellation Details</h3>
                                </div>

                                <div className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="cancellationReasons"
                                        render={() => (
                                            <FormItem>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    {cancellationReasonsList.map((reason) => (
                                                        <FormField
                                                            key={reason}
                                                            control={form.control}
                                                            name="cancellationReasons"
                                                            render={({ field }) => (
                                                                <FormItem
                                                                    key={reason}
                                                                    className="flex flex-row items-center space-x-3 space-y-0 p-3 rounded-lg bg-background/40 border border-red-500/10 hover:bg-red-500/5 transition-colors cursor-pointer"
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
                                                                            className="border-red-200/50 data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500"
                                                                        />
                                                                    </FormControl>
                                                                    <FormLabel className="font-normal text-sm cursor-pointer flex-1 text-foreground/80">
                                                                        {reason}
                                                                    </FormLabel>
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
                                        control={form.control}
                                        name="customCancellationReason"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Other Reason</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        placeholder="Specify reason..."
                                                        {...field}
                                                        value={field.value ?? ''}
                                                        className="bg-background/40 border-red-500/10 focus:border-red-500/50 focus:ring-red-500/20 min-h-[80px]"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>
                        )}

                        <DialogFooter className="mt-8 pt-6 border-t border-white/10 flex items-center justify-end gap-3">
                            <DialogClose asChild>
                                <Button type="button" variant="ghost" className="hover:bg-white/10">Cancel</Button>
                            </DialogClose>
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                            >
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {editingOrder ? 'Save Changes' : 'Create Order'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
