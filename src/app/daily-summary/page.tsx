
"use client";

import { useState, useMemo, useCallback, lazy, Suspense, memo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, addMonths, subMonths, startOfMonth } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";

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

const CalendarView = lazy(() => import("@/components/daily-summary/calendar-view"));

export interface DailySummary {
  id: number;
  date: Date;
  content: string;
}

const initialSummaries: DailySummary[] = [
    { id: 1, date: new Date(2025, 5, 8), content: "Eid al-Adha Holiday" },
    { id: 2, date: new Date(2025, 5, 9), content: "Eid al-Adha Holiday" },
    { id: 3, date: new Date(2025, 5, 12), content: "Client meeting follow-up" },
    { id: 4, date: new Date(2025, 5, 20), content: "Finalize Q3 marketing plan. It needs to be perfect." },
    { id: 5, date: new Date(2025, 5, 20), content: "Review developer applications" },
    { id: 6, date: new Date(2025, 6, 1), content: "Start of Q3. Review goals and set new targets." },
    { id: 7, date: new Date(2025, 6, 4), content: "Independence Day holiday prep." },
    { id: 8, date: new Date(2025, 6, 10), content: "Onboard new freelance writer." },
    { id: 9, date: new Date(2025, 6, 15), content: "Mid-month performance check-in." },
    { id: 10, date: new Date(2025, 6, 22), content: "Plan social media content for August." },
    { id: 11, date: new Date(2025, 6, 28), content: "Finalize invoice for Project X." },
    { id: 12, date: new Date(2025, 4, 18), content: "Prepare for upcoming presentation." },

];

const summaryFormSchema = z.object({
  content: z.string().min(3, { message: "Summary must be at least 3 characters." }),
});

type SummaryFormValues = z.infer<typeof summaryFormSchema>;

const DailySummaryPageComponent = () => {
  const [summaries, setSummaries] = useState<DailySummary[]>(initialSummaries);
  const [currentDate, setCurrentDate] = useState(new Date(2025, 5, 1));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [editingSummary, setEditingSummary] = useState<DailySummary | null>(null);
  const [deletingSummary, setDeletingSummary] = useState<DailySummary | null>(null);
  const [visibleSummariesCount, setVisibleSummariesCount] = useState(10);
  const { toast } = useToast();

  const form = useForm<SummaryFormValues>({
    resolver: zodResolver(summaryFormSchema),
  });

  const handleDateClick = (date: Date) => {
    setEditingSummary(null);
    setSelectedDate(date);
    form.reset({ content: "" });
    setDialogOpen(true);
  };
  
  const handleSummaryClick = (summary: DailySummary) => {
    setEditingSummary(summary);
    setSelectedDate(summary.date);
    form.reset({ content: summary.content });
    setDialogOpen(true);
  }

  const onSubmit = (values: SummaryFormValues) => {
    if (!selectedDate) return;

    if (editingSummary) {
      const updatedSummary = { ...editingSummary, content: values.content };
      setSummaries(summaries.map(s => s.id === editingSummary.id ? updatedSummary : s));
      toast({ title: "Summary Updated" });
    } else {
      const newSummary: DailySummary = {
        id: Date.now(),
        date: selectedDate,
        content: values.content,
      };
      setSummaries([...summaries, newSummary]);
      toast({ title: "Summary Added" });
    }

    setDialogOpen(false);
    setEditingSummary(null);
    setSelectedDate(null);
  };
  
  const handleDelete = () => {
    if (!deletingSummary) return;

    const summaryToDelete = deletingSummary;
    setSummaries(summaries.filter(s => s.id !== summaryToDelete.id));
    toast({ title: "Summary Deleted" });
    setDeletingSummary(null);
    if(editingSummary && editingSummary.id === summaryToDelete.id) {
        setDialogOpen(false);
        setEditingSummary(null);
    }
  }

  const handlePrevMonth = () => {
    setCurrentDate(prev => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => addMonths(prev, 1));
  };
  
  const handleToday = () => {
    setCurrentDate(startOfMonth(new Date()));
  }

  const dialogTitle = useMemo(() => {
    if (editingSummary) return `Edit Summary for ${format(editingSummary.date, 'PPP')}`;
    if (selectedDate) return `Add Summary for ${format(selectedDate, 'PPP')}`;
    return "Summary";
  }, [editingSummary, selectedDate]);

  const sortedSummaries = useMemo(() => {
    return [...summaries].sort((a, b) => b.date.getTime() - a.date.getTime());
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
      
      <div className="flex-1 overflow-y-auto">
        <main>
          <Suspense fallback={<Skeleton className="h-[500px] w-full" />}>
            <CalendarView 
                currentDate={currentDate}
                summaries={summaries}
                onDateClick={handleDateClick}
                onSummaryClick={handleSummaryClick}
            />
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
                    <Button type="submit">{editingSummary ? 'Save Changes' : 'Save Summary'}</Button>
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
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className={cn(buttonVariants({ variant: "destructive" }))}>Delete</AlertDialogAction>
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
