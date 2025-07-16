
"use client";

import { useState, memo, useEffect, lazy, Suspense, useMemo } from "react";
import { format, subDays, differenceInDays, startOfWeek, startOfMonth, getQuarter, getYear, parseISO, startOfQuarter, startOfYear } from "date-fns";
import type { DateRange } from "react-day-picker";
import { Loader2, Database } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription as AlertDialogDesc,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/alert-dialog";

import { DateFilter } from "@/components/dashboard/date-filter";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import type { Expense, ExpenseFormValues } from "@/lib/data/expenses-data";
import { ExpensesKpiCards } from "./expenses-kpi-cards";
import { ExpensesTable } from "./expenses-table";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { ManageCategoriesDialog } from "./dialogs/manage-categories-dialog";
import { ExpenseFormDialog } from "./dialogs/expense-form-dialog";

const ExpenseDistributionBarChart = lazy(() => import("@/components/expenses/expense-distribution-bar-chart"));
const ExpenseTrendChart = lazy(() => import("@/components/expenses/expense-trend-chart"));

const MemoizedExpensesDashboard = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);
  
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  
  const [date, setDate] = useState<DateRange | undefined>(undefined);
  
  const [chartView, setChartView] = useState('daily');
  const [chartType, setChartType] = useState('line');
  const [showComparison, setShowComparison] = useState(false);
  const { toast } = useToast();
  
  const fetchData = async () => {
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
    };
  
  useEffect(() => {
    fetchData();
  }, []);

  const handleSetDate = (newDate: DateRange | undefined) => {
    setDate(newDate);
  };
  
  const handleOpenFormDialog = (expense: Expense | null = null) => {
    setEditingExpense(expense);
    setIsFormOpen(true);
  };

  const handleExpenseSaved = (savedExpense: Expense) => {
    if (editingExpense) {
        setExpenses(prev => prev.map(exp => exp.id === savedExpense.id ? savedExpense : exp));
        toast({ title: "Expense Updated" });
    } else {
        setExpenses(prev => [savedExpense, ...prev]);
        toast({ title: "Expense Added" });
    }
  };

  const handleDeleteExpense = async () => {
    if (!deletingExpense) return;
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
        setDeletingExpense(null);
    }
  };

  const { filteredExpenses, previousPeriodExpenses } = useMemo(() => {
    if (!date?.from) {
        return { filteredExpenses: expenses, previousPeriodExpenses: [] };
    }

    const { from, to } = date;
    const toDateEnd = to ? new Date(to) : new Date();
    toDateEnd.setHours(23, 59, 59, 999);

    const filtered = expenses.filter(exp => {
        const expDate = parseISO(exp.date);
        return expDate >= from && expDate <= toDateEnd;
    });
    
    const duration = differenceInDays(to || new Date(), from);
    const prevToDate = subDays(from, 1);
    const prevFromDate = subDays(prevToDate, duration);
    
    const previousFiltered = expenses.filter(exp => {
        const expDate = parseISO(exp.date);
        return expDate >= prevFromDate && expDate <= prevToDate;
    });

    return { filteredExpenses: filtered, previousPeriodExpenses: previousFiltered };
  }, [expenses, date]);
  
  const kpiData = useMemo(() => {
    const totalExpenses = filteredExpenses.reduce((acc, exp) => acc + exp.amount, 0);
    const prevTotalExpenses = previousPeriodExpenses.reduce((acc, exp) => acc + exp.amount, 0);
    const totalExpensesChange = prevTotalExpenses > 0 ? ((totalExpenses - prevTotalExpenses) / prevTotalExpenses) * 100 : (totalExpenses > 0 ? 100 : 0);
    
    let daysInPeriod = 1;
    let previousPeriodDescription = `vs. previous period`;

    if (date?.from && date?.to) {
        daysInPeriod = differenceInDays(date.to, date.from) + 1;
        previousPeriodDescription = `vs. previous ${daysInPeriod} days`;
    } else if (filteredExpenses.length > 0) {
        // Handle "All Time"
        const dates = filteredExpenses.map(e => parseISO(e.date).getTime());
        const firstDate = new Date(Math.min(...dates));
        const lastDate = new Date(Math.max(...dates));
        daysInPeriod = differenceInDays(lastDate, firstDate) + 1;
        previousPeriodDescription = `from ${format(firstDate, "MMM d, yyyy")}`;
    }

    const avgDailyBurn = totalExpenses / (daysInPeriod > 0 ? daysInPeriod : 1);
    const prevDaysInPeriod = date?.from && date?.to ? differenceInDays(subDays(date.from, 1), subDays(subDays(date.from, 1), daysInPeriod - 1)) + 1 : 1;
    const prevAvgDailyBurn = prevTotalExpenses / (prevDaysInPeriod > 0 ? prevDaysInPeriod : 1);
    const avgDailyBurnChange = prevAvgDailyBurn > 0 ? ((avgDailyBurn - prevAvgDailyBurn) / prevAvgDailyBurn) * 100 : (avgDailyBurn > 0 ? 100 : 0);

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
        avgDailyBurnChange: avgDailyBurnChange && date?.from ? { value: avgDailyBurnChange.toFixed(1), type: avgDailyBurnChange >= 0 ? 'increase' : 'decrease' } : null,
        previousPeriodDescription,
        topSpendingCategory: { name: topSpendingCategory[0], amount: topSpendingCategory[1] },
        largestSingleExpense: { type: largestSingleExpense.type, amount: largestSingleExpense.amount },
        momExpenseGrowth: totalExpensesChange ? { value: totalExpensesChange.toFixed(1), type: totalExpensesChange >= 0 ? 'increase' : 'decrease' } : null,
        totalRecurringCost,
        fixedCostRatio: { value: fixedCostRatio.toFixed(1) + '%' }
    };
  }, [filteredExpenses, previousPeriodExpenses, date]);

  const distributionChartData = useMemo(() => {
    const categoryTotals = filteredExpenses.reduce((acc, { category, amount }) => {
        acc[category] = (acc[category] || 0) + amount;
        return acc;
    }, {} as Record<string, number>);

    return Object.entries(categoryTotals)
        .map(([name, amount]) => ({
            name,
            amount,
        }))
        .sort((a, b) => b.amount - a.amount);
  }, [filteredExpenses]);

 const { trendChartData, previousTrendChartData } = useMemo(() => {
    const aggregateData = (data: Expense[], view: string) => {
        const dataMap = new Map<string, number>();

        if (data.length === 0) return [];

        data.forEach(exp => {
            const expDate = parseISO(exp.date);
            let key = '';
            switch(view) {
                case 'weekly':
                    key = format(startOfWeek(expDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');
                    break;
                case 'monthly':
                    key = format(startOfMonth(expDate), 'yyyy-MM-dd');
                    break;
                case 'quarterly':
                    key = format(startOfQuarter(expDate), 'yyyy');
                    break;
                case 'yearly':
                    key = format(startOfYear(expDate), 'yyyy');
                    break;
                default: // daily
                    key = exp.date;
                    break;
            }
            dataMap.set(key, (dataMap.get(key) || 0) + exp.amount);
        });

        return Array.from(dataMap.entries())
            .map(([date, amount]) => ({ date, amount }))
            .sort((a, b) => a.date.localeCompare(b.date));
    };

    return {
        trendChartData: aggregateData(filteredExpenses, chartView),
        previousTrendChartData: aggregateData(previousPeriodExpenses, chartView),
    };
 }, [filteredExpenses, previousPeriodExpenses, chartView]);


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
          <DateFilter date={date} setDate={handleSetDate} />
          <Button variant="outline" onClick={() => setIsCategoryDialogOpen(true)}>Manage Categories</Button>
          <Button onClick={() => handleOpenFormDialog()}>Add New Expense</Button>
        </div>
      </div>
       {error && (
            <Alert variant="destructive">
                <Database className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                    {error}
                </AlertDescription>
            </Alert>
        )}
      <div className="grid grid-cols-1 gap-6">
          <ExpensesKpiCards {...kpiData} />
          
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
            <ExpenseDistributionBarChart data={distributionChartData} />
          </Suspense>
            
          <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
              <ExpensesTable
                  expenses={filteredExpenses}
                  onEdit={handleOpenFormDialog}
                  onDelete={setDeletingExpense}
              />
          </Suspense>
      </div>
      
      <ExpenseFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        editingExpense={editingExpense}
        onExpenseSaved={handleExpenseSaved}
        expenseCategories={expenseCategories}
      />
      
      <ManageCategoriesDialog
        open={isCategoryDialogOpen}
        onOpenChange={setIsCategoryDialogOpen}
        onCategoriesUpdated={fetchData}
      />

      <AlertDialog open={!!deletingExpense} onOpenChange={(open) => !open && setDeletingExpense(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDesc>
                This action cannot be undone. This will permanently delete the expense "{deletingExpense?.type}".
            </AlertDialogDesc>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteExpense} className={buttonVariants({ variant: "destructive" })}>
                Delete
            </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}

export const ExpensesDashboard = memo(MemoizedExpensesDashboard);
