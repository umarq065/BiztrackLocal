
"use client";

import { useState, useMemo, useCallback, useEffect, memo } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ArrowUpDown, Search, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { initialClients, incomeSources, type Client } from "@/lib/data/clients-data";
import { AddClientDialog } from "@/components/clients/add-client-dialog";
import { ClientsTable } from "@/components/clients/clients-table";
import { EditClientDialog } from "@/components/clients/edit-client-dialog";
import { filterClients, type ClientFilters } from "@/ai/flows/filter-clients-flow";
import { useToast } from "@/hooks/use-toast";


const ClientsPageComponent = () => {
    const [clients, setClients] = useState<Client[]>(initialClients);
    const [open, setOpen] = useState(false);
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
    };
    
    const handleFilterChange = (value: string) => {
        router.push(`${pathname}?${createQueryString({ source: value === 'all' ? null : value })}`);
    };

    const handleClientAdded = (newClient: Client) => {
        setClients([newClient, ...clients]);
    };

    const handleClientUpdated = (updatedClient: Client) => {
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
            if (aiFilters.nameOrUsername) {
                const lowerQuery = aiFilters.nameOrUsername.toLowerCase();
                clientsToFilter = clientsToFilter.filter(c =>
                    c.name?.toLowerCase().includes(lowerQuery) || c.username.toLowerCase().includes(lowerQuery)
                );
            }
            if (aiFilters.source) {
                 clientsToFilter = clientsToFilter.filter(c => c.source === aiFilters.source);
            }
            if (aiFilters.clientType) {
                 clientsToFilter = clientsToFilter.filter(c => c.clientType === aiFilters.clientType);
            }
            if (aiFilters.isVip !== undefined) {
                 clientsToFilter = clientsToFilter.filter(c => c.isVip === aiFilters.isVip);
            }
            if (aiFilters.minTotalOrders) {
                clientsToFilter = clientsToFilter.filter(c => c.totalOrders >= aiFilters.minTotalOrders!);
            }
            if (aiFilters.dateRange?.from) {
                const fromDate = new Date(`${aiFilters.dateRange.from}T00:00:00Z`);
                clientsToFilter = clientsToFilter.filter(c => c.lastOrder !== 'N/A' && new Date(c.lastOrder) >= fromDate);
            }
            if (aiFilters.dateRange?.to) {
                const toDate = new Date(`${aiFilters.dateRange.to}T23:59:59Z`);
                clientsToFilter = clientsToFilter.filter(c => c.lastOrder !== 'N/A' && new Date(c.lastOrder) <= toDate);
            }
        } else {
             if (filterSource !== 'all') {
                clientsToFilter = clientsToFilter.filter(client => client.source.toLowerCase().replace(/\s+/g, '-') === filterSource);
            }

            if (searchQuery.trim() !== "") {
                const lowercasedQuery = searchQuery.toLowerCase();
                clientsToFilter = clientsToFilter.filter(client => 
                    client.name?.toLowerCase().includes(lowercasedQuery) ||
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
          <Select value={filterSource} onValueChange={handleFilterChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              {incomeSources.map(source => <SelectItem key={source} value={source.toLowerCase().replace(/\s+/g, '-')}>{source}</SelectItem>)}
            </SelectContent>
          </Select>
          <AddClientDialog open={open} onOpenChange={setOpen} onClientAdded={handleClientAdded}>
            <Button>Add New Client</Button>
          </AddClientDialog>
        </div>
      </div>
      
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
                {isAiSearching ? "Searching..." : "Ask AI"}
            </Button>
        </form>
         {aiFilters && (
            <div className="flex items-center gap-4">
                <div className="text-sm font-medium">
                    Active AI Filters ({activeFilterCount}):
                </div>
                <div className="flex flex-wrap gap-2">
                    {Object.entries(aiFilters).map(([key, value]) => {
                        if (!value || (typeof value === 'object' && Object.keys(value).length === 0)) return null;
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

      <ClientsTable 
        clients={sortedClients}
        requestSort={requestSort}
        getSortIndicator={getSortIndicator}
        onEdit={(client) => setEditingClient(client)}
      />

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
