
"use client";

import { useState, memo, useEffect, lazy, Suspense, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, subDays, differenceInDays } from "date-fns";
import type { DateRange } from "react-day-picker";
import { CalendarIcon, Pencil, Trash2, Loader2 } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
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
import { DateFilter } from "@/components/dashboard/date-filter";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { expenseFormSchema, type Expense, type ExpenseFormValues } from "@/lib/data/expenses-data";
import { ExpensesKpiCards } from "./expenses-kpi-cards";
import { ExpensesTable } from "./expenses-table";
import { Alert, AlertTitle, AlertDescription as AlertDesc } from "@/components/ui/alert";
import { Database } from "lucide-react";

const ExpenseChart = lazy(() => import("@/components/expenses/expense-chart"));
const ExpenseTrendChart = lazy(() => import("@/components/expenses/expense-trend-chart"));

const MemoizedExpensesDashboard = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const { toast } = useToast();
  
  const [date, setDate] = useState<DateRange | undefined>();
  const [filterCategory, setFilterCategory] = useState('all');
  
  const [editingCategory, setEditingCategory] = useState<{ oldName: string; newName: string } | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<string | null>(null);
  
  const [chartView, setChartView] = useState('daily');
  const [chartType, setChartType] = useState('line');
  const [showComparison, setShowComparison] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      setError(null);
      try {
        const [expensesRes, categoriesRes] = await Promise.all([
          fetch('/api/expenses'),
          fetch('/api/expenses/categories'),
        ]);

        if (!expensesRes.ok || !categoriesRes.ok) {
          throw new Error('Failed to fetch data from the server.');
        }
        
        const expensesData = await expensesRes.json();
        const categoriesData = await categoriesRes.json();
        
        setExpenses(expensesData);
        setExpenseCategories(categoriesData);

      } catch (e) {
        console.error(e);
        setError('Could not connect to the database or fetch data. Please check the connection and try again.');
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [toast]);


  useEffect(() => {
    const today = new Date();
    const from = new Date(today.getFullYear(), today.getMonth(), 1);
    setDate({ from, to: today });
  }, []);
  
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

  const handleOpenDialog = (expense: Expense | null = null) => {
    if (expense) {
      setEditingExpense(expense);
      form.reset({
        date: new Date(expense.date.replace(/-/g, '/')),
        type: expense.type,
        amount: expense.amount,
        category: expense.category,
        recurring: expense.recurring || false,
      });
    } else {
      setEditingExpense(null);
      form.reset({
        date: new Date(),
        type: "",
        amount: 0,
        category: "",
        recurring: false,
      });
    }
    setOpen(true);
  };

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
        
        if (editingExpense) {
            setExpenses(prev => prev.map(exp => exp.id === savedExpense.id ? savedExpense : exp));
            toast({ title: "Expense Updated" });
        } else {
            setExpenses(prev => [savedExpense, ...prev]);
            toast({ title: "Expense Added" });
        }
        setOpen(false);

    } catch (error) {
        console.error(error);
        toast({
            variant: "destructive",
            title: "Error",
            description: (error as Error).message,
        });
    } finally {
        setIsSubmitting(false);
    }
  }

  const handleDeleteExpense = async () => {
    if (!deletingExpense) return;
    setIsSubmitting(true);
    try {
        const response = await fetch(`/api/expenses/${deletingExpense.id}`, { method: 'DELETE' });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to delete expense');
        }
        setExpenses(expenses.filter(exp => exp.id !== deletingExpense.id));
        toast({ title: "Expense Deleted" });
    } catch (error) {
         toast({
            variant: "destructive",
            title: "Error",
            description: (error as Error).message,
        });
    } finally {
        setIsSubmitting(false);
        setDeletingExpense(null);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newCategory.trim() && !expenseCategories.some(cat => cat.toLowerCase() === newCategory.trim().toLowerCase())) {
        try {
            const response = await fetch('/api/expenses/categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newCategory.trim() }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to add category');
            }
            const addedCategory = await response.json();
            setExpenseCategories(prev => [...prev, addedCategory.name].sort());
            setNewCategory("");
            toast({ title: "Category Added" });
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: (error as Error).message });
        }
    } else {
        toast({ variant: "destructive", title: "Error", description: "Category is empty or already exists." });
    }
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory) return;
    const { oldName, newName } = editingCategory;
    const trimmedNewName = newName.trim();

    if (!trimmedNewName) return;

    try {
        const response = await fetch('/api/expenses/categories', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ oldName, newName: trimmedNewName }),
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to update category');
        }
        setExpenseCategories(prev => prev.map(cat => cat === oldName ? trimmedNewName : cat).sort());
        setExpenses(prev => prev.map(exp => exp.category === oldName ? { ...exp, category: trimmedNewName } : exp));
        toast({ title: "Category Updated" });
        setEditingCategory(null);
    } catch (error) {
        toast({ variant: "destructive", title: "Error", description: (error as Error).message });
    }
  };

  const handleDeleteCategory = async () => {
      if (!deletingCategory) return;
      try {
          const response = await fetch('/api/expenses/categories', {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name: deletingCategory }),
          });
          if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || 'Failed to delete category');
          }
          setExpenseCategories(prev => prev.filter(cat => cat !== deletingCategory));
          toast({ title: "Category Deleted" });
      } catch (error) {
           toast({ variant: "destructive", title: "Error", description: (error as Error).message });
      } finally {
          setDeletingCategory(null);
      }
  };

 const filteredData = useMemo(() => {
    if (!date?.from || !date?.to) return { filteredExpenses: [], previousPeriodExpenses: [] };

    const fromDate = date.from;
    const toDate = date.to;

    const filtered = expenses.filter(exp => {
      const expDate = new Date(exp.date.replace(/-/g, '/'));
      return expDate >= fromDate && expDate <= toDate;
    });

    const duration = differenceInDays(toDate, fromDate);
    const prevToDate = subDays(fromDate, 1);
    const prevFromDate = subDays(prevToDate, duration);

    const previousFiltered = expenses.filter(exp => {
      const expDate = new Date(exp.date.replace(/-/g, '/'));
      return expDate >= prevFromDate && expDate <= prevToDate;
    });
    
    return { filteredExpenses: filtered, previousPeriodExpenses: previousFiltered };

  }, [expenses, date]);

  const { filteredExpenses, previousPeriodExpenses } = filteredData;
  
  const kpiData = useMemo(() => {
    const totalExpenses = filteredExpenses.reduce((acc, exp) => acc + exp.amount, 0);
    const prevTotalExpenses = previousPeriodExpenses.reduce((acc, exp) => acc + exp.amount, 0);
    const totalExpensesChange = prevTotalExpenses > 0 ? ((totalExpenses - prevTotalExpenses) / prevTotalExpenses) * 100 : null;
    
    const daysInPeriod = date?.from && date?.to ? differenceInDays(date.to, date.from) + 1 : 1;
    const avgDailyBurn = totalExpenses / daysInPeriod;
    const prevDaysInPeriod = date?.from && date?.to ? differenceInDays(subDays(date.from, 1), subDays(subDays(date.from, 1), daysInPeriod - 1)) + 1 : 1;
    const prevAvgDailyBurn = prevTotalExpenses / (prevDaysInPeriod || 1);
    const avgDailyBurnChange = prevAvgDailyBurn > 0 ? ((avgDailyBurn - prevAvgDailyBurn) / prevAvgDailyBurn) * 100 : null;

    const categoryTotals = filteredExpenses.reduce((acc, { category, amount }) => {
        acc[category] = (acc[category] || 0) + amount;
        return acc;
    }, {} as Record<string, number>);

    const topSpendingCategory = Object.entries(categoryTotals).sort(([, a], [, b]) => b - a)[0] || ["N/A", 0];

    const largestSingleExpense = [...filteredExpenses].sort((a, b) => b.amount - a.amount)[0] || { type: 'N/A', amount: 0 };
    
    const totalRecurringCost = filteredExpenses.filter(e => e.recurring).reduce((acc, exp) => acc + exp.amount, 0);
    const fixedCostRatio = totalExpenses > 0 ? (totalRecurringCost / totalExpenses) * 100 : 0;

    return {
        totalExpenses,
        totalExpensesChange: totalExpensesChange ? { value: totalExpensesChange.toFixed(1), type: totalExpensesChange >= 0 ? 'increase' : 'decrease' } : null,
        avgDailyBurn,
        avgDailyBurnChange: avgDailyBurnChange ? { value: avgDailyBurnChange.toFixed(1), type: avgDailyBurnChange >= 0 ? 'increase' : 'decrease' } : null,
        previousPeriodDescription: `vs. previous ${daysInPeriod} days`,
        topSpendingCategory: { name: topSpendingCategory[0], amount: topSpendingCategory[1] },
        largestSingleExpense: { type: largestSingleExpense.type, amount: largestSingleExpense.amount },
        momExpenseGrowth: totalExpensesChange ? { value: totalExpensesChange.toFixed(1), type: totalExpensesChange >= 0 ? 'increase' : 'decrease' } : null,
        totalRecurringCost,
        fixedCostRatio: { value: fixedCostRatio.toFixed(1) + '%' }
    };
  }, [filteredExpenses, previousPeriodExpenses, date]);

  const pieChartData = useMemo(() => {
    const colors = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];
    const categoryTotals = filteredExpenses.reduce((acc, { category, amount }) => {
        acc[category] = (acc[category] || 0) + amount;
        return acc;
    }, {} as Record<string, number>);

    return Object.entries(categoryTotals)
        .map(([name, amount], index) => ({
            name,
            amount,
            fill: colors[index % colors.length]
        }))
        .sort((a, b) => b.amount - a.amount);
  }, [filteredExpenses]);

 const trendChartData = useMemo(() => {
    const dataMap = new Map<string, number>();
    filteredExpenses.forEach(exp => {
        const dateKey = format(new Date(exp.date.replace(/-/g, '/')), 'yyyy-MM-dd');
        dataMap.set(dateKey, (dataMap.get(dateKey) || 0) + exp.amount);
    });
    return Array.from(dataMap.entries()).map(([date, amount]) => ({ date, amount })).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
 }, [filteredExpenses]);

 const previousTrendChartData = useMemo(() => {
    const dataMap = new Map<string, number>();
    previousPeriodExpenses.forEach(exp => {
        const dateKey = format(new Date(exp.date.replace(/-/g, '/')), 'yyyy-MM-dd');
        dataMap.set(dateKey, (dataMap.get(dateKey) || 0) + exp.amount);
    });
    return Array.from(dataMap.entries()).map(([date, amount]) => ({ date, amount })).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
 }, [previousPeriodExpenses]);

  if (isLoading) {
    return (
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-[200px] w-full" />
            <Skeleton className="h-[400px] w-full" />
        </main>
    )
  }

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center">
        <h1 className="font-headline text-lg font-semibold md:text-2xl">
          Expenses
        </h1>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <DateFilter date={date} setDate={setDate} />
          <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">Manage Categories</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Manage Expense Categories</DialogTitle>
                    <DialogDescription>Add, edit, or delete expense categories.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddCategory} className="space-y-4 pt-4">
                    <div className="flex items-center gap-2">
                        <Input 
                            value={newCategory} 
                            onChange={(e) => setNewCategory(e.target.value)}
                            placeholder="New category name"
                            disabled={!!editingCategory}
                        />
                        <Button type="submit" disabled={!!editingCategory || isSubmitting}>Add</Button>
                    </div>
                </form>
                <div className="space-y-2">
                    <p className="text-sm font-medium">Existing Categories:</p>
                    <div className="max-h-60 space-y-1 overflow-y-auto pr-2">
                        {expenseCategories.map(cat => (
                            <div key={cat} className="group flex h-12 items-center justify-between rounded-md border p-2">
                                {editingCategory?.oldName === cat ? (
                                    <div className="flex w-full items-center gap-2">
                                        <Input
                                            value={editingCategory.newName}
                                            onChange={(e) => setEditingCategory({ ...editingCategory, newName: e.target.value })}
                                            className="h-8"
                                            autoFocus
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') { e.preventDefault(); handleUpdateCategory(); }
                                                if (e.key === 'Escape') setEditingCategory(null);
                                            }}
                                        />
                                        <Button size="sm" onClick={handleUpdateCategory} className="h-8" disabled={isSubmitting}>Save</Button>
                                        <Button size="sm" variant="ghost" onClick={() => setEditingCategory(null)} className="h-8">Cancel</Button>
                                    </div>
                                ) : (
                                    <>
                                        <span className="text-sm">{cat}</span>
                                        <div className="flex items-center opacity-0 transition-opacity group-hover:opacity-100">
                                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingCategory({ oldName: cat, newName: cat })}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeletingCategory(cat)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="secondary" onClick={() => setEditingCategory(null)}>Close</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button onClick={() => handleOpenDialog()}>Add New Expense</Button>
        </div>
      </div>
       {error && (
            <Alert variant="destructive">
                <Database className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDesc>
                    {error}
                </AlertDesc>
            </Alert>
        )}
      <div className="grid grid-cols-1 gap-6">
          <ExpensesKpiCards {...kpiData} />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
                <ExpenseTrendChart
                    data={trendChartData}
                    previousData={previousTrendChartData}
                    showComparison={showComparison}
                    onShowComparisonChange={setShowComparison}
                    chartView={chartView}
                    onChartViewChange={setChartView}
                    chartType={chartType}
                    onChartTypeChange={setChartType}
                />
            </Suspense>
            <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
                {pieChartData.length > 0 ? (
                    <ExpenseChart data={pieChartData} />
                ) : (
                    <div className="flex h-full items-center justify-center rounded-lg border">
                        <p className="text-muted-foreground">No expense category data for this period.</p>
                    </div>
                )}
            </Suspense>
          </div>
          <ExpensesTable
              expenses={filteredExpenses}
              onEdit={handleOpenDialog}
              onDelete={setDeletingExpense}
          />
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
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
                            <Button type="button" variant="secondary" onClick={() => setEditingExpense(null)}>Cancel</Button>
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
        <AlertDialog open={!!deletingExpense} onOpenChange={(open) => !open && setDeletingExpense(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the expense "{deletingExpense?.type}".
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteExpense} disabled={isSubmitting} className={buttonVariants({ variant: "destructive" })}>
                 {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Delete
            </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={!!deletingCategory} onOpenChange={(open) => !open && setDeletingCategory(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
                This will permanently delete the category "{deletingCategory}". This action cannot be undone.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCategory} className={buttonVariants({ variant: "destructive" })}>
                Delete
            </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}

export const ExpensesDashboard = memo(MemoizedExpensesDashboard);
