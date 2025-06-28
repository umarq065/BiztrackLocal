
"use client";

import { useState, useMemo, useEffect, lazy, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, getQuarter, getYear, startOfWeek } from "date-fns";
import type { DateRange } from "react-day-picker";
import { CalendarIcon, Pencil, Trash2 } from "lucide-react";

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
import { initialExpenses, expenseFormSchema, type Expense, type ExpenseFormValues } from "@/lib/data/expenses-data";
import { ExpensesKpiCards } from "./expenses-kpi-cards";
import { ExpensesTable } from "./expenses-table";

const ExpenseChart = lazy(() => import("@/components/expenses/expense-chart"));
const ExpenseTrendChart = lazy(() => import("@/components/expenses/expense-trend-chart"));

export function ExpensesDashboard() {
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [open, setOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const { toast } = useToast();
  const [date, setDate] = useState<DateRange | undefined>();
  const [filterCategory, setFilterCategory] = useState('all');
  const [showComparison, setShowComparison] = useState(false);
  const [chartView, setChartView] = useState("daily");
  const [chartType, setChartType] = useState('line');
  const [editingCategory, setEditingCategory] = useState<{ oldName: string; newName: string } | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<string | null>(null);

  useEffect(() => {
    const today = new Date();
    const from = new Date(today.getFullYear(), today.getMonth(), 1);
    setDate({ from, to: today });
  }, []);

  const [expenseCategories, setExpenseCategories] = useState([
    "Software", 
    "Subscription",
    "Office Supplies", 
    "Hardware",
    "Marketing", 
    "Cloud Hosting", 
    "Freelancer Payment", 
    "Salary",
    "Travel", 
    "Other"
  ].sort());

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

  function onSubmit(values: ExpenseFormValues) {
    const expenseData: Expense = {
      id: editingExpense ? editingExpense.id : `exp-${Date.now()}`,
      date: format(values.date, "yyyy-MM-dd"),
      type: values.type,
      amount: values.amount,
      category: values.category,
      recurring: values.recurring,
    };

    if (editingExpense) {
      setExpenses(expenses.map(exp => exp.id === editingExpense.id ? expenseData : exp));
      toast({
        title: "Expense Updated",
        description: `${values.type} has been updated.`,
      });
    } else {
      setExpenses([expenseData, ...expenses]);
      toast({
        title: "Expense Added",
        description: `${values.type} has been added to your expenses.`,
      });
    }
    
    setEditingExpense(null);
    setOpen(false);
  }

  const handleDeleteExpense = () => {
    if (!deletingExpense) return;
    setExpenses(expenses.filter(exp => exp.id !== deletingExpense.id));
    toast({
      title: "Expense Deleted",
      description: `Expense "${deletingExpense.type}" has been removed.`,
    });
    setDeletingExpense(null);
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCategory.trim() && !expenseCategories.some(cat => cat.toLowerCase() === newCategory.trim().toLowerCase())) {
        const updatedCategories = [...expenseCategories, newCategory.trim()];
        setExpenseCategories(updatedCategories.sort());
        setNewCategory("");
        toast({
            title: "Category Added",
            description: `"${newCategory.trim()}" has been added.`,
        });
    } else {
        toast({
            variant: "destructive",
            title: "Error",
            description: newCategory.trim() ? "Category already exists." : "Category name cannot be empty.",
        });
    }
  };

  const handleUpdateCategory = () => {
    if (!editingCategory) return;
    const { oldName, newName } = editingCategory;
    const trimmedNewName = newName.trim();

    if (!trimmedNewName) {
        toast({ variant: "destructive", title: "Error", description: "Category name cannot be empty." });
        return;
    }

    if (trimmedNewName.toLowerCase() !== oldName.toLowerCase() && expenseCategories.some(cat => cat.toLowerCase() === trimmedNewName.toLowerCase())) {
        toast({ variant: "destructive", title: "Error", description: "Category name already exists." });
        return;
    }

    setExpenseCategories(expenseCategories.map(cat => cat === oldName ? trimmedNewName : cat).sort());
    setExpenses(expenses.map(exp => exp.category === oldName ? { ...exp, category: trimmedNewName } : exp));
    
    toast({ title: "Category Updated", description: `"${oldName}" was renamed to "${trimmedNewName}".` });
    setEditingCategory(null);
  };

  const handleDeleteCategory = () => {
      if (!deletingCategory) return;
      
      const isCategoryInUse = expenses.some(exp => exp.category === deletingCategory);
      
      if (isCategoryInUse) {
          toast({
              variant: "destructive",
              title: "Cannot Delete Category",
              description: `"${deletingCategory}" is in use by one or more expenses.`,
          });
          setDeletingCategory(null);
          return;
      }
      
      setExpenseCategories(expenseCategories.filter(cat => cat !== deletingCategory));
      toast({ title: "Category Deleted", description: `"${deletingCategory}" has been removed.` });
      setDeletingCategory(null);
  };

  const filteredExpenses = useMemo(() => {
    return expenses.filter(expense => {
      if (!expense.date) return false;
      const expenseDate = new Date(expense.date.replace(/-/g, "/"));
      
      const from = date?.from;
      const to = date?.to;

      if (from && expenseDate < from) {
        return false;
      }
      if (to) {
        const toDateEnd = new Date(to);
        toDateEnd.setHours(23, 59, 59, 999);
        if (expenseDate > toDateEnd) {
          return false;
        }
      }
      
      if (filterCategory !== 'all' && expense.category !== filterCategory) {
        return false;
      }
      
      return true;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [date, expenses, filterCategory]);

  const {
    totalExpenses,
    avgDailyBurn,
    totalExpensesChange,
    avgDailyBurnChange,
    topSpendingCategory,
    momExpenseGrowth,
    largestSingleExpense,
    totalRecurringCost,
    fixedCostRatio,
    previousPeriodDescription,
  } = useMemo(() => {
    const currentTotal = filteredExpenses.reduce((acc, curr) => acc + curr.amount, 0);
    let currentDays = 0;
    if (date?.from && date?.to) {
      currentDays = (date.to.getTime() - date.from.getTime()) / (1000 * 60 * 60 * 24) + 1;
    }
    const currentAvgBurn = currentDays > 0 ? currentTotal / currentDays : 0;

    let previousTotal = 0;
    let previousAvgBurn = 0;
    let previousPeriodDescription = "vs. previous period";
    if (date?.from && date?.to) {
      const duration = date.to.getTime() - date.from.getTime();
      const prevTo = new Date(date.from.getTime() - 1);
      const prevFrom = new Date(prevTo.getTime() - duration);
      
      previousPeriodDescription = `vs. ${format(prevFrom, "MMM d")} - ${format(prevTo, "MMM d")}`;

      const previousPeriodExpenses = expenses.filter(expense => {
          const expenseDate = new Date(expense.date.replace(/-/g, '/'));
          return expenseDate >= prevFrom && expenseDate <= prevTo;
      });

      previousTotal = previousPeriodExpenses.reduce((acc, curr) => acc + curr.amount, 0);
      const prevDays = (prevTo.getTime() - prevFrom.getTime()) / (1000 * 60 * 60 * 24) + 1;
      previousAvgBurn = prevDays > 0 ? previousTotal / prevDays : 0;
    }
    
    const calculateChange = (current: number, previous: number) => {
        if (previous === 0) {
            return current > 0 ? { value: '+100.0', type: 'increase' as const } : null;
        }
        if (current === 0 && previous > 0) {
            return { value: '-100.0', type: 'decrease' as const};
        }
        const diff = ((current - previous) / previous) * 100;
        if (Math.abs(diff) < 0.1) return null;
        return {
            value: `${diff >= 0 ? '+' : ''}${diff.toFixed(1)}`,
            type: diff >= 0 ? 'increase' as const : 'decrease' as const,
        };
    };

    const totalExpensesChange = calculateChange(currentTotal, previousTotal);
    const avgDailyBurnChange = calculateChange(currentAvgBurn, previousAvgBurn);
    
    const categoryTotals = filteredExpenses.reduce((acc, expense) => {
        acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
        return acc;
    }, {} as Record<string, number>);

    let topSpendingCategory = { name: "N/A", amount: 0 };
    if (Object.keys(categoryTotals).length > 0) {
        const topCategoryName = Object.keys(categoryTotals).reduce((a, b) => categoryTotals[a] > categoryTotals[b] ? a : b);
        topSpendingCategory = { name: topCategoryName, amount: categoryTotals[topCategoryName] };
    }

    let largestSingleExpense = { type: 'N/A', amount: 0 };
    if (filteredExpenses.length > 0) {
        const largest = filteredExpenses.reduce((max, expense) => expense.amount > max.amount ? expense : max, filteredExpenses[0]);
        largestSingleExpense = { type: largest.type, amount: largest.amount };
    }
    
    const momExpenseGrowth = totalExpensesChange;
    
    const thisMonthDate = date?.to ? new Date(date.to) : new Date();
    const currentMonth = thisMonthDate.getMonth();
    const currentYear = thisMonthDate.getFullYear();
    const recurringExpensesInPeriod = filteredExpenses.filter(e => e.recurring);
    const totalRecurringInPeriod = recurringExpensesInPeriod.reduce((sum, e) => sum + e.amount, 0);
    const fixedCostRatioValue = currentTotal > 0 ? (totalRecurringInPeriod / currentTotal) * 100 : 0;
    
    const fixedCostRatio = {
        value: `${fixedCostRatioValue.toFixed(1)}%`,
    };

    const totalRecurringCostForMonth = expenses
      .filter(e => e.recurring)
      .filter(e => {
          const expenseDate = new Date(e.date.replace(/-/g, '/'));
          return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
      })
      .reduce((sum, e) => sum + e.amount, 0);

    return { 
      totalExpenses: currentTotal, 
      avgDailyBurn: currentAvgBurn,
      totalExpensesChange,
      avgDailyBurnChange,
      topSpendingCategory,
      momExpenseGrowth,
      largestSingleExpense,
      totalRecurringCost: totalRecurringCostForMonth,
      fixedCostRatio,
      previousPeriodDescription,
    };
  }, [date, expenses, filteredExpenses]);

  const expensesByCategory = useMemo(() => {
    const categoryMap: Map<string, number> = new Map();
    filteredExpenses.forEach((expense) => {
      const currentAmount = categoryMap.get(expense.category) || 0;
      categoryMap.set(expense.category, currentAmount + expense.amount);
    });

    const COLORS = [
      "hsl(var(--chart-1))",
      "hsl(var(--chart-2))",
      "hsl(var(--chart-3))",
      "hsl(var(--chart-4))",
      "hsl(var(--chart-5))",
    ];

    const sortedCategories = Array.from(categoryMap.entries())
      .sort((a, b) => b[1] - a[1]);

    return sortedCategories.map(([name, amount], index) => ({
      name,
      amount,
      fill: COLORS[index % COLORS.length],
    }));
  }, [filteredExpenses]);

   const { expenseTrendData, previousExpenseTrendData } = useMemo(() => {
        const getAggregatedData = (expensesToAggregate: Expense[], view: string) => {
            if (!expensesToAggregate.length) return [];
            
            const totals = expensesToAggregate.reduce((acc, { date, amount }) => {
                const expenseDate = new Date(date.replace(/-/g, "/"));
                let key = "";

                switch(view) {
                    case 'weekly':
                        key = format(startOfWeek(expenseDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');
                        break;
                    case 'monthly':
                        key = format(expenseDate, 'yyyy-MM-01');
                        break;
                    case 'quarterly':
                        key = `${getYear(expenseDate)}-Q${getQuarter(expenseDate)}`;
                        break;
                    case 'yearly':
                        key = format(expenseDate, 'yyyy');
                        break;
                    default: // daily
                        key = format(expenseDate, 'yyyy-MM-dd');
                }
                
                if (key) {
                    acc[key] = (acc[key] || 0) + amount;
                }
                return acc;
            }, {} as Record<string, number>);

            return Object.entries(totals)
                .map(([date, amount]) => ({ date, amount }))
                .sort((a,b) => {
                    if (view === 'quarterly') {
                        const [yearA, quarterA] = a.date.split('-Q');
                        const [yearB, quarterB] = b.date.split('-Q');
                        if (yearA !== yearB) return Number(yearA) - Number(yearB);
                        return Number(quarterA) - Number(quarterB);
                    }
                    if (view === 'yearly') return Number(a.date) - Number(b.date);
                    return new Date(a.date).getTime() - new Date(b.date).getTime();
                });
        };

        if (!date?.from || !date?.to) {
          return { expenseTrendData: [], previousExpenseTrendData: [] };
        }

        const trendData = getAggregatedData(filteredExpenses, chartView);
        
        const { from: prevFrom, to: prevTo } = (() => {
            const duration = date.to.getTime() - date.from.getTime();
            const to = new Date(date.from.getTime() - 1);
            const from = new Date(to.getTime() - duration);
            return { from, to };
        })();
        
        const previousPeriodExpenses = expenses.filter(expense => {
            const expenseDate = new Date(expense.date.replace(/-/g, '/'));
            return expenseDate >= prevFrom && expenseDate <= prevTo;
        });

        const prevTrendData = getAggregatedData(previousPeriodExpenses, chartView);

        return { expenseTrendData: trendData, previousExpenseTrendData: prevTrendData };

  }, [date, expenses, filteredExpenses, chartView]);

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center">
        <h1 className="font-headline text-lg font-semibold md:text-2xl">
          Expenses
        </h1>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {expenseCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
            </SelectContent>
          </Select>
          <DateFilter date={date} setDate={setDate} />
          
          <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">Manage Categories</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Manage Expense Categories</DialogTitle>
                    <DialogDescription>
                        Add, edit, or delete expense categories to suit your business needs.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddCategory} className="space-y-4 pt-4">
                    <div className="flex items-center gap-2">
                        <Input 
                            value={newCategory} 
                            onChange={(e) => setNewCategory(e.target.value)}
                            placeholder="New category name"
                            disabled={!!editingCategory}
                        />
                        <Button type="submit" disabled={!!editingCategory}>Add</Button>
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
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    handleUpdateCategory();
                                                }
                                                if (e.key === 'Escape') setEditingCategory(null);
                                            }}
                                        />
                                        <Button size="sm" onClick={handleUpdateCategory} className="h-8">Save</Button>
                                        <Button size="sm" variant="ghost" onClick={() => setEditingCategory(null)} className="h-8">Cancel</Button>
                                    </div>
                                ) : (
                                    <>
                                        <span className="text-sm">{cat}</span>
                                        <div className="flex items-center opacity-0 transition-opacity group-hover:opacity-100">
                                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => {
                                                setNewCategory(""); 
                                                setEditingCategory({ oldName: cat, newName: cat });
                                            }}>
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

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button onClick={() => handleOpenDialog()}>Add New Expense</Button>
            </DialogTrigger>
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
                            <Button type="submit">{editingExpense ? 'Save Changes' : 'Add Expense'}</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <div className="grid gap-4">
        <ExpensesKpiCards
            totalExpenses={totalExpenses}
            totalExpensesChange={totalExpensesChange}
            avgDailyBurn={avgDailyBurn}
            avgDailyBurnChange={avgDailyBurnChange}
            previousPeriodDescription={previousPeriodDescription}
            topSpendingCategory={topSpendingCategory}
            largestSingleExpense={largestSingleExpense}
            momExpenseGrowth={momExpenseGrowth}
            totalRecurringCost={totalRecurringCost}
            fixedCostRatio={fixedCostRatio}
        />

        <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
            <ExpenseTrendChart
                data={expenseTrendData}
                previousData={previousExpenseTrendData}
                showComparison={showComparison}
                onShowComparisonChange={setShowComparison}
                chartView={chartView}
                onChartViewChange={setChartView}
                chartType={chartType}
                onChartTypeChange={setChartType}
            />
        </Suspense>

        <ExpensesTable
            expenses={filteredExpenses}
            onEdit={handleOpenDialog}
            onDelete={setDeletingExpense}
        />

        <div className="grid gap-4 md:grid-cols-1">
            <div className="grid gap-4 md:grid-cols-1">
            <Suspense fallback={<div className="h-[300px] w-full"><Skeleton className="h-full w-full" /></div>}>
                {filteredExpenses.length > 0 ? (
                    <ExpenseChart data={expensesByCategory} />
                ) : (
                    <div className="flex h-[300px] w-full items-center justify-center">
                        <p className="text-muted-foreground">No expense data to display chart.</p>
                    </div>
                )}
            </Suspense>
            </div>
        </div>
      </div>
       <AlertDialog open={!!deletingExpense} onOpenChange={(open) => !open && setDeletingExpense(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the expense "{deletingExpense?.type}".
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingExpense(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteExpense} className={buttonVariants({ variant: "destructive" })}>
                Delete
            </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={!!deletingCategory} onOpenChange={(open) => !open && setDeletingCategory(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this category?</AlertDialogTitle>
            <AlertDialogDescription>
                This will permanently delete the category "{deletingCategory}". This action cannot be undone if the category is not in use.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingCategory(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCategory} className={buttonVariants({ variant: "destructive" })}>
                Delete
            </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
