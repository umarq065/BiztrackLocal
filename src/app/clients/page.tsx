"use client";

import { useState, useMemo } from "react";
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
    const [searchQuery, setSearchQuery] = useState("");
    const [filterSource, setFilterSource] = useState('all');
    const [sortConfig, setSortConfig] = useState<{ key: keyof Client | null; direction: 'ascending' | 'descending' }>({ key: null, direction: 'ascending' });
    
    const handleClientAdded = (newClient: Client) => {
        setClients([newClient, ...clients]);
    };

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
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
          <Select value={filterSource} onValueChange={setFilterSource}>
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