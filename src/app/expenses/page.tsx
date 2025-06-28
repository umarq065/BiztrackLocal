
"use client";

import { useState, useMemo, useEffect, lazy, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, getQuarter, getYear, startOfWeek } from "date-fns";
import type { DateRange } from "react-day-picker";
import { CalendarIcon, MoreHorizontal, ArrowUp, ArrowDown } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import StatCard from "@/components/dashboard/stat-card";
import { Switch } from "@/components/ui/switch";

const ExpenseChart = lazy(() => import("@/components/expenses/expense-chart"));
const ExpenseTrendChart = lazy(() => import("@/components/expenses/expense-trend-chart"));


const expenseFormSchema = z.object({
  date: z.date({ required_error: "An expense date is required." }),
  type: z.string().min(2, { message: "Type must be at least 2 characters." }),
  amount: z.coerce.number().positive({ message: "Amount must be positive." }),
  category: z.string().min(1, { message: "Please select a category." }),
  recurring: z.boolean().default(false),
});

type ExpenseFormValues = z.infer<typeof expenseFormSchema>;

interface Expense {
    id: string;
    date: string;
    type: string;
    amount: number;
    category: string;
    recurring?: boolean;
}

const initialExpenses: Expense[] = [
  // May 2024
  { id: "1", date: "2024-05-01", type: "Figma Subscription", amount: 49.99, category: "Software", recurring: true },
  { id: "2", date: "2024-05-05", type: "New Monitors", amount: 599.00, category: "Hardware" },
  { id: "3", date: "2024-05-10", type: "Google Ads", amount: 500.00, category: "Marketing" },
  { id: "4", date: "2024-05-15", type: "Vercel Hosting", amount: 75.00, category: "Cloud Hosting", recurring: true },
  { id: "5", date: "2024-05-20", type: "Contractor John", amount: 1200.00, category: "Freelancer Payment" },
  { id: "11", date: "2024-05-25", type: "Lunch with client", amount: 85.00, category: "Travel" },
  { id: "12", date: "2024-05-28", type: "Stock Photos", amount: 99.00, category: "Software" },

  // April 2024
  { id: "6", date: "2024-04-15", type: "Stationery", amount: 80.00, category: "Office Supplies" },
  { id: "7", date: "2024-04-25", type: "Flight to Conference", amount: 350.00, category: "Travel" },
  { id: "13", date: "2024-04-01", type: "Figma Subscription", amount: 49.99, category: "Software", recurring: true },
  { id: "14", date: "2024-04-10", type: "LinkedIn Ads", amount: 450.00, category: "Marketing" },
  { id: "15", date: "2024-04-20", type: "Contractor Sarah", amount: 1100.00, category: "Freelancer Payment" },
  { id: "16", date: "2024-04-28", type: "New Keyboard", amount: 150.00, category: "Hardware" },
  { id: "21", date: "2024-04-15", type: "Vercel Hosting", amount: 75.00, category: "Cloud Hosting", recurring: true },

  // March 2024
  { id: "17", date: "2024-03-01", type: "Figma Subscription", amount: 49.99, category: "Software", recurring: true },
  { id: "18", date: "2024-03-12", type: "Webinar Software", amount: 200.00, category: "Software", recurring: true },
  { id: "19", date: "2024-03-18", type: "Facebook Ads", amount: 300.00, category: "Marketing" },
  { id: "20", date: "2024-03-25", type: "Contractor Mike", amount: 950.00, category: "Freelancer Payment" },
  { id: "22", date: "2024-03-15", type: "Vercel Hosting", amount: 75.00, category: "Cloud Hosting", recurring: true },
  
  // Old data
  { id: "8", date: "2023-12-20", type: "Contractor Jane", amount: 1500.00, category: "Freelancer Payment" },
  { id: "9", date: "2023-12-05", type: "AWS Bill", amount: 75.00, category: "Cloud Hosting", recurring: true },
  { id: "10", date: "2022-01-10", type: "Adobe Creative Cloud", amount: 49.99, category: "Software", recurring: true },
];


