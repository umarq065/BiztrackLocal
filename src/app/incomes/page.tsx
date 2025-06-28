
"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon, MoreHorizontal, PlusCircle, Trash2 } from "lucide-react";
import NProgressLink from "@/components/layout/nprogress-link";

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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface Gig {
  id: string;
  name: string;
  date: string;
  messages?: number;
}

interface SourceDataPoint {
  date: string;
  messages: number;
}

interface IncomeSource {
  id: string;
  name: string;
  gigs: Gig[];
  dataPoints?: SourceDataPoint[];
}

const initialIncomeSources: IncomeSource[] = [
  {
    id: "1",
    name: "Web Design",
    gigs: [
      { id: "g1", name: "Acme Corp Redesign", date: "2023-01-15", messages: 125 },
      { id: "g2", name: "Startup Landing Page", date: "2023-01-25", messages: 52 },
      { id: "g3", name: "E-commerce Site for 'ShopEasy'", date: "2023-02-05", messages: 210 },
    ],
    dataPoints: [],
  },
  {
    id: "2",
    name: "Consulting",
    gigs: [{ id: "g4", name: "Q1 Strategy Session", date: "2023-01-20", messages: 30 }],
    dataPoints: [],
  },
  {
    id: "3",
    name: "Logo Design",
    gigs: [
      { id: "g5", name: "Brand Identity for 'Innovate'", date: "2023-02-01", messages: 15 },
    ],
    dataPoints: [],
  },
  {
    id: "4",
    name: "SEO Services",
    gigs: [{ id: "g6", name: "Monthly SEO Retainer", date: "2023-02-10", messages: 88 }],
    dataPoints: [],
  },
  {
    id: "5",
    name: "Maintenance",
    gigs: [
      { id: "g7", name: "Website Support Package", date: "2023-02-15", messages: 5 },
    ],
    dataPoints: [],
  },
];

const formSchema = z.object({
  sourceName: z.string().min(2, {
    message: "Source name must be at least 2 characters.",
  }),
  gigs: z
    .array(
      z.object({
        name: z.string().min(2, {
          message: "Gig name must be at least 2 characters.",
        }),
        date: z.date({
          required_error: "A date for the gig is required.",
        }),
      })
    )
    .min(1, { message: "You must add at least one gig." }),
});

const addGigFormSchema = z.object({
    name: z.string().min(2, { message: "Gig name must be at least 2 characters." }),
    date: z.date({ required_error: "A date for the gig is required." }),
});
type AddGigFormValues = z.infer<typeof addGigFormSchema>;

const addDataFormSchema = z.object({
    date: z.date({ required_error: "A date is required." }),
    messages: z.coerce.number().int().min(0, { message: "Number of messages must be a non-negative number." }),
});
type AddDataFormValues = z.infer<typeof addDataFormSchema>;


