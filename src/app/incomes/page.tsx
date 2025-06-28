"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon, MoreHorizontal, PlusCircle, Trash2 } from "lucide-react";

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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";


const initialIncomeSources = [
  { id: "1", source: "Web Design", date: "2023-01-15" },
  { id: "2", source: "Consulting", date: "2023-01-20" },
  { id: "3", source: "Logo Design", date: "2023-02-01" },
  { id: "4", source: "SEO Services", date: "2023-02-10" },
  { id: "5", source: "Maintenance", date: "2023-02-15" },
];

const formSchema = z.object({
  sourceName: z.string().min(2, {
    message: "Source name must be at least 2 characters.",
  }),
  gigs: z.array(
    z.object({
      date: z.date({
        required_error: "A date for the gig is required.",
      }),
    })
  ).min(1, { message: "You must add at least one gig." }),
});

export default function IncomesPage() {
  const [incomeSources, setIncomeSources] = useState(initialIncomeSources);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sourceName: "",
      gigs: [{ date: new Date() }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "gigs",
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    const newSource = {
      id: (incomeSources.length + 1).toString(),
      source: values.sourceName,
      date: format(values.gigs[0].date, "yyyy-MM-dd"),
    };
    setIncomeSources([newSource, ...incomeSources]);
    toast({
        title: "Success",
        description: "New income source added successfully.",
    });
    form.reset();
    form.setValue("gigs", [{ date: new Date() }]);
    setOpen(false);
  }

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center">
        <h1 className="font-headline text-lg font-semibold md:text-2xl">
          Income Sources
        </h1>
        <div className="ml-auto">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>Add New Source</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px]">
              <DialogHeader>
                <DialogTitle>Add New Income Source</DialogTitle>
                <DialogDescription>
                  Enter the details for your new income source, including any specific gigs.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="sourceName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Source Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Web Design" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div>
                    <FormLabel>Gigs</FormLabel>
                    <div className="mt-2 space-y-4">
                      {fields.map((field, index) => (
                        <div key={field.id} className="flex items-end gap-2">
                           <FormField
                              control={form.control}
                              name={`gigs.${index}.date`}
                              render={({ field }) => (
                                <FormItem className="flex flex-col flex-grow">
                                  {index === 0 && <FormLabel>Gig Date</FormLabel>}
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
                                        disabled={(date) =>
                                          date > new Date() || date < new Date("1900-01-01")
                                        }
                                        initialFocus
                                      />
                                    </PopoverContent>
                                  </Popover>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <Button type="button" variant="outline" size="icon" onClick={() => remove(index)} disabled={fields.length <= 1}>
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Remove Gig</span>
                            </Button>
                        </div>
                      ))}
                    </div>
                     <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-4"
                        onClick={() => append({ date: new Date() })}
                      >
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add another Gig
                      </Button>
                  </div>
                  
                  <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="secondary">
                            Cancel
                        </Button>
                    </DialogClose>
                    <Button type="submit">Save Source</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Manage Your Income Sources</CardTitle>
          <CardDescription>
            Here you can add, edit, or delete your income sources.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Source Name</TableHead>
                <TableHead>Date Added</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {incomeSources.map((income) => (
                <TableRow key={income.id}>
                  <TableCell className="font-medium">{income.source}</TableCell>
                  <TableCell>{format(new Date(income.date), "PPP")}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          aria-haspopup="true"
                          size="icon"
                          variant="ghost"
                        >
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
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}
