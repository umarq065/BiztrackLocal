
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

const importFormSchema = z.object({
    source: z.string({ required_error: "Please select an income source." }).min(1),
    file: z.instanceof(File, { message: "Please upload a CSV file." })
           .refine(file => file.type === "text/csv" || file.name.endsWith(".csv"), "File must be a CSV."),
});

interface ImportOrdersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  incomeSources: IncomeSource[];
  onImportSuccess: () => void;
}

export function ImportOrdersDialog({ open, onOpenChange, incomeSources, onImportSuccess }: ImportOrdersDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof importFormSchema>>({
    resolver: zodResolver(importFormSchema),
  });

  const onSubmit = async (values: z.infer<typeof importFormSchema>) => {
    setIsSubmitting(true);
    const reader = new FileReader();

    reader.onload = async (e) => {
        const csvContent = e.target?.result as string;
        try {
            const response = await fetch('/api/orders/import-bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ source: values.source, csvContent }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to import orders.');
            }

            toast({
                title: "Import Complete",
                description: `${result.importedCount} orders imported successfully. ${result.skippedCount} orders were skipped.`,
            });
            onImportSuccess(); // Refresh the main orders list
            onOpenChange(false);
            form.reset();

        } catch (error: any) {
             toast({ variant: "destructive", title: "Import Failed", description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };
    reader.onerror = () => {
        toast({ variant: "destructive", title: "File Error", description: "Could not read the selected file." });
        setIsSubmitting(false);
    }
    reader.readAsText(values.file);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
          <DialogHeader>
              <DialogTitle>Import Orders from CSV</DialogTitle>
              <DialogDescription>
                  Upload a CSV file to bulk import orders.
              </DialogDescription>
          </DialogHeader>
          <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                  <div className="rounded-md border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-950">
                      <h4 className="mb-2 text-sm font-semibold text-yellow-900 dark:text-yellow-200">CSV Import Guidelines</h4>
                      <ul className="list-disc space-y-1 pl-5 text-xs text-yellow-800 dark:text-yellow-300">
                          <li>Required headers (case-insensitive): <strong>date</strong>, <strong>order id</strong>, <strong>gig name</strong>, <strong>client username</strong>, <strong>amount</strong>.</li>
                          <li>Optional header: <strong>type</strong> (defaults to "Order").</li>
                          <li>Fields with commas must be in double quotes (e.g., "My Gig, with details").</li>
                          <li>Date format: MM/DD/YYYY, YYYY-MM-DD, etc.</li>
                          <li>Max <strong>2000 orders</strong> per file. Orders with existing IDs will be skipped.</li>
                          <li>New clients and gigs (for selected income source) are <strong>auto-created</strong>.</li>
                      </ul>
                  </div>
                  <FormField
                      control={form.control}
                      name="source"
                      render={({ field }) => (
                          <FormItem>
                              <FormLabel>Income Source*</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
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
                  <FormField
                    control={form.control}
                    name="file"
                    render={({ field: { value, onChange, ...fieldProps } }) => (
                       <FormItem>
                            <FormLabel htmlFor="csv-file">CSV File*</FormLabel>
                            <FormControl>
                              <Input 
                                id="csv-file" 
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
