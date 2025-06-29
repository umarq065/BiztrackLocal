
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { MoreHorizontal, CalendarIcon, Link as LinkIcon, BarChart } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
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
  DialogFooter,
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
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface CompetitorMonthlyData {
  month: number;
  year: number;
  orders: number;
  reviews: number;
}

interface Competitor {
  id: string;
  name: string;
  username?: string;
  profileLink?: string;
  pricingStart?: number;
  pricingMid?: number;
  pricingTop?: number;
  reviewsCount?: number;
  totalOrders?: number;
  workingSince?: Date;
  notes?: string;
  monthlyData?: CompetitorMonthlyData[];
}

const competitorFormSchema = z.object({
  name: z.string().min(2, { message: "Competitor name is required." }),
  username: z.string().optional(),
  profileLink: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
  pricingStart: z.coerce.number().min(0, "Price must be a positive number.").optional(),
  pricingMid: z.coerce.number().min(0, "Price must be a positive number.").optional(),
  pricingTop: z.coerce.number().min(0, "Price must be a positive number.").optional(),
  reviewsCount: z.coerce.number().int("Number of reviews must be a whole number.").min(0).optional(),
  totalOrders: z.coerce.number().int("Number of orders must be a whole number.").min(0).optional(),
  workingSince: z.date().optional(),
  notes: z.string().optional(),
});

type CompetitorFormValues = z.infer<typeof competitorFormSchema>;

const competitorDataFormSchema = z.object({
  month: z.string().min(1, { message: "Month is required." }),
  year: z.string().min(1, { message: "Year is required." }),
  orders: z.coerce.number().int().min(0, "Orders must be a non-negative number."),
  reviews: z.coerce.number().int().min(0, "Reviews must be a non-negative number."),
});

type CompetitorDataFormValues = z.infer<typeof competitorDataFormSchema>;


const initialCompetitors: Competitor[] = [
    { id: "1", name: "Creative Solutions Inc.", username: "creativeinc", profileLink: "https://example.com", pricingStart: 500, pricingMid: 1500, pricingTop: 5000, reviewsCount: 250, totalOrders: 300, workingSince: new Date("2018-01-01"), monthlyData: [] },
    { id: "2", name: "Digital Masters Co.", username: "digitalmasters", profileLink: "https://example.com", pricingStart: 300, pricingMid: 1000, pricingTop: 3000, reviewsCount: 180, totalOrders: 220, workingSince: new Date("2019-06-15"), monthlyData: [] },
    { id: "3", name: "Innovate Web Agency", username: "innovateweb", profileLink: "https://example.com", pricingStart: 800, pricingMid: 2500, pricingTop: 8000, reviewsCount: 400, totalOrders: 500, workingSince: new Date("2017-03-20"), monthlyData: [] },
    { id: "4", name: "Pixel Perfect Freelancer", username: "pixelperfect", profileLink: "https://example.com", pricingStart: 100, pricingMid: 500, pricingTop: 1500, reviewsCount: 95, totalOrders: 110, workingSince: new Date("2020-11-01"), monthlyData: [] },
];


