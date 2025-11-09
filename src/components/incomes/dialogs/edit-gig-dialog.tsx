

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
import type { Gig } from "@/lib/data/incomes-data";

const editGigFormSchema = z.object({
    name: z.string().min(2, { message: "Gig name must be at least 2 characters." }),
    date: z.date({ required_error: "A date for the gig is required." }),
});
type EditGigFormValues = z.infer<typeof editGigFormSchema>;

interface EditGigDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editingGigInfo: { sourceId: string; gig: Gig };
    onGigUpdated: (updatedGig: Gig, sourceId: string) => void;
}

export function EditGigDialog({ open, onOpenChange, editingGigInfo, onGigUpdated }: EditGigDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const form = useForm<EditGigFormValues>({
        resolver: zodResolver(editGigFormSchema),
    });

    useEffect(() => {
        if (editingGigInfo) {
            form.reset({
                name: editingGigInfo.gig.name,
                date: new Date(editingGigInfo.gig.date),
            });
        }
    }, [editingGigInfo, form]);

    async function onSubmit(values: EditGigFormValues) {
        if (!editingGigInfo) return;
        setIsSubmitting(true);

        const { sourceId, gig } = editingGigInfo;

        try {
            const response = await fetch(`/api/incomes/${sourceId}/gigs/${gig.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(values),
            });

            if (!response.ok) {
                throw new Error('Failed to update gig');
            }

            const { gig: updatedGig } = await response.json();
            onGigUpdated(updatedGig, sourceId);

            toast({
                title: "Gig Updated",
                description: `Gig "${values.name}" has been updated.`,
            });
            onOpenChange(false);
        } catch (error) {
            console.error(error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Could not update the gig. Please try again.",
            });
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Edit Gig</DialogTitle>
                    <DialogDescription>
                       Update the details for &quot;{editingGigInfo?.gig.name}&quot;.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Gig Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., New Project" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
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
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button type="button" variant="secondary">Cancel</Button>
                            </DialogClose>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Save Changes
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