export default function IncomesPage() {
  const [incomeSources, setIncomeSources] =
    useState<IncomeSource[]>(initialIncomeSources);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const [mergingSourceId, setMergingSourceId] = useState<string | null>(null);
  const [selectedGigs, setSelectedGigs] = useState<Record<string, boolean>>({});
  const [isMergeConfirmOpen, setIsMergeConfirmOpen] = useState(false);
  const [gigsForMergeConfirmation, setGigsForMergeConfirmation] = useState<Gig[]>([]);
  const [mainGigId, setMainGigId] = useState<string | null>(null);

  const [addGigDialogOpen, setAddGigDialogOpen] = useState(false);
  const [addingToSourceId, setAddingToSourceId] = useState<string | null>(null);
  
  const [isAddDataDialogOpen, setIsAddDataDialogOpen] = useState(false);
  const [updatingSourceId, setUpdatingSourceId] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sourceName: "",
      gigs: [{ name: "", date: new Date() }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "gigs",
  });

  const addGigForm = useForm<AddGigFormValues>({
    resolver: zodResolver(addGigFormSchema),
    defaultValues: {
      name: "",
      date: new Date(),
    },
  });

  const addDataForm = useForm<AddDataFormValues>({
    resolver: zodResolver(addDataFormSchema),
    defaultValues: {
        date: new Date(),
        messages: 0,
    },
  });


  function onSubmit(values: z.infer<typeof formSchema>) {
    const newSource: IncomeSource = {
      id: `source-${Date.now()}`,
      name: values.sourceName,
      gigs: values.gigs.map((gig, index) => ({
        id: `g-${Date.now()}-${index}`,
        name: gig.name,
        date: format(gig.date, "yyyy-MM-dd"),
        messages: 0,
      })),
      dataPoints: [],
    };

    setIncomeSources([newSource, ...incomeSources]);

    toast({
      title: "Success",
      description: `Added new source: ${newSource.name}.`,
    });
    form.reset();
    form.setValue("gigs", [{ name: "", date: new Date() }]);
    setOpen(false);
  }

  function onAddGigSubmit(values: AddGigFormValues) {
    if (!addingToSourceId) return;

    const newGig: Gig = {
      id: `g-${Date.now()}`,
      name: values.name,
      date: format(values.date, "yyyy-MM-dd"),
    };

    setIncomeSources(prevSources => 
      prevSources.map(source => {
        if (source.id === addingToSourceId) {
          return { ...source, gigs: [newGig, ...source.gigs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) };
        }
        return source;
      })
    );
    
    toast({
      title: "Gig Added",
      description: `Added "${values.name}" to the income source.`,
    });
    addGigForm.reset({ name: "", date: new Date() });
    setAddGigDialogOpen(false);
  }

  function onAddDataSubmit(values: AddDataFormValues) {
    if (!updatingSourceId) return;

    const newDataPoint: SourceDataPoint = {
        date: format(values.date, "yyyy-MM-dd"),
        messages: values.messages,
    };

    setIncomeSources(prevSources => 
      prevSources.map(source => {
        if (source.id === updatingSourceId) {
          const updatedDataPoints = [...(source.dataPoints || []), newDataPoint];
          updatedDataPoints.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          return { ...source, dataPoints: updatedDataPoints };
        }
        return source;
      })
    );
    
    toast({
      title: "Data Added",
      description: `Added new data point to the income source.`,
    });
    addDataForm.reset({ date: new Date(), messages: 0 });
    setIsAddDataDialogOpen(false);
  }


  const handleCancelMerge = () => {
    setMergingSourceId(null);
    setSelectedGigs({});
  };

  const handleInitiateMerge = () => {
    const source = incomeSources.find(s => s.id === mergingSourceId);
    if (!source) return;

    const selected = source.gigs.filter(gig => selectedGigs[gig.id]);
    setGigsForMergeConfirmation(selected);
    setIsMergeConfirmOpen(true);
  };
  
  const handleConfirmMerge = () => {
    if (!mainGigId || !mergingSourceId) return;

    setIncomeSources(prevSources => 
      prevSources.map(source => {
        if (source.id === mergingSourceId) {
          const gigsToKeep = source.gigs.filter(gig => !selectedGigs[gig.id] || gig.id === mainGigId);
          return { ...source, gigs: gigsToKeep };
        }
        return source;
      })
    );

    toast({
      title: "Gigs Merged",
      description: "The selected gigs have been successfully merged.",
    });

    setIsMergeConfirmOpen(false);
    setMergingSourceId(null);
    setSelectedGigs({});
    setGigsForMergeConfirmation([]);
    setMainGigId(null);
  };
  
  const handleSelectAllGigs = (gigs: Gig[]) => (checked: boolean) => {
    const newSelectedGigs = { ...selectedGigs };
    gigs.forEach(gig => {
        newSelectedGigs[gig.id] = checked;
    });
    setSelectedGigs(newSelectedGigs);
  };


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
            <DialogContent className="sm:max-w-xl">
              <DialogHeader>
                <DialogTitle>Add New Income Source</DialogTitle>
                <DialogDescription>
                  Enter the details for your new income source, including any
                  specific gigs.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
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
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-grow">
                            <FormField
                              control={form.control}
                              name={`gigs.${index}.name`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Gig Name</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="e.g., Acme Corp Website"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`gigs.${index}.date`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Gig Date</FormLabel>
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <FormControl>
                                        <Button
                                          variant={"outline"}
                                          className={cn(
                                            "w-full pl-3 text-left font-normal",
                                            !field.value &&
                                              "text-muted-foreground"
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
                                    <PopoverContent
                                      className="w-auto p-0"
                                      align="start"
                                    >
                                      <Calendar
                                        mode="single"
                                        selected={field.value}
                                        onSelect={field.onChange}
                                        disabled={(date) =>
                                          date > new Date() ||
                                          date < new Date("1900-01-01")
                                        }
                                        initialFocus
                                      />
                                    </PopoverContent>
                                  </Popover>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => remove(index)}
                            disabled={fields.length <= 1}
                          >
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
                      onClick={() => append({ name: "", date: new Date() })}
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
            Here you can add, edit, or delete your income sources and their gigs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" className="w-full space-y-2">
            {incomeSources.map((source) => (
              <AccordionItem
                value={source.id}
                key={source.id}
                className="rounded-md border px-4"
              >
                <AccordionTrigger>
                  <div className="flex items-center gap-4">
                    <span className="font-semibold text-lg">{source.name}</span>
                    <Badge variant="secondary">{source.gigs.length} Gigs</Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="flex justify-end gap-2 mb-4">
                    {mergingSourceId === source.id ? (
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={handleCancelMerge}>Cancel Merge</Button>
                        <Button onClick={handleInitiateMerge} disabled={Object.values(selectedGigs).filter(Boolean).length < 2}>
                          Merge Selected ({Object.values(selectedGigs).filter(Boolean).length})
                        </Button>
                      </div>
                    ) : (
                      <Button variant="outline" onClick={() => {
                        setMergingSourceId(source.id);
                        setSelectedGigs({});
                      }}>
                        Merge Gigs
                      </Button>
                    )}
                     <Button variant="outline" onClick={() => {
                        setUpdatingSourceId(source.id);
                        addDataForm.reset();
                        setIsAddDataDialogOpen(true);
                     }}>
                        Add Data
                    </Button>
                     <Button variant="outline" onClick={() => {
                        setAddingToSourceId(source.id);
                        addGigForm.reset();
                        setAddGigDialogOpen(true);
                      }}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Gig
                    </Button>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {mergingSourceId === source.id && (
                           <TableHead className="w-12">
                             <Checkbox
                                onCheckedChange={(checked) => handleSelectAllGigs(source.gigs)(!!checked)}
                                checked={
                                    source.gigs.length > 0 && source.gigs.every((gig) => selectedGigs[gig.id])
                                }
                                aria-label="Select all gigs for this source"
                             />
                           </TableHead>
                        )}
                        <TableHead>Gig Name</TableHead>
                        <TableHead>Date Added</TableHead>
                        <TableHead>Messages</TableHead>
                        <TableHead>
                          <span className="sr-only">Actions</span>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {source.gigs.map((gig) => (
                        <TableRow key={gig.id}>
                          {mergingSourceId === source.id && (
                              <TableCell>
                                <Checkbox
                                    onCheckedChange={(checked) => {
                                        setSelectedGigs(prev => ({...prev, [gig.id]: !!checked}));
                                    }}
                                    checked={!!selectedGigs[gig.id]}
                                    aria-label={`Select gig ${gig.name}`}
                                />
                              </TableCell>
                          )}
                          <TableCell className="font-medium">
                            <NProgressLink href={`/gigs/${gig.id}`} className="hover:underline">
                                {gig.name}
                            </NProgressLink>
                          </TableCell>
                          <TableCell>
                            {format(new Date(gig.date), "PPP")}
                          </TableCell>
                          <TableCell>
                            {gig.messages ?? <span className="text-muted-foreground">N/A</span>}
                          </TableCell>
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
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      <Dialog open={isMergeConfirmOpen} onOpenChange={setIsMergeConfirmOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Confirm Gig Merge</DialogTitle>
                <DialogDescription>
                    Select one gig to keep as the main gig. The other selected gigs will be removed. This action cannot be undone.
                </DialogDescription>
            </DialogHeader>
            <RadioGroup onValueChange={setMainGigId} className="my-4 space-y-2">
                {gigsForMergeConfirmation.map(gig => (
                    <div key={gig.id} className="flex items-center space-x-2 rounded-md border p-3">
                        <RadioGroupItem value={gig.id} id={gig.id} />
                        <Label htmlFor={gig.id} className="flex-grow font-normal cursor-pointer">{gig.name} ({format(new Date(gig.date), "PPP")})</Label>
                    </div>
                ))}
            </RadioGroup>
            <DialogFooter>
                <DialogClose asChild>
                    <Button variant="outline" onClick={() => setMainGigId(null)}>Cancel</Button>
                </DialogClose>
                <Button onClick={handleConfirmMerge} disabled={!mainGigId}>
                    Confirm Merge
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={addGigDialogOpen} onOpenChange={setAddGigDialogOpen}>
        <DialogContent className="sm:max-w-lg">
            <DialogHeader>
                <DialogTitle>Add New Gig</DialogTitle>
                <DialogDescription>
                    Fill in the details for the new gig below.
                </DialogDescription>
            </DialogHeader>
            <Form {...addGigForm}>
                <form onSubmit={addGigForm.handleSubmit(onAddGigSubmit)} className="space-y-6 pt-4">
                    <FormField
                        control={addGigForm.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Gig Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g., New Project" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={addGigForm.control}
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
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="secondary">Cancel</Button>
                        </DialogClose>
                        <Button type="submit">Add Gig</Button>
                    </DialogFooter>
                </form>
            </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddDataDialogOpen} onOpenChange={setIsAddDataDialogOpen}>
        <DialogContent className="sm:max-w-lg">
            <DialogHeader>
                <DialogTitle>Add Data to Income Source</DialogTitle>
                <DialogDescription>
                    Add a new data point for messages and date for this source.
                </DialogDescription>
            </DialogHeader>
            <Form {...addDataForm}>
                <form onSubmit={addDataForm.handleSubmit(onAddDataSubmit)} className="space-y-6 pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                          control={addDataForm.control}
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
                      <FormField
                        control={addDataForm.control}
                        name="messages"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>No. of Messages</FormLabel>
                                <FormControl>
                                    <Input type="number" placeholder="e.g., 150" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                      />
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="secondary">Cancel</Button>
                        </DialogClose>
                        <Button type="submit">Add Data</Button>
                    </DialogFooter>
                </form>
            </Form>
        </DialogContent>
      </Dialog>
    </main>
  );
}