export default function CompetitorsPage() {
    const [competitors, setCompetitors] = useState<Competitor[]>(initialCompetitors);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingCompetitor, setEditingCompetitor] = useState<Competitor | null>(null);
    const [deletingCompetitor, setDeletingCompetitor] = useState<Competitor | null>(null);
    const [addDataDialogOpen, setAddDataDialogOpen] = useState(false);
    const [updatingCompetitor, setUpdatingCompetitor] = useState<Competitor | null>(null);
    const { toast } = useToast();

    const form = useForm<CompetitorFormValues>({
        resolver: zodResolver(competitorFormSchema),
        defaultValues: {
            name: "",
            username: "",
            profileLink: "",
            pricingStart: undefined,
            pricingMid: undefined,
            pricingTop: undefined,
            reviewsCount: undefined,
            totalOrders: undefined,
            workingSince: undefined,
            notes: "",
        },
    });
    
    const addDataForm = useForm<CompetitorDataFormValues>({
        resolver: zodResolver(competitorDataFormSchema),
        defaultValues: {
            month: String(new Date().getMonth() + 1),
            year: String(new Date().getFullYear()),
            orders: 0,
            reviews: 0,
        },
    });

    const handleOpenDialog = (competitor: Competitor | null = null) => {
        if (competitor) {
            setEditingCompetitor(competitor);
            form.reset({
                ...competitor,
                pricingStart: competitor.pricingStart ?? undefined,
                pricingMid: competitor.pricingMid ?? undefined,
                pricingTop: competitor.pricingTop ?? undefined,
                reviewsCount: competitor.reviewsCount ?? undefined,
                totalOrders: competitor.totalOrders ?? undefined,
            });
        } else {
            setEditingCompetitor(null);
            form.reset({
                name: "",
                username: "",
                profileLink: "",
                pricingStart: undefined,
                pricingMid: undefined,
                pricingTop: undefined,
                reviewsCount: undefined,
                totalOrders: undefined,
                workingSince: undefined,
                notes: "",
            });
        }
        setDialogOpen(true);
    }
    
    const handleOpenDataDialog = (competitor: Competitor) => {
        setUpdatingCompetitor(competitor);
        addDataForm.reset({
            month: String(new Date().getMonth() + 1),
            year: String(new Date().getFullYear()),
            orders: 0,
            reviews: 0,
        });
        setAddDataDialogOpen(true);
    };

    const onSubmit = (values: CompetitorFormValues) => {
        const competitorData: Competitor = {
            id: editingCompetitor ? editingCompetitor.id : `comp-${Date.now()}`,
            monthlyData: editingCompetitor ? editingCompetitor.monthlyData : [],
            ...values,
        };

        if (editingCompetitor) {
            setCompetitors(competitors.map(c => c.id === editingCompetitor.id ? competitorData : c));
            toast({ title: "Competitor Updated", description: `${values.name} has been updated.` });
        } else {
            setCompetitors([competitorData, ...competitors]);
            toast({ title: "Competitor Added", description: `${values.name} has been added.` });
        }

        setDialogOpen(false);
        setEditingCompetitor(null);
    }

    const onSubmitData = (values: CompetitorDataFormValues) => {
        if (!updatingCompetitor) return;
        
        const monthlyData: CompetitorMonthlyData = {
            month: parseInt(values.month, 10),
            year: parseInt(values.year, 10),
            orders: values.orders,
            reviews: values.reviews,
        };

        setCompetitors(prev => 
            prev.map(c => {
                if (c.id === updatingCompetitor.id) {
                    return {
                        ...c,
                        reviewsCount: (c.reviewsCount || 0) + values.reviews,
                        totalOrders: (c.totalOrders || 0) + values.orders,
                        monthlyData: [...(c.monthlyData || []), monthlyData],
                    };
                }
                return c;
            })
        );
        
        toast({ title: "Data Added", description: `New monthly data has been added for ${updatingCompetitor.name}.` });
        setAddDataDialogOpen(false);
        setUpdatingCompetitor(null);
    };

    const handleDelete = () => {
        if (!deletingCompetitor) return;
        setCompetitors(competitors.filter(c => c.id !== deletingCompetitor.id));
        toast({ title: "Competitor Deleted" });
        setDeletingCompetitor(null);
    }

    const formatCurrency = (value?: number) => {
        if (value === undefined || value === null) return <span className="text-muted-foreground">N/A</span>;
        return `$${value.toLocaleString()}`;
    }

    const months = Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: format(new Date(0, i), 'MMMM') }));
    const years = Array.from({ length: 15 }, (_, i) => String(2021 + i));

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center">
        <h1 className="font-headline text-lg font-semibold md:text-2xl">
          Competitor Analysis
        </h1>
        <div className="ml-auto">
          <Button onClick={() => handleOpenDialog()}>Add Competitor</Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Competitor Overview</CardTitle>
          <CardDescription>
            Keep track of your main competitors.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Competitor</TableHead>
                <TableHead>Pricing Tiers (S/M/T)</TableHead>
                <TableHead>Reviews</TableHead>
                <TableHead>Total Orders</TableHead>
                <TableHead>Working Since</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {competitors.map((competitor) => (
                <TableRow key={competitor.id}>
                  <TableCell>
                      <div className="flex items-center gap-2 font-medium">
                        {competitor.name}
                        {competitor.profileLink && (
                            <a href={competitor.profileLink} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                                <LinkIcon className="h-4 w-4 text-muted-foreground hover:text-primary" />
                            </a>
                        )}
                      </div>
                      {competitor.username && <div className="text-sm text-muted-foreground">@{competitor.username}</div>}
                  </TableCell>
                  <TableCell>
                    {formatCurrency(competitor.pricingStart)} / {formatCurrency(competitor.pricingMid)} / {formatCurrency(competitor.pricingTop)}
                  </TableCell>
                  <TableCell>{competitor.reviewsCount?.toLocaleString() ?? <span className="text-muted-foreground">N/A</span>}</TableCell>
                  <TableCell>{competitor.totalOrders?.toLocaleString() ?? <span className="text-muted-foreground">N/A</span>}</TableCell>
                   <TableCell>{competitor.workingSince ? format(competitor.workingSince, "PPP") : <span className="text-muted-foreground">N/A</span>}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end items-center gap-1">
                      <TooltipProvider>
                          <Tooltip>
                              <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" onClick={() => handleOpenDataDialog(competitor)}>
                                      <BarChart className="h-4 w-4" />
                                      <span className="sr-only">Add Data</span>
                                  </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                  <p>Add monthly data</p>
                              </TooltipContent>
                          </Tooltip>
                      </TooltipProvider>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleOpenDialog(competitor)}>Edit</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setDeletingCompetitor(competitor)} className="text-destructive">Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingCompetitor ? "Edit Competitor" : "Add New Competitor"}</DialogTitle>
             <DialogDescription>
              Enter the details for the competitor below.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto p-1 pr-4">
               <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Competitor Name*</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Creative Solutions Inc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g., creativeinc" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="profileLink"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Profile Link</FormLabel>
                        <FormControl>
                            <Input placeholder="https://..." {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </div>
                 <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <FormField
                    control={form.control}
                    name="pricingStart"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Pricing - Starting Tier</FormLabel>
                        <FormControl>
                            <Input type="number" placeholder="e.g., 500" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                     <FormField
                    control={form.control}
                    name="pricingMid"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Pricing - Mid Tier</FormLabel>
                        <FormControl>
                            <Input type="number" placeholder="e.g., 1500" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                     <FormField
                    control={form.control}
                    name="pricingTop"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Pricing - Top Tier</FormLabel>
                        <FormControl>
                            <Input type="number" placeholder="e.g., 5000" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <FormField
                    control={form.control}
                    name="reviewsCount"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Number of Reviews</FormLabel>
                        <FormControl>
                            <Input type="number" placeholder="e.g., 250" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                      control={form.control}
                      name="totalOrders"
                      render={({ field }) => (
                          <FormItem>
                          <FormLabel>No. of Orders</FormLabel>
                          <FormControl>
                              <Input type="number" placeholder="e.g., 300" {...field} />
                          </FormControl>
                          <FormMessage />
                          </FormItem>
                      )}
                    />
                    <FormField
                        control={form.control}
                        name="workingSince"
                        render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>Working Since</FormLabel>
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
                                captionLayout="dropdown-buttons"
                                fromYear={2000}
                                toYear={new Date().getFullYear()}
                                disabled={(date) =>
                                    date > new Date() || date < new Date("2000-01-01")
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
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Any notes about this competitor..." className="min-h-[100px]" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="pt-4">
                    <DialogClose asChild>
                        <Button type="button" variant="secondary">Cancel</Button>
                    </DialogClose>
                    <Button type="submit">{editingCompetitor ? 'Save Changes' : 'Add Competitor'}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      <Dialog open={addDataDialogOpen} onOpenChange={setAddDataDialogOpen}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>Add Monthly Data for {updatingCompetitor?.name}</DialogTitle>
                <DialogDescription>
                    Enter the performance data for a specific month.
                </DialogDescription>
            </DialogHeader>
            <Form {...addDataForm}>
                <form onSubmit={addDataForm.handleSubmit(onSubmitData)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={addDataForm.control}
                            name="month"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Month</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select month" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {months.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={addDataForm.control}
                            name="year"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Year</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select year" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={addDataForm.control}
                            name="orders"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>No. of Orders</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="e.g., 50" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={addDataForm.control}
                            name="reviews"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>No. of Reviews</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="e.g., 10" {...field} />
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
      
      <AlertDialog open={!!deletingCompetitor} onOpenChange={(open) => {if (!open) setDeletingCompetitor(null)}}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This will permanently delete this competitor's data.
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
