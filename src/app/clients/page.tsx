
"use client";

import { useState, useMemo } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MoreHorizontal, PlusCircle, Trash2, Facebook, Twitter, Linkedin, Github, Globe, Edit, ArrowUpDown } from "lucide-react";

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
import { Badge } from "@/components/ui/badge";

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
    clientType: 'New' | 'Repeat';
    clientSince: string;
    totalOrders: number;
    totalEarning: number;
    lastOrder: string;
}

const initialClients: Client[] = [
  { id: "1", name: "Olivia Martin", username: "olivia.m", email: "olivia.martin@email.com", source: "Web Design", clientType: "Repeat", clientSince: "2023-01-15", totalOrders: 5, totalEarning: 8500, lastOrder: "2024-05-20", socialLinks: [{platform: "LinkedIn", url: "#"}, {platform: "Twitter", url: "#"}] },
  { id: "2", name: "Jackson Lee", username: "jackson.l", email: "jackson.lee@email.com", source: "Consulting", clientType: "New", clientSince: "2024-03-10", totalOrders: 1, totalEarning: 1200, lastOrder: "2024-05-21", socialLinks: [{platform: "GitHub", url: "#"}] },
  { id: "3", name: "Isabella Nguyen", username: "isabella.n", email: "isabella.nguyen@email.com", source: "Logo Design", clientType: "Repeat", clientSince: "2022-11-05", totalOrders: 8, totalEarning: 4500, lastOrder: "2024-05-18", socialLinks: [] },
  { id: "4", name: "William Kim", username: "will.k", email: "will@email.com", source: "Web Design", clientType: "Repeat", clientSince: "2023-08-20", totalOrders: 3, totalEarning: 6200, lastOrder: "2024-04-30", socialLinks: [{platform: "Website", url: "#"}] },
  { id: "5", name: "Sofia Davis", username: "sofia.d", email: "sofia.davis@email.com", source: "SEO Services", clientType: "New", clientSince: "2024-04-01", totalOrders: 2, totalEarning: 1800, lastOrder: "2024-05-24", socialLinks: [{platform: "Facebook", url: "#"}, {platform: "Twitter", url: "#"}] },
];

const incomeSources = ["Web Design", "Consulting", "Logo Design", "SEO Services", "Maintenance"];

const socialPlatforms = [
    { value: "Facebook", icon: Facebook },
    { value: "Twitter", icon: Twitter },
    { value: "LinkedIn", icon: Linkedin },
    { value: "GitHub", icon: Github },
    { value: "Website", icon: Globe },
];

const SocialIcon = ({ platform }: { platform: string }) => {
    const platformConfig = socialPlatforms.find(p => p.value === platform);
    if (!platformConfig) return <Globe className="h-5 w-5 text-muted-foreground" />;
    const Icon = platformConfig.icon;
    return <Icon className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />;
}

