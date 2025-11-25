
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogClose,
} from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { IncomeSource } from "@/lib/data/incomes-data";
import { useToast } from "@/hooks/use-toast";
import type { Order } from "@/lib/data/orders-data";

const importFormSchema = z.object({
    source: z.string({ required_error: "Please select an income source." }).min(1),
    status: z.enum(["In Progress", "Completed", "Cancelled"], { required_error: "Please select a status." }),
    file: z.instanceof(File, { message: "Please upload a CSV file." })
        .refine(file => file.type === "text/csv" || file.name.endsWith(".csv"), "File must be a CSV."),
});

interface SingleImportDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    incomeSources: IncomeSource[];
    onOrderImported: (newOrder: Order) => void;
}

export function SingleImportDialog({ open, onOpenChange, incomeSources, onOrderImported }: SingleImportDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const form = useForm<z.infer<typeof importFormSchema>>({
        resolver: zodResolver(importFormSchema),
        defaultValues: {
            status: "In Progress",
        }
    });

    const parseCsvLine = (line: string): string[] => {
        const result: string[] = [];
        let currentField = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];

            if (char === '"' && (i === 0 || line[i - 1] !== '\\')) {
                if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
                    // This is an escaped quote
                    currentField += '"';
                    i++; // Skip the second quote
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                result.push(currentField);
                currentField = '';
            } else {
                currentField += char;
            }
        }
        result.push(currentField);
        return result;
    };

    const handleFileParse = (file: File, source: string, status: "In Progress" | "Completed" | "Cancelled") => {
        const reader = new FileReader();
        reader.onload = async (e) => {
            const text = e.target?.result as string;
            const lines = text.split('\n').map(l => l.trim()).filter(line => line.trim() !== '');

            if (lines.length !== 2) {
                toast({ variant: "destructive", title: "Invalid CSV", description: "The CSV file must contain exactly one header row and one data row." });
                setIsSubmitting(false);
                return;
            }

            const headers = parseCsvLine(lines[0]).map(h => h.trim().toLowerCase().replace(/"/g, ''));
            const values = parseCsvLine(lines[1]);

            if (headers.length !== values.length) {
                toast({ variant: "destructive", title: "Parsing Error", description: "CSV columns and values do not match. Check for unclosed quotes." });
                setIsSubmitting(false);
                return;
            }

            const requiredHeaders = ['date', 'order id', 'gig name', 'client username', 'amount'];
            const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));

            if (missingHeaders.length > 0) {
                toast({ variant: "destructive", title: "Invalid CSV Headers", description: `Missing required headers: ${missingHeaders.join(', ')}` });
                setIsSubmitting(false);
                return;
            }

            const orderData = headers.reduce((obj, header, index) => {
                // Trim quotes from the start and end of the value if they exist
                let value = values[index];
                if (value.startsWith('"') && value.endsWith('"')) {
                    value = value.substring(1, value.length - 1);
                }
                obj[header] = value.replace(/""/g, '"'); // Un-escape double quotes
                return obj;
            }, {} as Record<string, string>);

            try {
                const response = await fetch('/api/orders/import-single', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ source, status, orderData }),
                });

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result.error || 'Failed to import order.');
                }

                toast({ title: "Import Successful", description: `Order ${result.order.id} has been imported.` });
                onOrderImported(result.order);
                onOpenChange(false);
                form.reset();
            } catch (error: any) {
                toast({ variant: "destructive", title: "Import Failed", description: error.message });
            } finally {
                setIsSubmitting(false);
            }
        };
        reader.readAsText(file);
    }

    const onSubmit = (values: z.infer<typeof importFormSchema>) => {
        setIsSubmitting(true);
        handleFileParse(values.file, values.source, values.status);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>Import Single Order from CSV</DialogTitle>
                    <DialogDescription>
                        Upload a CSV file to import a single order. Select the status and income source.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                        <div className="rounded-md border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-950">
                            <h4 className="mb-2 text-sm font-semibold text-yellow-900 dark:text-yellow-200">CSV Import Guidelines</h4>
                            <ul className="list-disc space-y-1 pl-5 text-xs text-yellow-800 dark:text-yellow-300">
                                <li>Essential CSV headers (case-insensitive): <strong>date</strong>, <strong>order id</strong>, <strong>gig name</strong>, <strong>client username</strong>, <strong>amount</strong>.</li>
                                <li>The file must contain exactly one header row and one data row.</li>
                                <li>Fields with commas must be enclosed in double quotes (e.g., "My Gig, with comma").</li>
                                <li>Date format: MM/DD/YYYY, YYYY-MM-DD, etc. (standard parsable formats).</li>
                                <li>New clients and gigs (for selected income source) are <strong>auto-created</strong> if they don't exist.</li>
                            </ul>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="source"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Income Source*</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger id="import-source-single">
                                                    <SelectValue placeholder="Select source" />
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
                                name="status"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Status*</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger id="import-status-single">
                                                    <SelectValue placeholder="Select status" />
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
                        </div>

                        <FormField
                            control={form.control}
                            name="file"
                            render={({ field: { value, onChange, ...fieldProps } }) => (
                                <FormItem>
                                    <FormLabel htmlFor="csv-file-single">CSV File*</FormLabel>
                                    <FormControl>
                                        <Input
                                            id="csv-file-single"
                                            type="file"
                                            accept=".csv"
                                            {...fieldProps}
                                            onChange={(e) => onChange(e.target.files ? e.target.files[0] : null)}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button type="button" variant="secondary">Cancel</Button>
                            </DialogClose>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Import
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
