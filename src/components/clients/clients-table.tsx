
"use client";

import { memo } from "react";
import { MoreHorizontal, Edit, Trash2, Globe, Facebook, Twitter, Linkedin, Github, Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { Client } from "@/lib/data/clients-data";
import { socialPlatforms, getClientStatus } from "@/lib/data/clients-data";
import { cn } from "@/lib/utils";
import NProgressLink from "../layout/nprogress-link";
import { Checkbox } from "../ui/checkbox";

interface ClientsTableProps {
    clients: Client[];
    requestSort: (key: keyof Client) => void;
    getSortIndicator: (key: keyof Client) => React.ReactNode;
    onEdit: (client: Client) => void;
    onDelete: (client: Client) => void;
    columnVisibility: Record<string, boolean>;
    selectedClients: Record<string, boolean>;
    onSelectionChange: (selection: Record<string, boolean>) => void;
    searchQuery?: string;
}

const SocialIcon = ({ platform, isMatch }: { platform: string, isMatch?: boolean }) => {
    const platformConfig = socialPlatforms.find(p => p.value === platform);
    if (!platformConfig) return <Globe className={cn("h-5 w-5", isMatch ? "text-primary animate-pulse" : "text-muted-foreground")} />;
    const Icon = platformConfig.icon;
    return <Icon className={cn("h-5 w-5 transition-colors", isMatch ? "text-primary animate-pulse scale-110" : "text-muted-foreground hover:text-foreground")} />;
};

const normalizePhone = (phone: string) => phone.replace(/\D/g, '');

const ClientsTableComponent = ({ clients, requestSort, getSortIndicator, onEdit, onDelete, columnVisibility, selectedClients, onSelectionChange, searchQuery = "" }: ClientsTableProps) => {

    const handleSelectAll = (checked: boolean) => {
        const newSelection: Record<string, boolean> = {};
        if (checked) {
            clients.forEach(client => newSelection[client.id] = true);
        }
        onSelectionChange(newSelection);
    };

    const handleRowSelect = (clientId: string, checked: boolean) => {
        const newSelection = { ...selectedClients };
        if (checked) {
            newSelection[clientId] = true;
        } else {
            delete newSelection[clientId];
        }
        onSelectionChange(newSelection);
    };

    const isAllSelected = clients.length > 0 && clients.every(client => selectedClients[client.id]);
    const isSomeSelected = clients.length > 0 && clients.some(client => selectedClients[client.id]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Client List</CardTitle>
                <CardDescription>A sortable and customizable list of all your clients.</CardDescription>
            </CardHeader>
            <CardContent>
                <TooltipProvider>
                    <div className="overflow-x-auto">
                        <Table className="min-w-full">
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-12">
                                        <Checkbox
                                            checked={isAllSelected}
                                            onCheckedChange={(checked) => handleSelectAll(!!checked)}
                                            aria-label="Select all"
                                            data-indeterminate={isSomeSelected && !isAllSelected}
                                        />
                                    </TableHead>
                                    <TableHead className="w-[250px]">
                                        <Button variant="ghost" onClick={() => requestSort('name')}>
                                            Client {getSortIndicator('name')}
                                        </Button>
                                    </TableHead>
                                    {columnVisibility.status && <TableHead>Status</TableHead>}
                                    {columnVisibility.clientType && <TableHead>
                                        <Button variant="ghost" onClick={() => requestSort('clientType')}>
                                            Type {getSortIndicator('clientType')}
                                        </Button>
                                    </TableHead>}
                                    {columnVisibility.source && <TableHead>
                                        <Button variant="ghost" onClick={() => requestSort('source')}>
                                            Source {getSortIndicator('source')}
                                        </Button>
                                    </TableHead>}
                                    {columnVisibility.totalEarning && <TableHead className="text-right">
                                        <Button variant="ghost" onClick={() => requestSort('totalEarning')}>
                                            Earning {getSortIndicator('totalEarning')}
                                        </Button>
                                    </TableHead>}
                                    {columnVisibility.totalOrders && <TableHead className="text-right">
                                        <Button variant="ghost" onClick={() => requestSort('totalOrders')}>
                                            Orders {getSortIndicator('totalOrders')}
                                        </Button>
                                    </TableHead>}
                                    {columnVisibility.clientSince && <TableHead>
                                        <Button variant="ghost" onClick={() => requestSort('clientSince')}>
                                            Client Since {getSortIndicator('clientSince')}
                                        </Button>
                                    </TableHead>}
                                    {columnVisibility.lastOrder && <TableHead>
                                        <Button variant="ghost" onClick={() => requestSort('lastOrder')}>
                                            Last Order {getSortIndicator('lastOrder')}
                                        </Button>
                                    </TableHead>}
                                    {columnVisibility.social && <TableHead className="w-24">Social</TableHead>}
                                    <TableHead className="text-right w-24">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {clients.length > 0 ? (clients.map((client) => {
                                    const status = getClientStatus(client.lastOrder);
                                    const lowerQuery = searchQuery.toLowerCase();

                                    // Check for matches
                                    const matchesNotes = searchQuery && (client.notes || '').toLowerCase().includes(lowerQuery);
                                    const matchesEmail = searchQuery && (client.emails || []).find(e => e.value.toLowerCase().includes(lowerQuery));
                                    const matchesPhone = searchQuery && (client.phoneNumbers || []).find(p => normalizePhone(p.value).includes(normalizePhone(lowerQuery)));
                                    const matchesAddress = searchQuery && (client.addresses || []).find(a => a.value.toLowerCase().includes(lowerQuery));
                                    const matchesCountry = searchQuery && (client.country || '').toLowerCase().includes(lowerQuery);

                                    return (
                                        <TableRow
                                            key={client.id}
                                            className="cursor-pointer"
                                            data-state={selectedClients[client.id] && 'selected'}
                                        >
                                            <TableCell onClick={(e) => e.stopPropagation()}>
                                                <Checkbox
                                                    checked={!!selectedClients[client.id]}
                                                    onCheckedChange={(checked) => handleRowSelect(client.id, !!checked)}
                                                    aria-label={`Select client ${client.name || client.username}`}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <NProgressLink href={`/clients/${client.username}`}>
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-10 w-10">
                                                            <AvatarImage src={client.avatarUrl || `https://placehold.co/100x100.png?text=${(client.name || client.username).charAt(0)}`} alt="Avatar" data-ai-hint="avatar person" />
                                                            <AvatarFallback>{(client.name || client.username).charAt(0).toUpperCase()}</AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-medium hover:underline">{client.name || client.username}</span>
                                                                {client.isVip && (
                                                                    <Tooltip>
                                                                        <TooltipTrigger>
                                                                            <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                                                                        </TooltipTrigger>
                                                                        <TooltipContent><p>VIP Client</p></TooltipContent>
                                                                    </Tooltip>
                                                                )}
                                                            </div>
                                                            <div className="text-sm text-muted-foreground">@{client.username}</div>

                                                            {/* Search Match Indicators */}
                                                            {searchQuery && (
                                                                <div className="flex flex-wrap gap-1 mt-1">
                                                                    {matchesNotes && (
                                                                        <Badge variant="outline" className="text-[10px] px-1 py-0 h-auto border-yellow-500/50 text-yellow-600 bg-yellow-500/10">
                                                                            Matches Notes
                                                                        </Badge>
                                                                    )}
                                                                    {matchesEmail && (
                                                                        <Badge variant="outline" className="text-[10px] px-1 py-0 h-auto border-blue-500/50 text-blue-600 bg-blue-500/10">
                                                                            Email: {matchesEmail.value}
                                                                        </Badge>
                                                                    )}
                                                                    {matchesPhone && (
                                                                        <Badge variant="outline" className="text-[10px] px-1 py-0 h-auto border-green-500/50 text-green-600 bg-green-500/10">
                                                                            Phone: {matchesPhone.value}
                                                                        </Badge>
                                                                    )}
                                                                    {matchesAddress && (
                                                                        <Badge variant="outline" className="text-[10px] px-1 py-0 h-auto border-purple-500/50 text-purple-600 bg-purple-500/10">
                                                                            Address: {matchesAddress.value.substring(0, 15)}...
                                                                        </Badge>
                                                                    )}
                                                                    {matchesCountry && (
                                                                        <Badge variant="outline" className="text-[10px] px-1 py-0 h-auto border-orange-500/50 text-orange-600 bg-orange-500/10">
                                                                            Country: {client.country}
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </NProgressLink>
                                            </TableCell>
                                            {columnVisibility.status && <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <span className={cn("h-2.5 w-2.5 rounded-full", status.color)} />
                                                    <span>{status.text}</span>
                                                </div>
                                            </TableCell>}
                                            {columnVisibility.clientType && <TableCell>
                                                <Badge variant={client.clientType === 'New' ? 'secondary' : 'default'}>{client.clientType}</Badge>
                                            </TableCell>}
                                            {columnVisibility.source && <TableCell>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <span className="inline-block max-w-[120px] truncate">
                                                            {client.source}
                                                        </span>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>{client.source}</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TableCell>}
                                            {columnVisibility.totalEarning && <TableCell className="text-right">${client.totalEarning.toLocaleString()}</TableCell>}
                                            {columnVisibility.totalOrders && <TableCell className="text-right">{client.totalOrders}</TableCell>}
                                            {columnVisibility.clientSince && <TableCell>{client.clientSince}</TableCell>}
                                            {columnVisibility.lastOrder && <TableCell>{client.lastOrder}</TableCell>}
                                            {columnVisibility.social && <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {client.socialLinks?.map((link, i) => {
                                                        const isMatch = searchQuery && (link.url.toLowerCase().includes(searchQuery.toLowerCase()) || link.platform.toLowerCase().includes(searchQuery.toLowerCase()));
                                                        return (
                                                            <Tooltip key={i}>
                                                                <TooltipTrigger asChild>
                                                                    <a href={link.url} target="_blank" rel="noreferrer noopener" aria-label={link.platform} onClick={(e) => e.stopPropagation()}>
                                                                        <SocialIcon platform={link.platform} isMatch={!!isMatch} />
                                                                    </a>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>{link.platform}{isMatch ? " (Match)" : ""}</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        )
                                                    })}
                                                </div>
                                            </TableCell>}
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button aria-haspopup="true" size="icon" variant="ghost" onClick={(e) => e.stopPropagation()}>
                                                            <MoreHorizontal className="h-4 w-4" />
                                                            <span className="sr-only">Toggle menu</span>
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(client); }}>
                                                            <Edit className="mr-2 h-4 w-4" />
                                                            Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={(e) => { e.stopPropagation(); onDelete(client); }}>
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    )
                                }
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={Object.values(columnVisibility).filter(Boolean).length + 3} className="h-24 text-center">
                                            <h3 className="font-semibold">No clients found</h3>
                                            <p className="text-sm text-muted-foreground">Try adjusting your search or filter to find what you're looking for.</p>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </TooltipProvider>
            </CardContent>
        </Card>
    );
}

export const ClientsTable = memo(ClientsTableComponent);