export default function ExpensesPage() {
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
    // Current period calculations
    const currentTotal = filteredExpenses.reduce((acc, curr) => acc + curr.amount, 0);
    let currentDays = 0;
    if (date?.from && date?.to) {
      currentDays = (date.to.getTime() - date.from.getTime()) / (1000 * 60 * 60 * 24) + 1;
    }
    const currentAvgBurn = currentDays > 0 ? currentTotal / currentDays : 0;

    // Previous period calculations
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
    
    // Top Spending Category
    const categoryTotals = filteredExpenses.reduce((acc, expense) => {
        acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
        return acc;
    }, {} as Record<string, number>);

    let topSpendingCategory = { name: "N/A", amount: 0 };
    if (Object.keys(categoryTotals).length > 0) {
        const topCategoryName = Object.keys(categoryTotals).reduce((a, b) => categoryTotals[a] > categoryTotals[b] ? a : b);
        topSpendingCategory = { name: topCategoryName, amount: categoryTotals[topCategoryName] };
    }

    // Largest Single Expense
    let largestSingleExpense = { type: 'N/A', amount: 0 };
    if (filteredExpenses.length > 0) {
        const largest = filteredExpenses.reduce((max, expense) => expense.amount > max.amount ? expense : max, filteredExpenses[0]);
        largestSingleExpense = { type: largest.type, amount: largest.amount };
    }
    
    // Period-over-Period Expense Growth (was MoM)
    const momExpenseGrowth = totalExpensesChange;
    
    // Recurring Costs
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
                        Add new expense categories to suit your business needs.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddCategory} className="space-y-4 pt-4">
                    <div className="flex items-center gap-2">
                        <Input 
                            value={newCategory} 
                            onChange={(e) => setNewCategory(e.target.value)}
                            placeholder="New category name"
                        />
                        <Button type="submit">Add</Button>
                    </div>
                </form>
                <div className="space-y-2">
                    <p className="text-sm font-medium">Existing Categories:</p>
                    <div className="flex flex-wrap gap-2">
                        {expenseCategories.map(cat => (
                            <Badge key={cat} variant="secondary">{cat}</Badge>
                        ))}
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="secondary">Close</Button>
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
        <div className="grid gap-4 md:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>Total Expenses</CardTitle>
                    <CardDescription>Total for the selected period.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-4xl font-bold">${totalExpenses.toFixed(2)}</p>
                    {totalExpensesChange && (
                        <div className="text-xs text-muted-foreground mt-1 flex items-center">
                            <span className={cn(
                                "flex items-center gap-1 font-medium",
                                totalExpensesChange.type === 'increase' ? 'text-red-600' : 'text-green-600'
                            )}>
                                {totalExpensesChange.type === 'increase' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                                {totalExpensesChange.value}%
                            </span>
                            <span className="ml-1">{previousPeriodDescription}</span>
                        </div>
                    )}
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Avg. Daily Burn</CardTitle>
                    <CardDescription>Average daily cost to run the business.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-4xl font-bold">${avgDailyBurn.toFixed(2)}</p>
                    {avgDailyBurnChange && (
                        <div className="text-xs text-muted-foreground mt-1 flex items-center">
                            <span className={cn(
                                "flex items-center gap-1 font-medium",
                                avgDailyBurnChange.type === 'increase' ? 'text-red-600' : 'text-green-600'
                            )}>
                                {avgDailyBurnChange.type === 'increase' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                                {avgDailyBurnChange.value}%
                            </span>
                            <span className="ml-1">{previousPeriodDescription}</span>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>

        <h2 className="text-xl font-semibold mb-[-8px] mt-4">Expense Analysis</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <StatCard
                icon="BarChart"
                title="Top Spending Category"
                value={topSpendingCategory.name}
                description={`$${topSpendingCategory.amount.toFixed(2)} of total`}
            />
             <StatCard
                icon="CreditCard"
                title="Largest Single Expense"
                value={`$${largestSingleExpense.amount.toFixed(2)}`}
                description={`(${largestSingleExpense.type})`}
            />
            <StatCard
                icon="TrendingUp"
                title="Period-over-Period Growth"
                value={momExpenseGrowth ? (
                    <div className={cn("flex items-center", momExpenseGrowth.type === 'increase' ? 'text-red-600' : 'text-green-600')}>
                        {momExpenseGrowth.type === 'increase' ? <ArrowUp className="h-6 w-6 mr-1" /> : <ArrowDown className="h-6 w-6 mr-1" />}
                        <span>{momExpenseGrowth.value}%</span>
                    </div>
                ) : 'N/A'}
                description={previousPeriodDescription}
                invertChangeColor
            />
            <StatCard
                icon="Repeat"
                title="Total Recurring Costs"
                value={`$${totalRecurringCost.toFixed(2)} / month`}
                description="Based on current month's recurring expenses"
            />
            <StatCard
                icon="Percent"
                title="Fixed Cost Ratio"
                value={fixedCostRatio.value}
                description="of total spending in period is recurring"
            />
        </div>

        <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
            <ExpenseTrendChart
                data={expenseTrendData}
                previousData={previousExpenseTrendData}
                showComparison={showComparison}
                onShowComparisonChange={setShowComparison}
                chartView={chartView}
                onChartViewChange={setChartView}
            />
        </Suspense>

        <Card>
            <CardHeader>
            <CardTitle>Manage Expenses</CardTitle>
            <CardDescription>
                Track and manage all your business expenses.
            </CardDescription>
            </CardHeader>
            <CardContent>
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Recurring</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>
                    <span className="sr-only">Actions</span>
                    </TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {filteredExpenses.length > 0 ? (
                    filteredExpenses.map((expense) => (
                        <TableRow key={expense.id}>
                        <TableCell>{format(new Date(expense.date.replace(/-/g, '/')), "PPP")}</TableCell>
                        <TableCell className="font-medium">{expense.type}</TableCell>
                        <TableCell>{expense.category}</TableCell>
                        <TableCell>{expense.recurring ? 'Yes' : 'No'}</TableCell>
                        <TableCell className="text-right">${expense.amount.toFixed(2)}</TableCell>
                        <TableCell className="text-right">
                            <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button aria-haspopup="true" size="icon" variant="ghost">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Toggle menu</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => handleOpenDialog(expense)}>Edit</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setDeletingExpense(expense)} className="text-destructive">Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                        </TableRow>
                    ))
                ) : (
                    <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">No expenses found for the selected period.</TableCell>
                    </TableRow>
                )}
                </TableBody>
            </Table>
            </CardContent>
        </Card>
        <div className="grid gap-4 md:grid-cols-1">
            <Card>
                <CardHeader>
                    <CardTitle>Expenses by Category</CardTitle>
                    <CardDescription>A breakdown of your expenses for the selected period.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Suspense fallback={<div className="h-[300px] w-full"><Skeleton className="h-full w-full" /></div>}>
                    {filteredExpenses.length > 0 ? (
                      <ExpenseChart data={expensesByCategory} />
                    ) : (
                      <div className="flex h-[300px] w-full items-center justify-center">
                          <p className="text-muted-foreground">No expense data to display chart.</p>
                      </div>
                    )}
                  </Suspense>
                </CardContent>
            </Card>
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
    </main>
  );
}
