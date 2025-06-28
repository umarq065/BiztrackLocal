"use client";

import NProgressLink from "@/components/layout/nprogress-link";
import { MoreHorizontal, Edit, Trash2, Globe, Facebook, Twitter, Linkedin, Github } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { Client } from "@/lib/data/clients-data";
import { socialPlatforms } from "@/lib/data/clients-data";

interface ClientsTableProps {
    clients: Client[];
    requestSort: (key: keyof Client) => void;
    getSortIndicator: (key: keyof Client) => React.ReactNode;
}

const SocialIcon = ({ platform }: { platform: string }) => {
    const platformConfig = socialPlatforms.find(p => p.value === platform);
    if (!platformConfig) return <Globe className="h-5 w-5 text-muted-foreground" />;
    const Icon = platformConfig.icon;
    return <Icon className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />;
};

export function ClientsTable({ clients, requestSort, getSortIndicator }: ClientsTableProps) {
    return (
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
                        {clients.length > 0 ? (clients.map((client) => (
                            <TableRow key={client.id}>
                                <TableCell>
                                    <NProgressLink href={`/clients/${client.id}`} className="flex items-center gap-3">
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage src={`https://placehold.co/100x100.png?text=${(client.name || client.username).charAt(0)}`} alt="Avatar" data-ai-hint="avatar person" />
                                            <AvatarFallback>{(client.name || client.username).charAt(0).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <div className="font-medium hover:underline">{client.name || client.username}</div>
                                            <div className="text-sm text-muted-foreground">@{client.username}</div>
                                        </div>
                                    </NProgressLink>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={client.clientType === 'New' ? 'secondary' : 'default'}>{client.clientType}</Badge>
                                </TableCell>
                                <TableCell>
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
                                </TableCell>
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
                        ))) : (
                            <TableRow>
                                <TableCell colSpan={9} className="h-24 text-center">
                                    No clients found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
