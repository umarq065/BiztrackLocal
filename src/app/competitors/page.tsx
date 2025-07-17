
"use client";

import { useState, memo, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { toZonedTime } from 'date-fns-tz';
import { MoreHorizontal, CalendarIcon, Link as LinkIcon, BarChart, Loader2, Database } from "lucide-react";

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
import { type Competitor, type CompetitorFormValues, competitorFormSchema, competitorDataFormSchema, type CompetitorDataFormValues } from "@/lib/data/competitors-data";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


const CompetitorsPageComponent = () => {
    const [competitors, setCompetitors] = useState<Competitor[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

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

    const selectedMonth = addDataForm.watch("month");
    const selectedYear = addDataForm.watch("year");

    useEffect(() => {
        if (updatingCompetitor) {
            const existingData = updatingCompetitor.monthlyData?.find(
                d => d.month === parseInt(selectedMonth) && d.year === parseInt(selectedYear)
            );
            addDataForm.setValue("orders", existingData?.orders || 0);
            addDataForm.setValue("reviews", existingData?.reviews || 0);
        }
    }, [selectedMonth, selectedYear, updatingCompetitor, addDataForm]);

    const fetchCompetitors = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/competitors');
        if (!res.ok) throw new Error('Failed to fetch competitors from the server.');
        const data = await res.json();
        setCompetitors(data.map((c: Competitor & {workingSince?: string}) => ({
            ...c, 
            workingSince: c.workingSince ? toZonedTime(c.workingSince, 'UTC') : undefined
        })));
      } catch (e) {
        console.error(e);
        setError('Could not connect to the database or fetch data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    useEffect(() => {
      fetchCompetitors();
    }, []);

    const handleOpenDialog = (competitor: Competitor | null = null) => {
        if (competitor) {
            setEditingCompetitor(competitor);
            form.reset({
                ...competitor,
                workingSince: competitor.workingSince ? new Date(competitor.workingSince) : undefined,
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
        const currentMonth = String(new Date().getMonth() + 1);
        const currentYear = String(new Date().getFullYear());
        
        const existingData = competitor.monthlyData?.find(d => d.month === parseInt(currentMonth) && d.year === parseInt(currentYear));

        addDataForm.reset({
            month: currentMonth,
            year: currentYear,
            orders: existingData?.orders || 0,
            reviews: existingData?.reviews || 0,
        });
        setAddDataDialogOpen(true);
    };

    const onSubmit = async (values: CompetitorFormValues) => {
        setIsSubmitting(true);
        const method = editingCompetitor ? 'PUT' : 'POST';
        const endpoint = editingCompetitor ? `/api/competitors/${editingCompetitor.id}` : '/api/competitors';

        try {
            const response = await fetch(endpoint, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(values),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Failed to ${editingCompetitor ? 'update' : 'add'} competitor`);
            }
            
            const savedCompetitor = await response.json();
            savedCompetitor.workingSince = savedCompetitor.workingSince ? toZonedTime(savedCompetitor.workingSince, 'UTC') : undefined;

            if (editingCompetitor) {
                setCompetitors(competitors.map(c => c.id === editingCompetitor.id ? savedCompetitor : c));
                toast({ title: "Competitor Updated" });
            } else {
                setCompetitors([savedCompetitor, ...competitors]);
                toast({ title: "Competitor Added" });
            }

            setDialogOpen(false);
            setEditingCompetitor(null);
        } catch (err: any) {
            toast({ variant: 'destructive', title: "Error", description: err.message });
        } finally {
            setIsSubmitting(false);
        }
    }

    const onSubmitData = async (values: CompetitorDataFormValues) => {
        if (!updatingCompetitor) return;
        setIsSubmitting(true);
        
        try {
            const response = await fetch(`/api/competitors/${updatingCompetitor.id}/data`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(values),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Failed to add data`);
            }

            const updatedCompetitor = await response.json();
             updatedCompetitor.workingSince = updatedCompetitor.workingSince ? toZonedTime(updatedCompetitor.workingSince, 'UTC') : undefined;
            
            setCompetitors(prev => prev.map(c => c.id === updatedCompetitor.id ? updatedCompetitor : c));
            toast({ title: "Data Added", description: `New monthly data has been added for ${updatingCompetitor.name}.` });
            setAddDataDialogOpen(false);
            setUpdatingCompetitor(null);
        } catch (err: any) {
            toast({ variant: 'destructive', title: "Error", description: err.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!deletingCompetitor) return;
        setIsSubmitting(true);
        try {
            const response = await fetch(`/api/competitors/${deletingCompetitor.id}`, { method: 'DELETE' });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to delete competitor.');
            }
            setCompetitors(competitors.filter(c => c.id !== deletingCompetitor.id));
            toast({ title: "Competitor Deleted" });
        } catch (err: any) {
            toast({ variant: 'destructive', title: "Error", description: err.message });
        } finally {
            setIsSubmitting(false);
            setDeletingCompetitor(null);
        }
    }

    const formatCurrency = (value?: number) => {
        if (value === undefined || value === null) return <span className="text-muted-foreground">N/A</span>;
        return `$${value.toLocaleString()}`;
    }

    const months = Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: format(new Date(0, i), 'MMMM') }));
    const years = Array.from({ length: 11 }, (_, i) => String(2025 - i));

    if (isLoading) {
      return (
          <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
              <div className="flex items-center">
                  <h1 className="font-headline text-lg font-semibold md:text-2xl">
                      Competitor Analysis
                  </h1>
                  <div className="ml-auto">
                      <Skeleton className="h-10 w-36" />
                  </div>
              </div>
              <Card>
                  <CardHeader>
                      <Skeleton className="h-6 w-1/2" />
                      <Skeleton className="h-4 w-3/4" />
                  </CardHeader>
                  <CardContent>
                      <Skeleton className="h-48 w-full" />
                  </CardContent>
              </Card>
          </main>
      )
    }

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
      
       {error && (
        <div className="p-4">
            <Alert variant="destructive">
                <Database className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        </div>
      )}

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
              {competitors.length > 0 ? competitors.map((competitor) => (
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
              )) : (
                  <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                          No competitors found. Add one to get started.
                      </TableCell>
                  </TableRow>
              )}
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
                        <FormItem>
                            <FormLabel>Working Since</FormLabel>
                            <Popover>
                            <PopoverTrigger asChild>
                                <FormControl>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {field.value ? (
                                    format(field.value, "PPP")
                                    ) : (
                                    <span>Pick a date</span>
                                    )}
                                </Button>
                                </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                mode="single"
                                captionLayout="dropdown-buttons"
                                selected={field.value}
                                onSelect={field.onChange}
                                fromYear={2010}
                                toYear={2035}
                                disabled={(date) =>
                                    date > new Date("2035-12-31") || date < new Date("2010-01-01")
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
                    <Button type="submit" disabled={isSubmitting}>
                       {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                       {editingCompetitor ? 'Save Changes' : 'Add Competitor'}
                    </Button>
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
                        <Button type="submit" disabled={isSubmitting}>
                           {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                           Add Data
                        </Button>
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
                <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} disabled={isSubmitting} className={cn(buttonVariants({ variant: "destructive" }))}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Delete
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}

const MemoizedCompetitorsPage = memo(CompetitorsPageComponent);

export default function CompetitorsPage() {
    return <MemoizedCompetitorsPage />;
}
    
