
"use client";

import { useState, useMemo, useCallback, useEffect, memo } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ArrowUpDown, Search, Sparkles, X, ChevronDown, Database, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { initialClients as staticClients, incomeSources, type Client } from "@/lib/data/clients-data";
import { AddClientDialog } from "@/components/clients/add-client-dialog";
import { ClientsTable } from "@/components/clients/clients-table";
import { EditClientDialog } from "@/components/clients/edit-client-dialog";
import { filterClients, type ClientFilters } from "@/ai/flows/filter-clients-flow";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


const ClientsPageComponent = () => {
    const [clients, setClients] = useState<Client[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [isAddClientOpen, setIsAddClientOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<Client | null>(null);
    const [aiFilters, setAiFilters] = useState<ClientFilters | null>(null);
    const [aiSearchQuery, setAiSearchQuery] = useState("");
    const [isAiSearching, setIsAiSearching] = useState(false);
    const { toast } = useToast();
    
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Read state from URL
    const searchQuery = useMemo(() => searchParams.get('q') || "", [searchParams]);
    const filterSource = useMemo(() => searchParams.get('source') || "all", [searchParams]);
    const sortParam = useMemo(() => searchParams.get('sort'), [searchParams]);

    const [localSearch, setLocalSearch] = useState(searchQuery);

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
    
    useEffect(() => {
        async function fetchClients() {
            setIsLoading(true);
            setError(null);
            try {
                const response = await fetch('/api/clients');
                if (!response.ok) {
                    throw new Error('Failed to fetch clients from the server.');
                }
                const data = await response.json();
                setClients(data);
            } catch (e) {
                console.error(e);
                setError('Could not connect to the database. Please ensure the connection string in .env is correct and the server is running.');
                setClients(staticClients as Client[]); // Fallback to static data on error
            } finally {
                setIsLoading(false);
            }
        }
        fetchClients();
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
        // Clear manual search and its query param when AI search is used
        setLocalSearch(""); 
        router.push(`${pathname}?${createQueryString({ q: null, source: filterSource === 'all' ? null : filterSource })}`, { scroll: false });

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
    
    const handleFilterChange = (value: string) => {
        router.push(`${pathname}?${createQueryString({ source: value === 'all' ? null : value })}`);
        if (aiFilters) {
          clearAiFilters();
        }
    };

    const handleClientAdded = (newClient: Client) => {
        setClients(prevClients => [newClient, ...prevClients]);
    };

    const handleClientUpdated = (updatedClient: Client) => {
        // In a real app, this would also post to the server
        setClients(prevClients => 
            prevClients.map(c => (c.id === updatedClient.id ? updatedClient : c))
        );
        setEditingClient(null);
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

    const filteredClients = useMemo(() => {
        let clientsToFilter = [...clients];

        if (aiFilters) {
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
            // Manual filters apply only if AI filters are not active
            if (filterSource !== 'all') {
                clientsToFilter = clientsToFilter.filter(client => client.source.toLowerCase().replace(/\s+/g, '-') === filterSource);
            }
            if (searchQuery) {
                const lowercasedQuery = searchQuery.toLowerCase();
                clientsToFilter = clientsToFilter.filter(client => 
                    (client.name || '').toLowerCase().includes(lowercasedQuery) ||
                    client.username.toLowerCase().includes(lowercasedQuery)
                );
            }
        }

        return clientsToFilter;
    }, [clients, filterSource, searchQuery, aiFilters]);


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
                clients={sortedClients}
                requestSort={requestSort}
                getSortIndicator={getSortIndicator}
                onEdit={(client) => setEditingClient(client)}
                columnVisibility={columnVisibility}
            />
        )
    }

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center">
        <h1 className="font-headline text-lg font-semibold md:text-2xl">
          Clients
        </h1>
        <div className="ml-auto flex items-center gap-2">
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
          <Select value={filterSource} onValueChange={handleFilterChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              {incomeSources.map(source => <SelectItem key={source} value={source.toLowerCase().replace(/\s+/g, '-')}>{source}</SelectItem>)}
            </SelectContent>
          </Select>
          <AddClientDialog open={isAddClientOpen} onOpenChange={setIsAddClientOpen} onClientAdded={handleClientAdded}>
            <Button>Add New Client</Button>
          </AddClientDialog>
        </div>
      </div>

       {error && (
            <Alert variant="destructive">
                <Database className="h-4 w-4" />
                <AlertTitle>Database Connection Error</AlertTitle>
                <AlertDescription>
                    {error} Using fallback data.
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
                            const { from, to } = value as {from?: string, to?: string};
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

      {renderContent()}

      {editingClient && (
        <EditClientDialog
          open={!!editingClient}
          onOpenChange={(isOpen) => !isOpen && setEditingClient(null)}
          client={editingClient}
          onClientUpdated={handleClientUpdated}
        />
      )}
    </main>
  );
}

const MemoizedClientsPage = memo(ClientsPageComponent);

export default function ClientsPage() {
  return <MemoizedClientsPage />;
}
