
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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

const importFormSchema = z.object({
    source: z.string().optional(),
    file: z.any().optional(),
});

interface SingleImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  incomeSources: IncomeSource[];
}

export function SingleImportDialog({ open, onOpenChange, incomeSources }: SingleImportDialogProps) {
  const importForm = useForm<z.infer<typeof importFormSchema>>({
    resolver: zodResolver(importFormSchema),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
  );
}
