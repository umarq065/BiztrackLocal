
"use client";

import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import { CalendarIcon, MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
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
    Form,
    FormControl,
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
import ExpenseChart from "@/components/expenses/expense-chart";

const expenseFormSchema = z.object({
  date: z.date({ required_error: "An expense date is required." }),
  type: z.string().min(2, { message: "Type must be at least 2 characters." }),
  amount: z.coerce.number().positive({ message: "Amount must be positive." }),
  category: z.string().min(1, { message: "Please select a category." }),
});

type ExpenseFormValues = z.infer<typeof expenseFormSchema>;

interface Expense {
    id: string;
    date: string;
    type: string;
    amount: number;
    category: string;
}

const initialExpenses: Expense[] = [
    { id: "1", date: "2024-05-01", type: "Figma Subscription", amount: 49.99, category: "Software" },
    { id: "2", date: "2024-05-05", type: "New Monitors", amount: 125.50, category: "Office Supplies" },
    { id: "3", date: "2024-05-10", type: "Google Ads", amount: 500.00, category: "Marketing" },
    { id: "4", date: "2024-05-15", type: "Vercel Hosting", amount: 75.00, category: "Cloud Hosting" },
    { id: "5", date: "2024-05-20", type: "Contractor John", amount: 1200.00, category: "Freelancer Payment" },
    { id: "6", date: "2024-04-15", type: "Stationery", amount: 80.00, category: "Office Supplies" },
    { id: "7", date: "2024-04-25", type: "Flight to Conference", amount: 350.00, category: "Travel" },
    { id: "8", date: "2023-12-20", type: "Contractor Jane", amount: 1500.00, category: "Freelancer Payment" },
    { id: "9", date: "2023-12-05", type: "AWS Bill", amount: 75.00, category: "Cloud Hosting" },
    { id: "10", date: "2022-01-10", type: "Adobe Creative Cloud", amount: 49.99, category: "Software" },
];


export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [open, setOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const { toast } = useToast();
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date(),
  });
  const [filterCategory, setFilterCategory] = useState('all');

  const [expenseCategories, setExpenseCategories] = useState([
    "Software", 
    "Subscription",
    "Office Supplies", 
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
    },
  });

  function onSubmit(values: ExpenseFormValues) {
    const newExpense: Expense = {
        id: `exp-${Date.now()}`,
        date: format(values.date, "yyyy-MM-dd"),
        type: values.type,
        amount: values.amount,
        category: values.category,
    };
    setExpenses([newExpense, ...expenses]);
    toast({
        title: "Expense Added",
        description: `${values.type} has been added to your expenses.`,
    });
    form.reset();
    setOpen(false);
  }

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
      const expenseDate = new Date(expense.date);
      
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
    });
  }, [date, expenses, filterCategory]);

  const totalExpenses = filteredExpenses.reduce((acc, curr) => acc + curr.amount, 0);

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
                <Button>Add New Expense</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add New Expense</DialogTitle>
                    <DialogDescription>
                        Fill in the details below to add a new expense.
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
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button type="button" variant="secondary">Cancel</Button>
                            </DialogClose>
                            <Button type="submit">Add Expense</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <div className="grid gap-4">
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
                        <TableCell>{new Date(expense.date).toLocaleDateString()}</TableCell>
                        <TableCell className="font-medium">{expense.type}</TableCell>
                        <TableCell>{expense.category}</TableCell>
                        <TableCell className="text-right">${expense.amount.toFixed(2)}</TableCell>
                        <TableCell>
                            <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button aria-haspopup="true" size="icon" variant="ghost">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Toggle menu</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem>Edit</DropdownMenuItem>
                                <DropdownMenuItem>Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                        </TableRow>
                    ))
                ) : (
                    <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">No expenses found for the selected period.</TableCell>
                    </TableRow>
                )}
                </TableBody>
            </Table>
            </CardContent>
        </Card>
        <div className="grid gap-4 md:grid-cols-3">
            <Card>
                <CardHeader>
                    <CardTitle>Total Expenses</CardTitle>
                    <CardDescription>Total for the selected period.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-4xl font-bold">${totalExpenses.toFixed(2)}</p>
                </CardContent>
            </Card>
            <Card className="md:col-span-2">
                <CardHeader>
                    <CardTitle>Expenses by Category</CardTitle>
                    <CardDescription>A breakdown of your expenses for the selected period.</CardDescription>
                </CardHeader>
                <CardContent>
                  {filteredExpenses.length > 0 ? (
                    <ExpenseChart data={expensesByCategory} />
                  ) : (
                    <div className="flex h-[300px] w-full items-center justify-center">
                        <p className="text-muted-foreground">No expense data to display chart.</p>
                    </div>
                  )}
                </CardContent>
            </Card>
        </div>
      </div>
    </main>
  );
}
