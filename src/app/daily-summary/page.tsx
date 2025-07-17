
"use client";

import { useState, useMemo, useEffect, lazy, Suspense, memo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, addMonths, subMonths } from "date-fns";
import { ChevronLeft, ChevronRight, CalendarIcon } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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

const parseDateString = (dateString: string): Date => {
  const [year, month, day] = dateString.split('-').map(Number);
  // In JavaScript's Date, months are 0-indexed (0 for January, 11 for December)
  return new Date(Date.UTC(year, month - 1, day));
};

const initialSummariesData: { id: number; date: string; content: string }[] = [
    { id: 1, date: "2024-05-20", content: "Finalized Q3 marketing plan. Key focus on social media engagement and influencer outreach." },
    { id: 2, date: "2024-05-18", content: "Client 'Innovate Web' project milestone 2 completed ahead of schedule. Team did a great job." },
    { id: 3, date: "2024-05-15", content: "Team meeting to discuss performance. Need to improve our lead conversion rate for consulting services." },
];

const summaryFormSchema = z.object({
  content: z.string().min(3, { message: "Summary must be at least 3 characters." }),
});

type SummaryFormValues = z.infer<typeof summaryFormSchema>;

const DailySummaryPageComponent = () => {
  const [summaries, setSummaries] = useState<DailySummary[]>(() =>
    initialSummariesData.map(summary => ({
      ...summary,
      date: parseDateString(summary.date),
    }))
  );
  const [currentDate, setCurrentDate] = useState(new Date("2024-05-01T12:00:00Z"));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [editingSummary, setEditingSummary] = useState<DailySummary | null>(null);
  const [deletingSummary, setDeletingSummary] = useState<DailySummary | null>(null);
  const [visibleSummariesCount, setVisibleSummariesCount] = useState(10);
  const { toast } = useToast();

  useEffect(() => {
    // Set to the user's current date on the client after initial render
    setCurrentDate(new Date());
  }, []);

  const form = useForm<SummaryFormValues>({
    resolver: zodResolver(summaryFormSchema),
    defaultValues: { content: "" }
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
    const dateForPayload = editingSummary ? editingSummary.date : selectedDate;
    if (!dateForPayload) {
        toast({ variant: 'destructive', title: "Error", description: "No date selected."});
        return;
    }

    if (editingSummary) {
      const updatedSummary = { ...editingSummary, content: values.content };
      setSummaries(summaries.map(s => s.id === editingSummary.id ? updatedSummary : s));
      toast({ title: "Summary Updated" });
    } else {
      const newSummary: DailySummary = {
        id: Date.now(),
        date: dateForPayload,
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
           {sortedSummaries.length === 0 && (
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
