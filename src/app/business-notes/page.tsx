

"use client";

import { useState, useMemo, useEffect, lazy, Suspense, memo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, addMonths, subMonths } from "date-fns";
import { ChevronLeft, ChevronRight, CalendarIcon, Loader2, Database } from "lucide-react";

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
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";
import { type BusinessNote, noteFormSchema, type NoteFormValues } from "@/lib/data/business-notes-data";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


const CalendarView = lazy(() => import("@/components/business-notes/calendar-view"));

const BusinessNotesPageComponent = () => {
  const [notes, setNotes] = useState<BusinessNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [editingNote, setEditingNote] = useState<BusinessNote | null>(null);
  const [deletingNote, setDeletingNote] = useState<BusinessNote | null>(null);
  const [visibleNotesCount, setVisibleNotesCount] = useState(10);
  const { toast } = useToast();
  
  const form = useForm<NoteFormValues>({
    resolver: zodResolver(noteFormSchema),
    defaultValues: {
      date: undefined,
      title: "",
      content: "",
    }
  });

  const fetchNotes = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/business-notes');
      if (!res.ok) throw new Error('Failed to fetch notes from the server.');
      const data = await res.json();
      setNotes(data.map((note: BusinessNote & {date: string}) => ({...note, date: new Date(note.date)})));
    } catch (e) {
      console.error(e);
      setError('Could not connect to the database or fetch data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const handleDateClick = (date: Date) => {
    setEditingNote(null);
    setSelectedDate(date);
    form.reset({ date, title: "", content: "" });
    setDialogOpen(true);
  };
  
  const handleNoteClick = (note: BusinessNote) => {
    setEditingNote(note);
    setSelectedDate(null);
    form.reset({ date: new Date(note.date), title: note.title, content: note.content });
    setDialogOpen(true);
  }

  const handleOpenNewNoteDialog = () => {
    setEditingNote(null);
    setSelectedDate(null);
    form.reset({
      date: new Date(),
      title: "",
      content: "",
    });
    setDialogOpen(true);
  };

  const onSubmit = async (values: NoteFormValues) => {
    setIsSubmitting(true);
    try {
        const payload = { ...values, date: editingNote?.date || selectedDate || values.date };
        const response = editingNote 
            ? await fetch(`/api/business-notes/${editingNote.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
              })
            : await fetch('/api/business-notes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
              });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'An unexpected error occurred.');
        }

        const savedNote = await response.json();
        savedNote.date = new Date(savedNote.date);

        if (editingNote) {
            setNotes(notes.map(n => n.id === editingNote.id ? savedNote : n));
            toast({ title: "Note Updated" });
        } else {
            setNotes([...notes, savedNote]);
            toast({ title: "Note Added" });
        }
        setDialogOpen(false);
    } catch (err: any) {
        toast({ variant: 'destructive', title: "Error", description: err.message });
    } finally {
        setIsSubmitting(false);
    }
  };
  
  const handleDelete = async () => {
    if (!deletingNote) return;
    setIsSubmitting(true);
    try {
        const response = await fetch(`/api/business-notes/${deletingNote.id}`, { method: 'DELETE' });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to delete note.');
        }
        setNotes(notes.filter(s => s.id !== deletingNote.id));
        toast({ title: "Note Deleted" });
        if(editingNote?.id === deletingNote.id) setEditingNote(null);
    } catch (err: any) {
        toast({ variant: 'destructive', title: "Error", description: err.message });
    } finally {
        setIsSubmitting(false);
        setDeletingNote(null);
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
    if (editingNote) return `Edit Note`;
    const dateForTitle = selectedDate || form.getValues('date');
    if (dateForTitle) return `Add Note for ${format(dateForTitle, 'PPP')}`;
    return "Add New Note";
  }, [editingNote, selectedDate, form]);

  const sortedNotes = useMemo(() => {
    return [...notes].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [notes]);

  return (
    <div className="flex h-full flex-col">
      <header className="flex flex-col items-center justify-between gap-4 border-b px-4 py-3 sm:flex-row">
        <div className="flex items-center gap-4">
            <h1 className="font-headline text-xl font-semibold md:text-2xl">
                Business Notes
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
            <Button onClick={handleOpenNewNoteDialog}>Add New Note</Button>
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
                  notes={notes}
                  onDateClick={handleDateClick}
                  onNoteClick={handleNoteClick}
              />
            )}
          </Suspense>
        </main>
        <section className="px-4 py-8 md:px-8">
          <h2 className="text-2xl font-semibold mb-4">Recent Notes</h2>
          <div className="space-y-4">
            {sortedNotes.slice(0, visibleNotesCount).map((note) => (
              <Card key={note.id}>
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                  <div>
                    <CardTitle className="text-base font-medium">{note.title}</CardTitle>
                    <CardDescription>{format(new Date(note.date), 'PPP')}</CardDescription>
                  </div>
                   <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleNoteClick(note)}>Edit</Button>
                      <Button variant="destructive" size="sm" onClick={() => setDeletingNote(note)}>Delete</Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">{note.content}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          {sortedNotes.length > visibleNotesCount && (
            <div className="mt-6 flex justify-center">
              <Button onClick={() => setVisibleNotesCount(prev => prev + 10)}>
                Load More
              </Button>
            </div>
          )}
           {sortedNotes.length === 0 && !isLoading && (
              <div className="py-12 text-center text-muted-foreground">No notes found. Click on a date in the calendar to add one.</div>
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
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
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

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Note Title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Write your note here..." className="min-h-[120px]" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="sm:justify-between">
                <div>
                  {editingNote && (
                    <Button type="button" variant="destructive" onClick={() => {
                        setDeletingNote(editingNote)
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
                        {editingNote ? 'Save Changes' : 'Save Note'}
                    </Button>
                </div>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={!!deletingNote} onOpenChange={(open) => {if (!open) setDeletingNote(null)}}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This will permanently delete this note.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setDeletingNote(null)} disabled={isSubmitting}>Cancel</AlertDialogCancel>
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

const MemoizedBusinessNotesPage = memo(BusinessNotesPageComponent);

export default function BusinessNotesPage() {
  return <MemoizedBusinessNotesPage />;
}
