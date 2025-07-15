
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { IncomeSource } from "@/lib/data/incomes-data";

const addDataFormSchema = z.object({
    date: z.date({ required_error: "A date is required." }),
    messages: z.coerce.number().int().min(0, { message: "Number of messages must be a non-negative number." }),
});
type AddDataFormValues = z.infer<typeof addDataFormSchema>;

interface AddSourceDataDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    source: IncomeSource | null;
    onDataAdded: (updatedSource: IncomeSource) => void;
}

export function AddSourceDataDialog({ open, onOpenChange, source, onDataAdded }: AddSourceDataDialogProps) {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const form = useForm<AddDataFormValues>({
        resolver: zodResolver(addDataFormSchema),
        defaultValues: {
            date: new Date(),
            messages: 0,
        },
    });

    const selectedDate = form.watch("date");

    useEffect(() => {
        if (source && selectedDate) {
            const dateString = format(selectedDate, "yyyy-MM-dd");
            const existingData = source.dataPoints?.find(dp => dp.date === dateString);
            form.setValue("messages", existingData?.messages || 0);
        }
    }, [selectedDate, source, form]);

    async function onSubmit(values: AddDataFormValues) {
        if (!source) return;
        setIsSubmitting(true);
        try {
            const response = await fetch(`/api/incomes/${source.id}/data`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(values),
            });

            if (!response.ok) {
                throw new Error('Failed to add data to source');
            }

            const { source: updatedSource } = await response.json();
            onDataAdded(updatedSource);
            toast({ title: "Data Saved", description: `Message data for ${format(values.date, "PPP")} has been saved.` });
            onOpenChange(false);
        } catch (error) {
            console.error(error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Could not save data. Please try again.",
            });
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Add Data to &quot;{source?.name}&quot;</DialogTitle>
                    <DialogDescription>
                        Add or update the number of messages for a specific date.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="date"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                <FormLabel>Date</FormLabel>
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
                            name="messages"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>No. of Messages</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="e.g., 150" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        </div>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button type="button" variant="secondary">Cancel</Button>
                            </DialogClose>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Data
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