export default function ClientsPage() {
    const [clients, setClients] = useState<Client[]>(initialClients);
    const [open, setOpen] = useState(false);
    const [filterSource, setFilterSource] = useState('all');
    const [sortConfig, setSortConfig] = useState<{ key: keyof Client | null; direction: 'ascending' | 'descending' }>({ key: null, direction: 'ascending' });
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
            clientType: 'New',
            clientSince: new Date().toISOString().split('T')[0],
            totalOrders: 0,
            totalEarning: 0,
            lastOrder: 'N/A',
        };
        setClients([newClient, ...clients]);
        toast({
            title: "Client Added",
            description: `${values.name || values.username} has been added to your client list.`,
        });
        form.reset();
        setOpen(false);
    }
    
    const requestSort = (key: keyof Client) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const getSortIndicator = (key: keyof Client) => {
        if (sortConfig.key === key) {
            return <ArrowUpDown className="ml-2 h-4 w-4" />;
        }
        return <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />;
    };

    const filteredClients = useMemo(() => {
        if (filterSource === 'all') {
            return clients;
        }
        return clients.filter(client => client.source.toLowerCase().replace(/\s+/g, '-') === filterSource);
    }, [clients, filterSource]);

    const sortedClients = useMemo(() => {
        let sortableItems = [...filteredClients];
        if (sortConfig.key) {
            const key = sortConfig.key;
            sortableItems.sort((a, b) => {
                let aValue: any, bValue: any;

                if (key === 'name') {
                    aValue = a.name || a.username;
                    bValue = b.name || b.username;
                } else {
                    aValue = a[key];
                    bValue = b[key];
                }

                if (aValue < bValue) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [filteredClients, sortConfig]);

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center">
        <h1 className="font-headline text-lg font-semibold md:text-2xl">
          Clients
        </h1>
        <div className="ml-auto flex items-center gap-2">
          <Select value={filterSource} onValueChange={setFilterSource}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              {incomeSources.map(source => <SelectItem key={source} value={source.toLowerCase().replace(/\s+/g, '-')}>{source}</SelectItem>)}
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
              <CardTitle>Client List</CardTitle>
              <CardDescription>A sortable list of all your clients.</CardDescription>
          </CardHeader>
          <CardContent>
              <Table>
                  <TableHeader>
                      <TableRow>
                          <TableHead>
                            <Button variant="ghost" onClick={() => requestSort('name')}>
                                Client {getSortIndicator('name')}
                            </Button>
                          </TableHead>
                          <TableHead>
                            <Button variant="ghost" onClick={() => requestSort('clientType')}>
                                Type {getSortIndicator('clientType')}
                            </Button>
                           </TableHead>
                          <TableHead>
                             <Button variant="ghost" onClick={() => requestSort('source')}>
                                Source {getSortIndicator('source')}
                            </Button>
                          </TableHead>
                          <TableHead className="text-right">
                             <Button variant="ghost" onClick={() => requestSort('totalEarning')}>
                                Earning {getSortIndicator('totalEarning')}
                            </Button>
                           </TableHead>
                          <TableHead className="text-right">
                             <Button variant="ghost" onClick={() => requestSort('totalOrders')}>
                                Orders {getSortIndicator('totalOrders')}
                            </Button>
                           </TableHead>
                          <TableHead>
                            <Button variant="ghost" onClick={() => requestSort('clientSince')}>
                                Client Since {getSortIndicator('clientSince')}
                            </Button>
                           </TableHead>
                          <TableHead>
                             <Button variant="ghost" onClick={() => requestSort('lastOrder')}>
                                Last Order {getSortIndicator('lastOrder')}
                            </Button>
                           </TableHead>
                          <TableHead>Social</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {sortedClients.map((client) => (
                          <TableRow key={client.id}>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src={`https://placehold.co/100x100.png?text=${(client.name || client.username).charAt(0)}`} alt="Avatar" data-ai-hint="avatar person" />
                                        <AvatarFallback>{(client.name || client.username).charAt(0).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <div className="font-medium">{client.name || client.username}</div>
                                        <div className="text-sm text-muted-foreground">@{client.username}</div>
                                    </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant={client.clientType === 'New' ? 'secondary' : 'default'}>{client.clientType}</Badge>
                              </TableCell>
                              <TableCell>{client.source}</TableCell>
                              <TableCell className="text-right">${client.totalEarning.toLocaleString()}</TableCell>
                              <TableCell className="text-right">{client.totalOrders}</TableCell>
                              <TableCell>{client.clientSince}</TableCell>
                              <TableCell>{client.lastOrder}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {client.socialLinks?.map((link, i) => (
                                    <a key={i} href={link.url} target="_blank" rel="noreferrer noopener" aria-label={link.platform}>
                                        <SocialIcon platform={link.platform} />
                                    </a>
                                  ))}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                  <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                          <Button aria-haspopup="true" size="icon" variant="ghost">
                                              <MoreHorizontal className="h-4 w-4" />
                                              <span className="sr-only">Toggle menu</span>
                                          </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                          <DropdownMenuItem>
                                              <Edit className="mr-2 h-4 w-4" />
                                              Edit
                                          </DropdownMenuItem>
                                          <DropdownMenuItem className="text-destructive">
                                              <Trash2 className="mr-2 h-4 w-4" />
                                              Delete
                                          </DropdownMenuItem>
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

    