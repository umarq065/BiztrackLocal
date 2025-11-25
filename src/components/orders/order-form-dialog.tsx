
"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
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
                                                    <Input
                                                        placeholder="Manually enter order ID"
                                                        {...field}
                                                        onChange={handleOrderIdChange}
                                                    />
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
                                                        onChange={(e) => {
                                                            const value = e.target.value;
                                                            field.onChange(value === '' ? null : parseFloat(value));
                                                        }}
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
    );
}
