
"use client";

import { useState, useEffect } from "react";
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
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { expenseFormSchema, type Expense, type ExpenseFormValues } from "@/lib/data/expenses-data";
import { useToast } from "@/hooks/use-toast";

interface ExpenseFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editingExpense: Expense | null;
    onExpenseSaved: (expense: Expense) => void;
    expenseCategories: string[];
}

export function ExpenseFormDialog({ open, onOpenChange, editingExpense, onExpenseSaved, expenseCategories }: ExpenseFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
        date: new Date(),
        type: "",
        amount: 0,
        category: "",
        recurring: false,
    },
  });

  useEffect(() => {
    if (open) {
      if (editingExpense) {
        form.reset({
          date: new Date(editingExpense.date.replace(/-/g, '/')),
          type: editingExpense.type,
          amount: editingExpense.amount,
          category: editingExpense.category,
          recurring: editingExpense.recurring || false,
        });
      } else {
        form.reset({
          date: new Date(),
          type: "",
          amount: 0,
          category: "",
          recurring: false,
        });
      }
    }
  }, [open, editingExpense, form]);

  async function onSubmit(values: ExpenseFormValues) {
    setIsSubmitting(true);
    const method = editingExpense ? 'PUT' : 'POST';
    const endpoint = editingExpense ? `/api/expenses/${editingExpense.id}` : '/api/expenses';

    try {
        const response = await fetch(endpoint, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(values),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Failed to ${editingExpense ? 'update' : 'add'} expense`);
        }

        const savedExpense = await response.json();
        onExpenseSaved(savedExpense);
        onOpenChange(false); // Close dialog on success
    } catch (error) {
        console.error(error);
        toast({
          variant: "destructive",
          title: "Error",
          description: (error as Error).message || "An unexpected error occurred.",
        });
    } finally {
        setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
          <DialogHeader>
              <DialogTitle>{editingExpense ? 'Edit Expense' : 'Add New Expense'}</DialogTitle>
              <DialogDescription>
                  Fill in the details below to {editingExpense ? 'update an' : 'add a new'} expense.
              </DialogDescription>
          </DialogHeader>
          <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                          <FormItem>
                              <FormLabel>Expense Type</FormLabel>
                              <FormControl>
                                  <Input placeholder="e.g., Software Subscription" {...field} />
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
                              <FormLabel>Amount</FormLabel>
                              <FormControl>
                                  <Input type="number" placeholder="e.g., 49.99" {...field} />
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
                          <FormLabel>Expense Date</FormLabel>
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
              </div>
              <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                      <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                              <FormControl>
                                  <SelectTrigger>
                                      <SelectValue placeholder="Select a category" />
                                  </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                  {expenseCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                              </SelectContent>
                          </Select>
                          <FormMessage />
                      </FormItem>
                  )}
              />
              <FormField
                  control={form.control}
                  name="recurring"
                  render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                              <FormLabel>Recurring Expense</FormLabel>
                              <FormDescription>
                                  Mark this if it's a regular, predictable cost.
                              </FormDescription>
                          </div>
                          <FormControl>
                              <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                              />
                          </FormControl>
                      </FormItem>
                  )}
              />
              <DialogFooter>
                  <DialogClose asChild>
                      <Button type="button" variant="secondary">Cancel</Button>
                  </DialogClose>
                  <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      {editingExpense ? 'Save Changes' : 'Add Expense'}
                  </Button>
              </DialogFooter>
              </form>
          </Form>
      </DialogContent>
    </Dialog>
  );
}
