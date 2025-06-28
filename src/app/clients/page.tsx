"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MoreHorizontal, PlusCircle, Trash2, Facebook, Twitter, Linkedin, Github, Globe } from "lucide-react";

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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { useToast } from "@/hooks/use-toast";

const socialLinkSchema = z.object({
  platform: z.string().min(1, "Platform is required."),
  url: z.string().url("Please enter a valid URL."),
});

const clientFormSchema = z.object({
  username: z.string().min(2, { message: "Username must be at least 2 characters." }),
  name: z.string().optional(),
  email: z.string().email({ message: "Invalid email address." }).optional().or(z.literal('')),
  source: z.string().min(1, { message: "Income source is required." }),
  socialLinks: z.array(socialLinkSchema).optional(),
});

type ClientFormValues = z.infer<typeof clientFormSchema>;

interface Client {
    id: string;
    username: string;
    name?: string;
    email?: string;
    source: string;
    socialLinks?: { platform: string; url: string }[];
}

const initialClients: Client[] = [
  { id: "1", name: "Olivia Martin", username: "olivia.m", email: "olivia.martin@email.com", source: "Web Design" },
  { id: "2", name: "Jackson Lee", username: "jackson.l", email: "jackson.lee@email.com", source: "Consulting" },
  { id: "3", name: "Isabella Nguyen", username: "isabella.n", email: "isabella.nguyen@email.com", source: "Logo Design" },
  { id: "4", name: "William Kim", username: "will.k", email: "will@email.com", source: "Web Design" },
  { id: "5", name: "Sofia Davis", username: "sofia.d", email: "sofia.davis@email.com", source: "SEO Services" },
];

const incomeSources = ["Web Design", "Consulting", "Logo Design", "SEO Services", "Maintenance"];
const socialPlatforms = [
    { value: "Facebook", icon: Facebook },
    { value: "Twitter", icon: Twitter },
    { value: "LinkedIn", icon: Linkedin },
    { value: "GitHub", icon: Github },
    { value: "Website", icon: Globe },
];

export default function ClientsPage() {
    const [clients, setClients] = useState<Client[]>(initialClients);
    const [open, setOpen] = useState(false);
    const { toast } = useToast();

    const form = useForm<ClientFormValues>({
        resolver: zodResolver(clientFormSchema),
        defaultValues: {
            username: "",
            name: "",
            email: "",
            source: "",
            socialLinks: [],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "socialLinks",
    });

    function onSubmit(values: ClientFormValues) {
        const newClient: Client = {
            id: `client-${Date.now()}`,
            ...values,
        };
        setClients([newClient, ...clients]);
        toast({
            title: "Client Added",
            description: `${values.name || values.username} has been added to your client list.`,
        });
        form.reset();
        setOpen(false);
    }

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center">
        <h1 className="font-headline text-lg font-semibold md:text-2xl">
          Clients
        </h1>
        <div className="ml-auto flex items-center gap-2">
          <Select>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              {incomeSources.map(source => <SelectItem key={source} value={source.toLowerCase().replace(' ', '-')}>{source}</SelectItem>)}
            </SelectContent>
          </Select>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>Add New Client</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Add New Client</DialogTitle>
                    <DialogDescription>
                        Fill in the details below to add a new client to your list.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="username"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Username</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., johndoe99" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Client Name (Optional)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., John Doe" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Email (Optional)</FormLabel>
                                <FormControl>
                                    <Input type="email" placeholder="e.g., john.doe@example.com" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="source"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Income Source</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select an income source" />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {incomeSources.map(source => <SelectItem key={source} value={source}>{source}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        
                        <div>
                            <FormLabel>Social Links (Optional)</FormLabel>
                            <div className="mt-2 space-y-4">
                                {fields.map((field, index) => (
                                    <div key={field.id} className="flex items-end gap-2">
                                        <FormField
                                            control={form.control}
                                            name={`socialLinks.${index}.platform`}
                                            render={({ field }) => (
                                                <FormItem className="w-1/3">
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Platform" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {socialPlatforms.map(p => {
                                                                const Icon = p.icon;
                                                                return (
                                                                    <SelectItem key={p.value} value={p.value}>
                                                                        <div className="flex items-center gap-2">
                                                                            <Icon className="h-4 w-4" />
                                                                            <span>{p.value}</span>
                                                                        </div>
                                                                    </SelectItem>
                                                                )
                                                            })}
                                                        </SelectContent>
                                                    </Select>
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name={`socialLinks.${index}.url`}
                                            render={({ field }) => (
                                                <FormItem className="flex-grow">
                                                    <FormControl>
                                                        <Input placeholder="https://..." {...field} />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            onClick={() => remove(index)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            <span className="sr-only">Remove Link</span>
                                        </Button>
                                    </div>
                                ))}
                            </div>
                             <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="mt-4"
                                onClick={() => append({ platform: "", url: "" })}
                                >
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Add Social Link
                            </Button>
                        </div>
                        
                        <DialogFooter>
                            <DialogClose asChild>
                            <Button type="button" variant="secondary">
                                Cancel
                            </Button>
                            </DialogClose>
                            <Button type="submit">Add Client</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Manage Your Clients</CardTitle>
          <CardDescription>
            A list of all your clients.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Income Source</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell>
                    <div className="flex items-center gap-4">
                      <Avatar className="hidden h-9 w-9 sm:flex">
                        <AvatarImage src={`https://placehold.co/100x100.png?text=${(client.name || client.username).charAt(0)}`} alt="Avatar" data-ai-hint="avatar person" />
                        <AvatarFallback>{(client.name || client.username).charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="grid gap-1">
                        <p className="text-sm font-medium leading-none">{client.name || client.username}</p>
                        <p className="text-sm text-muted-foreground">{client.email || `@${client.username}`}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{client.source}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
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
