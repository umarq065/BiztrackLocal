
"use client";

import { useState, useMemo, useCallback, useEffect, memo } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ArrowUpDown, Search, Sparkles, X, ChevronDown, Database, Loader2, Trash2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Input } from "@/components/ui/input";
import { type Client, getClientStatus } from "@/lib/data/clients-data";
import { AddClientDialog } from "@/components/clients/add-client-dialog";
import { ClientsTable } from "@/components/clients/clients-table";
import { EditClientDialog } from "@/components/clients/edit-client-dialog";
import { filterClients, type ClientFilters } from "@/ai/flows/filter-clients-flow";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import type { IncomeSource } from "@/lib/data/incomes-data";
import { MonthYearPicker } from "@/components/clients/month-year-picker";

const INITIAL_LOAD_COUNT = 50;
const LOAD_MORE_COUNT = 200;

const normalizePhone = (phone: string) => phone.replace(/\D/g, '');

const ClientsPageComponent = () => {
    const [clients, setClients] = useState<Client[]>([]);
    const [incomeSources, setIncomeSources] = useState<IncomeSource[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [isAddClientOpen, setIsAddClientOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<Client | null>(null);
    const [deletingClient, setDeletingClient] = useState<Client | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const [aiFilters, setAiFilters] = useState<ClientFilters | null>(null);
    const [aiSearchQuery, setAiSearchQuery] = useState("");
    const [isAiSearching, setIsAiSearching] = useState(false);
    const { toast } = useToast();

    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Read state from URL
    const searchQuery = useMemo(() => searchParams.get('q') || "", [searchParams]);
    const sortParam = useMemo(() => searchParams.get('sort'), [searchParams]);

    const [localSearch, setLocalSearch] = useState(searchQuery);

    const [selectedClients, setSelectedClients] = useState<Record<string, boolean>>({});
    const [deletingSelected, setDeletingSelected] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [visibleCount, setVisibleCount] = useState(INITIAL_LOAD_COUNT);

    const [columnVisibility, setColumnVisibility] = useState({
        status: true,
        clientType: true,
        source: true,
        totalEarning: true,
        totalOrders: true,
        clientSince: true,
        lastOrder: true,
        social: true,
    });

    const [fromDate, setFromDate] = useState<{ month: number; year: number } | null>(() => {
        const fromM = searchParams.get('fromMonth');
        const fromY = searchParams.get('fromYear');
        if (fromM && fromY) return { month: parseInt(fromM), year: parseInt(fromY) };
        return null;
    });
    const [toDate, setToDate] = useState<{ month: number; year: number } | null>(() => {
        const toM = searchParams.get('toMonth');
        const toY = searchParams.get('toYear');
        if (toM && toY) return { month: parseInt(toM), year: parseInt(toY) };
        return null;
    });

    useEffect(() => {
        async function fetchData() {
            setIsLoading(true);
            setError(null);
            try {
                const [clientsRes, incomesRes] = await Promise.all([
                    fetch('/api/clients'),
                    fetch('/api/incomes')
                ]);

                if (!clientsRes.ok) {
                    throw new Error('Failed to fetch clients from the server.');
                }
                if (!incomesRes.ok) {
                    throw new Error('Failed to fetch income sources from the server.');
                }

                const clientsData = await clientsRes.json();
                const incomesData = await incomesRes.json();

                setClients(clientsData);
                setIncomeSources(incomesData);

            } catch (e) {
                console.error(e);
                setError('Could not connect to the database or fetch data. Please ensure the connection string in .env is correct and the server is running.');
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, []);

    useEffect(() => {
        setLocalSearch(searchQuery);
    }, [searchQuery]);

    const sortConfig = useMemo(() => {
        if (!sortParam) return { key: null, direction: 'ascending' as const };
        const [key, direction] = sortParam.split('_');
        return { key: key as keyof Client, direction: direction as 'ascending' | 'descending' };
    }, [sortParam]);

    const createQueryString = useCallback(
        (paramsToUpdate: Record<string, string | null>) => {
            const params = new URLSearchParams(searchParams.toString());
            for (const [name, value] of Object.entries(paramsToUpdate)) {
                if (value) {
                    params.set(name, value);
                } else {
                    params.delete(name);
                }
            }
            return params.toString();
        },
        [searchParams]
    );

    const updateUrlWithDate = (from: typeof fromDate, to: typeof toDate) => {
        router.push(`${pathname}?${createQueryString({
            fromMonth: from ? String(from.month) : null,
            fromYear: from ? String(from.year) : null,
            toMonth: to ? String(to.month) : null,
            toYear: to ? String(to.year) : null,
        })}`, { scroll: false });
    };

    useEffect(() => {
        const handler = setTimeout(() => {
            if (localSearch !== searchQuery) {
                router.push(`${pathname}?${createQueryString({ q: localSearch || null })}`);
            }
        }, 300);

        return () => {
            clearTimeout(handler);
        };
    }, [localSearch, searchQuery, router, pathname, createQueryString]);

    const handleAiSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!aiSearchQuery.trim()) return;

        setIsAiSearching(true);
        setLocalSearch("");
        router.push(`${pathname}?${createQueryString({ q: null })}`, { scroll: false });

        try {
            const filters = await filterClients(aiSearchQuery);
            setAiFilters(filters);
            toast({ title: "AI Filters Applied", description: `Showing clients based on your prompt.` });
        } catch (error) {
            console.error("AI search failed:", error);
            toast({
                variant: "destructive",
                title: "AI Search Failed",
                description: "Could not apply filters. Please try a different prompt.",
            });
        } finally {
            setIsAiSearching(false);
        }
    };

    const clearAiFilters = () => {
        setAiFilters(null);
        setAiSearchQuery("");
        toast({ title: "AI Filters Cleared" });
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLocalSearch(e.target.value);
        if (aiFilters) {
            clearAiFilters();
        }
    };

    const handleClientAdded = (newClient: Client) => {
        setClients(prevClients => [newClient, ...prevClients]);
    };

    const handleClientUpdated = (updatedClient: Client) => {
        setClients(prevClients =>
            prevClients.map(c => (c.id === updatedClient.id ? updatedClient : c))
        );
        setEditingClient(null);
    };

    const handleDeleteClient = async () => {
        if (!deletingClient) return;
        setIsDeleting(true);
        try {
            const response = await fetch(`/api/clients/${deletingClient.id}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to delete client');
            }
            setClients(prev => prev.filter(c => c.id !== deletingClient.id));
            toast({ title: "Client Deleted", description: `Client "${deletingClient.name || deletingClient.username}" has been removed.` });
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: (error as Error).message || "Could not delete client. Please try again.",
            });
        } finally {
            setIsDeleting(false);
            setDeletingClient(null);
        }
    };

    const handleDeleteSelectedClients = async () => {
        setIsSubmitting(true);
        const idsToDelete = Object.keys(selectedClients).filter(id => selectedClients[id]);
        try {
            const response = await fetch('/api/clients/bulk-delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ clientIds: idsToDelete }),
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error || 'Failed to delete selected clients');
            }
            setClients(prev => prev.filter(c => !idsToDelete.includes(c.id)));
            setSelectedClients({});
            toast({ title: 'Clients Deleted', description: result.message });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
        } finally {
            setIsSubmitting(false);
            setDeletingSelected(false);
        }
    };

    const requestSort = (key: keyof Client) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        const newSortParam = `${key}_${direction}`;
        router.push(`${pathname}?${createQueryString({ sort: newSortParam })}`);
    };

    const getSortIndicator = (key: keyof Client) => {
        if (sortConfig.key === key) {
            return <ArrowUpDown className="ml-2 h-4 w-4" />;
        }
        return <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />;
    };

    const [columnFilters, setColumnFilters] = useState<Record<string, Set<string>>>({
        status: new Set(),
        clientType: new Set(),
        source: new Set(),
    });

    // ... existing useEffects ...

    // Derive options for filters
    const filterOptions = useMemo(() => {
        const statuses = new Set<string>();
        const types = new Set<string>();
        const sources = new Set<string>();

        clients.forEach(client => {
            statuses.add(getClientStatus(client.lastOrder).text);
            if (client.clientType) types.add(client.clientType);
            if (client.source) sources.add(client.source);
        });

        return {
            status: Array.from(statuses).map(s => ({ label: s, value: s })),
            clientType: Array.from(types).map(t => ({ label: t, value: t })),
            source: Array.from(sources).map(s => ({ label: s, value: s })),
        };
    }, [clients]);

    const filteredClients = useMemo(() => {
        let clientsToFilter = [...clients];

        // Apply Column Filters
        if (columnFilters.status.size > 0) {
            clientsToFilter = clientsToFilter.filter(client => columnFilters.status.has(getClientStatus(client.lastOrder).text));
        }
        if (columnFilters.clientType.size > 0) {
            clientsToFilter = clientsToFilter.filter(client => columnFilters.clientType.has(client.clientType));
        }
        if (columnFilters.source.size > 0) {
            clientsToFilter = clientsToFilter.filter(client => columnFilters.source.has(client.source));
        }

        if (aiFilters) {
            // ... existing AI filter logic ...
            clientsToFilter = clientsToFilter.filter(client => {
                if (aiFilters.nameOrUsername && !`${client.name || ''} ${client.username}`.toLowerCase().includes(aiFilters.nameOrUsername.toLowerCase())) {
                    return false;
                }
                if (aiFilters.source && client.source.toLowerCase() !== aiFilters.source.toLowerCase()) {
                    return false;
                }
                if (aiFilters.clientType && client.clientType !== aiFilters.clientType) {
                    return false;
                }
                if (aiFilters.isVip !== undefined && client.isVip !== aiFilters.isVip) {
                    return false;
                }
                if (aiFilters.minTotalOrders !== undefined && client.totalOrders < aiFilters.minTotalOrders) {
                    return false;
                }
                if (aiFilters.dateRange) {
                    if (client.lastOrder === 'N/A') return false;
                    const clientDate = new Date(client.lastOrder.replace(/-/g, '/'));

                    if (aiFilters.dateRange.from) {
                        const fromDate = new Date(aiFilters.dateRange.from.replace(/-/g, '/'));
                        if (clientDate < fromDate) return false;
                    }
                    if (aiFilters.dateRange.to) {
                        const toDate = new Date(aiFilters.dateRange.to.replace(/-/g, '/'));
                        if (clientDate > toDate) return false;
                    }
                }
                return true;
            });
        } else {
            // ... existing manual filter logic ...
            if (fromDate || toDate) {
                clientsToFilter = clientsToFilter.filter(client => {
                    if (client.lastOrder === 'N/A') return false;
                    const lastOrderDate = new Date(client.lastOrder.replace(/-/g, '/'));

                    if (fromDate) {
                        const filterFromDate = new Date(fromDate.year, fromDate.month - 1, 1);
                        if (lastOrderDate < filterFromDate) return false;
                    }
                    if (toDate) {
                        const filterToDate = new Date(toDate.year, toDate.month, 0); // Last day of month
                        if (lastOrderDate > filterToDate) return false;
                    }
                    return true;
                });
            }
            if (searchQuery) {
                const lowercasedQuery = searchQuery.toLowerCase();
                clientsToFilter = clientsToFilter.filter(client =>
                    (client.name || '').toLowerCase().includes(lowercasedQuery) ||
                    client.username.toLowerCase().includes(lowercasedQuery) ||
                    (client.notes || '').toLowerCase().includes(lowercasedQuery) ||
                    (client.tags || []).some(tag => tag.toLowerCase().includes(lowercasedQuery)) ||
                    (client.socialLinks || []).some(link => link.url.toLowerCase().includes(lowercasedQuery) || link.platform.toLowerCase().includes(lowercasedQuery)) ||
                    (client.emails || []).some(e => e.value.toLowerCase().includes(lowercasedQuery)) ||
                    (client.phoneNumbers || []).some(p => {
                        const normalizedQuery = normalizePhone(lowercasedQuery);
                        return normalizedQuery && normalizePhone(p.value).includes(normalizedQuery);
                    }) ||
                    (client.addresses || []).some(a => a.value.toLowerCase().includes(lowercasedQuery)) ||
                    (client.country || '').toLowerCase().includes(lowercasedQuery)
                );
            }
        }

        return clientsToFilter;
    }, [clients, fromDate, toDate, searchQuery, aiFilters, columnFilters]);


    const sortedClients = useMemo(() => {
        let sortableItems = [...filteredClients];
        if (sortConfig.key) {
            const key = sortConfig.key;
            sortableItems.sort((a, b) => {
                let aValue: any, bValue: any;

                if (key === 'name') {
                    aValue = a.name || a.username;
                    bValue = b.name || b.username;
                } else if (key === 'lastOrder' || key === 'clientSince') {
                    aValue = a[key] === 'N/A' ? 0 : new Date(a[key]!).getTime();
                    bValue = b[key] === 'N/A' ? 0 : new Date(b[key]!).getTime();
                }
                else {
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

    const activeFilterCount = useMemo(() => {
        if (!aiFilters) return 0;
        return Object.values(aiFilters).filter(v => v !== undefined && v !== null && v !== "" && !(typeof v === 'object' && Object.keys(v).length === 0)).length;
    }, [aiFilters]);

    const numSelected = Object.values(selectedClients).filter(Boolean).length;
    const visibleClients = useMemo(() => sortedClients.slice(0, visibleCount), [sortedClients, visibleCount]);

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-64 w-full" />
                </div>
            );
        }

        return (
            <ClientsTable
                clients={visibleClients}
                requestSort={requestSort}
                getSortIndicator={getSortIndicator}
                onEdit={(client) => setEditingClient(client)}
                onDelete={(client) => setDeletingClient(client)}
                columnVisibility={columnVisibility}
                selectedClients={selectedClients}
                onSelectionChange={setSelectedClients}
                searchQuery={localSearch}
                columnFilters={columnFilters}
                onColumnFilterChange={setColumnFilters}
                filterOptions={filterOptions}
            />
        )
    }

    return (
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
            <div className="flex items-center">
                <h1 className="font-headline text-lg font-semibold md:text-2xl">
                    Clients
                </h1>
                <div className="ml-auto flex flex-wrap items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search clients..."
                            className="pl-8 sm:w-[200px] md:w-[250px]"
                            value={localSearch}
                            onChange={handleSearchChange}
                        />
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline">
                                Columns <ChevronDown className="ml-2 h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {Object.entries({
                                status: "Status",
                                clientType: "Type",
                                source: "Source",
                                totalEarning: "Earning",
                                totalOrders: "Orders",
                                clientSince: "Client Since",
                                lastOrder: "Last Order",
                                social: "Social",
                            }).map(([key, label]) => (
                                <DropdownMenuCheckboxItem
                                    key={key}
                                    className="capitalize"
                                    checked={columnVisibility[key as keyof typeof columnVisibility]}
                                    onCheckedChange={(value) =>
                                        setColumnVisibility((prev) => ({
                                            ...prev,
                                            [key]: !!value,
                                        }))
                                    }
                                >
                                    {label}
                                </DropdownMenuCheckboxItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <div className="flex items-center gap-2">
                        <MonthYearPicker date={fromDate} setDate={(d) => { setFromDate(d); updateUrlWithDate(d, toDate); }} label="From" />
                        <MonthYearPicker date={toDate} setDate={(d) => { setToDate(d); updateUrlWithDate(fromDate, d); }} label="To" />
                    </div>
                    <AddClientDialog
                        open={isAddClientOpen}
                        onOpenChange={setIsAddClientOpen}
                        onClientAdded={handleClientAdded}
                        incomeSources={incomeSources.map(s => s.name)}
                    >
                        <Button>Add New Client</Button>
                    </AddClientDialog>
                </div>
            </div>

            {error && (
                <Alert variant="destructive">
                    <Database className="h-4 w-4" />
                    <AlertTitle>Database Connection Error</AlertTitle>
                    <AlertDescription>
                        {error}
                    </AlertDescription>
                </Alert>
            )}

            <div className="space-y-4 rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
                <form onSubmit={handleAiSearch} className="flex gap-2">
                    <div className="relative flex-grow">
                        <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                        <Input
                            type="text"
                            placeholder="Ask AI to filter clients... (e.g., 'show me VIP clients from last year')"
                            className="pl-9"
                            value={aiSearchQuery}
                            onChange={e => setAiSearchQuery(e.target.value)}
                            disabled={isAiSearching}
                        />
                    </div>
                    <Button type="submit" disabled={isAiSearching || !aiSearchQuery.trim()}>
                        {isAiSearching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Ask AI"}
                    </Button>
                </form>
                {aiFilters && (
                    <div className="flex items-center gap-4">
                        <div className="text-sm font-medium">
                            Active AI Filters ({activeFilterCount}):
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {Object.entries(aiFilters).map(([key, value]) => {
                                if (value === undefined || value === null || value === "" || (typeof value === 'object' && Object.keys(value).length === 0)) return null;
                                let displayValue = "";
                                if (key === 'dateRange') {
                                    const { from, to } = value as { from?: string, to?: string };
                                    if (from && to) displayValue = `${from} to ${to}`;
                                    else if (from) displayValue = `from ${from}`;
                                    else if (to) displayValue = `until ${to}`;
                                } else if (typeof value === 'boolean') {
                                    displayValue = value ? "Yes" : "No";
                                } else {
                                    displayValue = String(value);
                                }

                                return (
                                    <div key={key} className="flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
                                        <strong>{key.replace(/([A-Z])/g, ' $1')}:</strong> {displayValue}
                                    </div>
                                )
                            })}
                        </div>
                        <Button variant="ghost" size="sm" onClick={clearAiFilters} className="ml-auto">
                            <X className="mr-2 h-4 w-4" />
                            Clear Filters
                        </Button>
                    </div>
                )}
            </div>

            {numSelected > 0 && (
                <div className="flex items-center gap-4 rounded-lg border bg-card p-3 px-4 shadow-sm">
                    <p className="text-sm font-medium">{numSelected} client{numSelected > 1 ? 's' : ''} selected</p>
                    <Button variant="destructive" size="sm" onClick={() => setDeletingSelected(true)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Selected
                    </Button>
                </div>
            )}

            <div className="space-y-4">
                {renderContent()}
                {visibleCount < sortedClients.length && (
                    <div className="text-center">
                        <Button
                            variant="outline"
                            onClick={() => setVisibleCount(prev => prev + LOAD_MORE_COUNT)}
                        >
                            Load More ({sortedClients.length - visibleCount} remaining)
                        </Button>
                    </div>
                )}
            </div>

            {editingClient && (
                <EditClientDialog
                    open={!!editingClient}
                    onOpenChange={(isOpen) => !isOpen && setEditingClient(null)}
                    client={editingClient}
                    onClientUpdated={handleClientUpdated}
                    incomeSources={incomeSources.map(s => s.name)}
                />
            )}

            <AlertDialog open={!!deletingClient} onOpenChange={() => setDeletingClient(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the client "{deletingClient?.name || deletingClient?.username}" and all of their associated data. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteClient} disabled={isDeleting} className={cn(buttonVariants({ variant: "destructive" }))}>
                            {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={deletingSelected} onOpenChange={setDeletingSelected}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete {numSelected} Clients?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action is permanent and cannot be undone. Are you sure you want to delete the selected clients and all their associated data?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteSelectedClients} className={cn(buttonVariants({ variant: "destructive" }))} disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Delete Selected"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </main>
    );
}

const MemoizedClientsPage = memo(ClientsPageComponent);

export default function ClientsPage() {
    return <MemoizedClientsPage />;
}
