
"use client";

import { useState, useMemo, useEffect, lazy, Suspense, memo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, addMonths, subMonths } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { ChevronLeft, ChevronRight, Loader2, Database } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { summaryFormSchema, type DailySummary, type SummaryFormValues } from "@/lib/data/daily-summary-data";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const CalendarView = lazy(() => import("@/components/daily-summary/calendar-view"));

const DailySummaryPageComponent = () => {
  const [summaries, setSummaries] = useState<DailySummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [editingSummary, setEditingSummary] = useState<DailySummary | null>(null);
  const [deletingSummary, setDeletingSummary] = useState<DailySummary | null>(null);
  const [visibleSummariesCount, setVisibleSummariesCount] = useState(10);
  const [timezone, setTimezone] = useState('UTC');
  const { toast } = useToast();
  
  const form = useForm<SummaryFormValues>({
    resolver: zodResolver(summaryFormSchema),
    defaultValues: { content: "" }
  });

  useEffect(() => {
    const fetchInitialData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const [summariesRes, settingsRes] = await Promise.all([
                fetch('/api/daily-summaries'),
                fetch('/api/settings')
            ]);
            
            if (!summariesRes.ok) throw new Error('Failed to fetch summaries.');
            if (!settingsRes.ok) throw new Error('Failed to fetch settings.');
            
            const summariesData = await summariesRes.json();
            const settingsData = await settingsRes.json();

            setTimezone(settingsData.timezone || 'UTC');
            setSummaries(summariesData.map((s: DailySummary & {date: string}) => ({...s, date: new Date(s.date.replace(/-/g, '/'))})));
            
        } catch (e) {
            console.error(e);
            setError('Could not connect to the database or fetch data. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };
    fetchInitialData();
  }, []);

  const handleDateClick = (date: Date) => {
    setEditingSummary(null);
    setSelectedDate(date);
    form.reset({ content: "" });
    setDialogOpen(true);
  };
  
  const handleSummaryClick = (summary: DailySummary) => {
    setEditingSummary(summary);
    setSelectedDate(null); // Clear selected date when editing
    form.reset({ content: summary.content });
    setDialogOpen(true);
  }

  const onSubmit = async (values: SummaryFormValues) => {
    setIsSubmitting(true);
    try {
        let response;
        if (editingSummary) {
            // UPDATE
            response = await fetch(`/api/daily-summaries/${editingSummary.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(values),
            });
        } else {
            // CREATE
            const dateForPayload = selectedDate;
            if (!dateForPayload) throw new Error("No date selected for new summary.");
            
            // Use the fetched timezone
            const zonedDate = toZonedTime(dateForPayload, timezone);

            const payload = {
                ...values,
                date: format(zonedDate, 'yyyy-MM-dd')
            };
            response = await fetch('/api/daily-summaries', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
        }

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'An unexpected error occurred.');
        }
        
        const savedSummary = await response.json();
        savedSummary.date = new Date(savedSummary.date.replace(/-/g, '/'));

        if (editingSummary) {
            setSummaries(summaries.map(s => s.id === savedSummary.id ? savedSummary : s));
            toast({ title: "Summary Updated" });
        } else {
            setSummaries(prev => [...prev, savedSummary]);
            toast({ title: "Summary Added" });
        }
        
        setDialogOpen(false);
    } catch (err: any) {
        toast({ variant: 'destructive', title: "Error", description: err.message });
    } finally {
        setIsSubmitting(false);
    }
  };
  
  const handleDelete = async () => {
    if (!deletingSummary) return;
    setIsSubmitting(true);
    try {
        const response = await fetch(`/api/daily-summaries/${deletingSummary.id}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to delete summary.');
        }
        setSummaries(summaries.filter(s => s.id !== deletingSummary.id));
        toast({ title: "Summary Deleted" });
        if(editingSummary?.id === deletingSummary.id) setEditingSummary(null);
    } catch (err: any) {
        toast({ variant: 'destructive', title: "Error", description: err.message });
    } finally {
        setIsSubmitting(false);
        setDeletingSummary(null);
        setDialogOpen(false);
    }
  }

  const handlePrevMonth = () => {
    setCurrentDate(prev => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => addMonths(prev, 1));
  };
  
  const handleToday = () => {
    setCurrentDate(new Date());
  }

  const dialogTitle = useMemo(() => {
    const dateForTitle = editingSummary?.date || selectedDate;
    if (dateForTitle) {
      return `${editingSummary ? 'Edit' : 'Add'} Summary for ${format(dateForTitle, 'PPP')}`;
    }
    return "Summary";
  }, [editingSummary, selectedDate]);

  const sortedSummaries = useMemo(() => {
    return [...summaries].sort((a, b) => (b.date as Date).getTime() - (a.date as Date).getTime());
  }, [summaries]);

  return (
    <div className="flex h-full flex-col">
      <header className="flex flex-col items-center justify-between gap-4 border-b px-4 py-3 sm:flex-row">
        <div className="flex items-center gap-4">
            <h1 className="font-headline text-xl font-semibold md:text-2xl">
                Daily Summary
            </h1>
            <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={handlePrevMonth} aria-label="Previous month">
                    <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" onClick={handleNextMonth} aria-label="Next month">
                    <ChevronRight className="h-5 w-5" />
                </Button>
            </div>
            <h2 className="text-xl font-semibold">{format(currentDate, "MMMM yyyy")}</h2>
        </div>
        <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleToday}>Today</Button>
        </div>
      </header>
      
      {error && (
        <div className="p-4">
            <Alert variant="destructive">
                <Database className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        </div>
      )}
      
      <div className="flex-1 overflow-y-auto">
        <main>
          <Suspense fallback={<Skeleton className="h-[500px] w-full" />}>
            {isLoading ? <Skeleton className="h-[500px] w-full" /> : (
              <CalendarView 
                  currentDate={currentDate}
                  summaries={summaries}
                  onDateClick={handleDateClick}
                  onSummaryClick={handleSummaryClick}
                  timezone={timezone}
              />
            )}
          </Suspense>
        </main>
        <section className="px-4 py-8 md:px-8">
          <h2 className="text-2xl font-semibold mb-4">Recent Summaries</h2>
          <div className="space-y-4">
            {sortedSummaries.slice(0, visibleSummariesCount).map((summary) => (
              <Card key={summary.id}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-base font-medium">{format(summary.date, 'PPP')}</CardTitle>
                  <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleSummaryClick(summary)}>Edit</Button>
                      <Button variant="destructive" size="sm" onClick={() => setDeletingSummary(summary)}>Delete</Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{summary.content}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          {sortedSummaries.length > visibleSummariesCount && (
            <div className="mt-6 flex justify-center">
              <Button onClick={() => setVisibleSummariesCount(prev => prev + 10)}>
                Load More
              </Button>
            </div>
          )}
           {sortedSummaries.length === 0 && !isLoading && (
              <div className="py-12 text-center text-muted-foreground">No summaries found. Click on a date in the calendar to add one.</div>
            )}
        </section>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea placeholder="Write your summary here..." className="min-h-[120px]" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="sm:justify-between">
                <div>
                  {editingSummary && (
                    <Button type="button" variant="destructive" onClick={() => {
                        setDeletingSummary(editingSummary)
                    }}>
                        Delete
                    </Button>
                  )}
                </div>
                <div className="flex gap-2">
                    <DialogClose asChild>
                        <Button type="button" variant="secondary">Cancel</Button>
                    </DialogClose>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {editingSummary ? 'Save Changes' : 'Save Summary'}
                    </Button>
                </div>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={!!deletingSummary} onOpenChange={(open) => {if (!open) setDeletingSummary(null)}}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This will permanently delete this summary.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setDeletingSummary(null)} disabled={isSubmitting}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} disabled={isSubmitting} className={cn(buttonVariants({ variant: "destructive" }))}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Delete
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

const MemoizedDailySummaryPage = memo(DailySummaryPageComponent);

export default function DailySummaryPage() {
  return <MemoizedDailySummaryPage />;
}
