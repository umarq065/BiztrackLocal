"use client";

import { useState, useMemo } from "react";
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
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import CalendarView from "@/components/business-notes/calendar-view";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

export interface BusinessNote {
  id: number;
  date: Date;
  title: string;
  content: string;
}

const parseDateString = (dateString: string): Date => {
  const [year, month, day] = dateString.split('-').map(Number);
  // In JavaScript's Date, months are 0-indexed (0 for January, 11 for December)
  return new Date(Date.UTC(year, month - 1, day));
};

const initialNotesData: { id: number; date: string; title: string; content: string }[] = [
    { id: 1, date: "2024-05-20", title: "Q3 Marketing Ideas", content: "- Launch social media campaign for new service.\n- Collaborate with influencer in our niche.\n- Offer a time-limited discount." },
    { id: 2, date: "2024-05-15", title: "Website Redesign V2 Feedback", content: "- Client loves the new homepage layout.\n- Needs changes to the color scheme in the contact page.\n- Add testimonials section." },
    { id: 3, date: "2024-05-10", title: "New Feature Brainstorm", content: "- AI-powered analytics.\n- Client portal for project tracking.\n- Integration with popular accounting software." },
];

const noteFormSchema = z.object({
  date: z.date({
    required_error: "A date for the note is required.",
  }),
  title: z.string().min(3, { message: "Title must be at least 3 characters." }),
  content: z.string().min(3, { message: "Note content must be at least 3 characters." }),
});

type NoteFormValues = z.infer<typeof noteFormSchema>;

export default function BusinessNotesPage() {
  const [notes, setNotes] = useState<BusinessNote[]>(() => 
    initialNotesData.map(note => ({
      ...note,
      date: parseDateString(note.date),
    }))
  );
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
      date: new Date(),
      title: "",
      content: "",
    }
  });

  const handleDateClick = (date: Date) => {
    setEditingNote(null);
    setSelectedDate(date);
    form.reset({ date, title: "", content: "" });
    setDialogOpen(true);
  };
  
  const handleNoteClick = (note: BusinessNote) => {
    setEditingNote(note);
    setSelectedDate(note.date);
    form.reset({ date: note.date, title: note.title, content: note.content });
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

  const onSubmit = (values: NoteFormValues) => {
    if (editingNote) {
      const updatedNote = { ...editingNote, ...values };
      setNotes(notes.map(n => n.id === editingNote.id ? updatedNote : n));
      toast({ title: "Note Updated" });
    } else {
      const newNote: BusinessNote = {
        id: Date.now(),
        date: values.date,
        title: values.title,
        content: values.content,
      };
      setNotes([...notes, newNote]);
      toast({ title: "Note Added" });
    }

    setDialogOpen(false);
    setEditingNote(null);
    setSelectedDate(null);
  };
  
  const handleDelete = () => {
    if (!deletingNote) return;

    const noteToDelete = deletingNote;
    setNotes(notes.filter(s => s.id !== noteToDelete.id));
    toast({ title: "Note Deleted" });
    setDeletingNote(null);
    if(editingNote && editingNote.id === noteToDelete.id) {
        setDialogOpen(false);
        setEditingNote(null);
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
    if (selectedDate) return `Add Note for ${format(selectedDate, 'PPP')}`;
    return "Add New Note";
  }, [editingNote, selectedDate]);

  const sortedNotes = useMemo(() => {
    return [...notes].sort((a, b) => b.date.getTime() - a.date.getTime());
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
      
      <div className="flex-1 overflow-y-auto">
        <main>
            <CalendarView 
                currentDate={currentDate}
                notes={notes}
                onDateClick={handleDateClick}
                onNoteClick={handleNoteClick}
            />
        </main>
        <section className="px-4 py-8 md:px-8">
          <h2 className="text-2xl font-semibold mb-4">Recent Notes</h2>
          <div className="space-y-4">
            {sortedNotes.slice(0, visibleNotesCount).map((note) => (
              <Card key={note.id}>
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                  <div>
                    <CardTitle className="text-base font-medium">{note.title}</CardTitle>
                    <CardDescription>{format(note.date, 'PPP')}</CardDescription>
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
           {sortedNotes.length === 0 && (
              <div className="text-center text-muted-foreground">No notes found.</div>
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
                  <FormItem className="flex flex-col">
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
                    <Button type="submit">{editingNote ? 'Save Changes' : 'Save Note'}</Button>
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
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className={cn(buttonVariants({ variant: "destructive" }))}>Delete</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
