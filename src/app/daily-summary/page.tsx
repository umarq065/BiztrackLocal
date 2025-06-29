"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardFooter,
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface DailySummary {
  id: number;
  date: string; // "yyyy-MM-dd"
  content: string;
}

const initialSummaries: DailySummary[] = [
    { id: 1, date: "2024-05-25", content: "Great progress today. Closed two new clients and finished the design for Project X. Need to follow up with the marketing team tomorrow about the new campaign." },
    { id: 2, date: "2024-05-24", content: "Team meeting was productive. Outlined the goals for Q3. Spent the afternoon on bug fixes for the main app. Client Y is happy with the latest delivery." },
    { id: 3, date: "2024-05-23", content: "Onboarded a new developer. Most of the day was spent on code reviews and planning the next sprint. Quiet day otherwise." },
];

const summaryFormSchema = z.object({
  date: z.date({ required_error: "A date is required." }),
  content: z.string().min(10, { message: "Summary must be at least 10 characters." }),
});

type SummaryFormValues = z.infer<typeof summaryFormSchema>;

// Helper function to format a Date object to a 'yyyy-MM-dd' string consistently
const toYyyyMmDd = (date: Date): string => {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().split('T')[0];
};

// Helper function to parse a 'yyyy-MM-dd' string into a local Date object safely
const fromYyyyMmDd = (dateString: string): Date => {
  const [year, month, day] = dateString.split('-').map(Number);
  // Creates a date in the local timezone
  return new Date(year, month - 1, day);
};

export default function DailySummaryPage() {
  const [summaries, setSummaries] = useState<DailySummary[]>(initialSummaries);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSummary, setEditingSummary] = useState<DailySummary | null>(null);
  const [deletingSummary, setDeletingSummary] = useState<DailySummary | null>(null);
  const { toast } = useToast();

  const form = useForm<SummaryFormValues>({
    resolver: zodResolver(summaryFormSchema),
  });

  const handleOpenDialog = (summary: DailySummary | null = null) => {
    if (summary) {
      setEditingSummary(summary);
      form.reset({
        date: fromYyyyMmDd(summary.date),
        content: summary.content,
      });
    } else {
      setEditingSummary(null);
      form.reset({
        date: new Date(),
        content: "",
      });
    }
    setDialogOpen(true);
  };

  const onSubmit = (values: SummaryFormValues) => {
    const formattedDate = toYyyyMmDd(values.date);
    const existingSummaryForDate = summaries.find(s => s.date === formattedDate && s.id !== editingSummary?.id);
    
    if (existingSummaryForDate) {
        toast({
            variant: "destructive",
            title: "Error",
            description: `A summary for ${format(values.date, "PPP")} already exists. Please edit the existing one.`,
        });
        return;
    }

    const newSummary: DailySummary = {
      id: editingSummary ? editingSummary.id : Date.now(),
      date: formattedDate,
      content: values.content,
    };

    if (editingSummary) {
      setSummaries(summaries.map(s => s.id === editingSummary.id ? newSummary : s).sort((a,b) => fromYyyyMmDd(b.date).getTime() - fromYyyyMmDd(a.date).getTime()));
      toast({ title: "Summary Updated" });
    } else {
      const updatedSummaries = [...summaries, newSummary];
      updatedSummaries.sort((a,b) => fromYyyyMmDd(b.date).getTime() - fromYyyyMmDd(a.date).getTime());
      setSummaries(updatedSummaries);
      toast({ title: "Summary Added" });
    }

    setDialogOpen(false);
    setEditingSummary(null);
  };
  
  const handleDelete = () => {
    if (!deletingSummary) return;
    setSummaries(summaries.filter(s => s.id !== deletingSummary.id));
    toast({ title: "Summary Deleted" });
    setDeletingSummary(null);
  }

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center">
        <h1 className="font-headline text-lg font-semibold md:text-2xl">
          Daily Summary
        </h1>
        <div className="ml-auto">
          <Button onClick={() => handleOpenDialog()}>Add New Summary</Button>
        </div>
      </div>
      
      <div className="grid gap-6">
        {summaries.length > 0 ? (
            summaries.map(summary => (
                <Card key={summary.id}>
                    <CardHeader>
                        <CardTitle>{format(fromYyyyMmDd(summary.date), 'PPPP')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground whitespace-pre-line">{summary.content}</p>
                    </CardContent>
                    <CardFooter className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => handleOpenDialog(summary)}>Edit</Button>
                        <Button variant="destructive" onClick={() => setDeletingSummary(summary)}>Delete</Button>
                    </CardFooter>
                </Card>
            ))
        ) : (
            <Card>
                <CardContent className="p-6 text-center">
                    <p className="text-muted-foreground">No summaries yet. Add one to get started!</p>
                </CardContent>
            </Card>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSummary ? 'Edit Summary' : 'Add New Summary'}</DialogTitle>
            <DialogDescription>
              {editingSummary ? 'Update your summary for the selected date.' : 'Log your progress for a specific day.'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                            disabled={!!editingSummary}
                          >
                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Summary</FormLabel>
                    <FormControl>
                      <Textarea placeholder="What did you accomplish today?" className="min-h-[120px]" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="secondary">Cancel</Button>
                </DialogClose>
                <Button type="submit">{editingSummary ? 'Save Changes' : 'Save Summary'}</Button>
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
                    This will permanently delete the summary for {deletingSummary && format(fromYyyyMmDd(deletingSummary.date), 'PPP')}.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className={cn(buttonVariants({ variant: "destructive" }))}>Delete</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
