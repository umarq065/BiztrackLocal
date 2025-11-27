
"use client";

import { memo } from "react";
import { format } from "date-fns";
import { MoreHorizontal, Star, Edit, Trash2, ArrowUpDown, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import type { Order } from "@/lib/data/orders-data";
import NProgressLink from "../layout/nprogress-link";

const StarDisplay = ({ rating }: { rating?: number | null }) => {
    if (rating === undefined || rating === null) return <span className="text-muted-foreground">N/A</span>;
    return (
        <div className="flex items-center gap-1">
            <Star className="h-4 w-4 text-primary fill-current" />
            <span>{rating.toFixed(1)}</span>
        </div>
    );
};

interface OrdersTableProps {
    orders: (Order & { dateObj: Date })[];
    onEdit: (order: Order) => void;
    onDelete: (order: Order) => void;
    requestSort: (key: keyof Order) => void;
    sortConfig: { key: keyof Order | null; direction: 'ascending' | 'descending' };
    selectedOrders: Record<string, boolean>;
    onSelectionChange: (selection: Record<string, boolean>) => void;
}

const OrdersTableComponent = ({ orders, onEdit, onDelete, requestSort, sortConfig, selectedOrders, onSelectionChange }: OrdersTableProps) => {

    const getSortIndicator = (key: keyof Order) => {
        if (sortConfig.key === key) {
            return sortConfig.direction === 'ascending' ? <ArrowUpDown className="ml-2 h-4 w-4" /> : <ArrowUpDown className="ml-2 h-4 w-4" />;
        }
        return <ArrowUpDown className="ml-2 h-4 w-4 opacity-30" />;
    };

    const handleSelectAll = (checked: boolean) => {
        const newSelection: Record<string, boolean> = {};
        if (checked) {
            orders.forEach(order => newSelection[order.id] = true);
        }
        onSelectionChange(newSelection);
    };

    const handleRowSelect = (orderId: string, checked: boolean) => {
        const newSelection = { ...selectedOrders };
        if (checked) {
            newSelection[orderId] = true;
        } else {
            delete newSelection[orderId];
        }
        onSelectionChange(newSelection);
    };

    const isAllSelected = orders.length > 0 && orders.every(order => selectedOrders[order.id]);
    const isSomeSelected = orders.length > 0 && orders.some(order => selectedOrders[order.id]);

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className="w-12">
                        <Checkbox
                            checked={isAllSelected ? true : (isSomeSelected ? "indeterminate" : false)}
                            onCheckedChange={(checked) => handleSelectAll(!!checked)}
                            aria-label="Select all"
                        />
                    </TableHead>
                    <TableHead>Client Username</TableHead>
                    <TableHead>Order ID</TableHead>
                    <TableHead className="text-right">
                        <Button variant="ghost" onClick={() => requestSort('amount')} className="justify-end w-full -mr-4">
                            Price {getSortIndicator('amount')}
                        </Button>
                    </TableHead>
                    <TableHead>
                        <Button variant="ghost" onClick={() => requestSort('date')} className="-ml-4">
                            Date {getSortIndicator('date')}
                        </Button>
                    </TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Gig Name</TableHead>
                    <TableHead>
                        <Button variant="ghost" onClick={() => requestSort('rating')} className="-ml-4">
                            Rating {getSortIndicator('rating')}
                        </Button>
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {orders.length > 0 ? (
                    orders.map((order) => (
                        <TableRow
                            key={order.id}
                            data-state={selectedOrders[order.id] && 'selected'}
                            className="hover:bg-muted/50 dark:hover:bg-white/5 data-[state=selected]:bg-muted dark:data-[state=selected]:bg-white/10 border-border/50 dark:border-white/5"
                        >
                            <TableCell>
                                <Checkbox
                                    checked={!!selectedOrders[order.id]}
                                    onCheckedChange={(checked) => handleRowSelect(order.id, !!checked)}
                                    aria-label={`Select order ${order.id}`}
                                />
                            </TableCell>
                            <TableCell>
                                <NProgressLink href={`/clients/${order.clientUsername}`} className="font-medium hover:underline">
                                    {order.clientUsername}
                                </NProgressLink>
                            </TableCell>
                            <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                    <a
                                        href={`https://www.fiverr.com/orders/${order.id}/activities`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="hover:underline text-primary"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {order.id}
                                    </a>
                                    <NProgressLink
                                        href={`/orders/${order.id}`}
                                        className="text-muted-foreground hover:text-primary transition-colors p-1 hover:bg-muted rounded-full"
                                        title="View Order Details"
                                    >
                                        <ArrowRight className="h-5 w-5" />
                                    </NProgressLink>
                                </div>
                            </TableCell>
                            <TableCell className="text-right">${typeof order.amount === 'number' ? order.amount.toFixed(2) : '0.00'}</TableCell>
                            <TableCell>{format(order.dateObj, 'PPP')}</TableCell>
                            <TableCell>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <span className="inline-block max-w-[120px] truncate">
                                                {order.source}
                                            </span>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>{order.source}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </TableCell>
                            <TableCell>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <span className="inline-block max-w-[150px] truncate cursor-help">
                                                {order.gig || <span className="text-muted-foreground">N/A</span>}
                                            </span>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>{order.gig || "N/A"}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </TableCell>
                            <TableCell>
                                <StarDisplay rating={order.rating} />
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    <Badge variant={order.status === 'Cancelled' ? 'destructive' : order.status === 'Completed' ? 'default' : 'secondary'}>
                                        {order.status}
                                    </Badge>
                                    {order.status === 'Cancelled' && order.cancellationReasons && order.cancellationReasons.length > 0 && (
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <div className="cursor-help rounded-full bg-destructive/10 p-1 text-destructive hover:bg-destructive/20">
                                                        <span className="sr-only">Cancellation Reasons</span>
                                                        <svg
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            width="12"
                                                            height="12"
                                                            viewBox="0 0 24 24"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            strokeWidth="2"
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                        >
                                                            <circle cx="12" cy="12" r="10" />
                                                            <line x1="12" y1="16" x2="12" y2="12" />
                                                            <line x1="12" y1="8" x2="12.01" y2="8" />
                                                        </svg>
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <div className="text-xs">
                                                        <p className="font-semibold mb-1">Cancellation Reasons:</p>
                                                        <ul className="list-disc pl-4 space-y-1">
                                                            {order.cancellationReasons.map((reason, i) => (
                                                                <li key={i}>{reason}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    )}
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
                                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(order); }}>
                                            <Edit className="mr-2 h-4 w-4" />
                                            Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            className="text-destructive focus:text-destructive"
                                            onClick={(e) => { e.stopPropagation(); onDelete(order); }}
                                        >
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))
                ) : (
                    <TableRow>
                        <TableCell colSpan={10} className="h-24 text-center">
                            No orders found.
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    );
};

export const OrdersTable = memo(OrdersTableComponent);
