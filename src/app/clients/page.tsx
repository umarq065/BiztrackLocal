
"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ArrowUpDown, Search } from "lucide-react";
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


export default function ClientsPage() {
    const [clients, setClients] = useState<Client[]>(initialClients);
    const [open, setOpen] = useState(false);
    
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Read state from URL
    const searchQuery = searchParams.get('q') || "";
    const filterSource = searchParams.get('source') || "all";
    const sortParam = searchParams.get('sort');

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

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        router.push(`${pathname}?${createQueryString({ q: e.target.value || null })}`);
    };
    
    const handleFilterChange = (value: string) => {
        router.push(`${pathname}?${createQueryString({ source: value === 'all' ? null : value })}`);
    };

    const handleClientAdded = (newClient: Client) => {
        setClients([newClient, ...clients]);
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

        return clientsToFilter;
    }, [clients, filterSource, searchQuery]);

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
            <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Search clients..."
                    className="pl-8 sm:w-[200px] md:w-[250px]"
                    value={searchQuery}
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
      
      <ClientsTable 
        clients={sortedClients}
        requestSort={requestSort}
        getSortIndicator={getSortIndicator}
      />
    </main>
  );
}
