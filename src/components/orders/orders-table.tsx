
"use client";

import { memo } from "react";
import { format } from "date-fns";
import { MoreHorizontal, Star, Edit, Trash2 } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import type { Order } from "@/lib/data/orders-data";

const clients = [
  { username: "olivia.m", name: "Olivia Martin" },
  { username: "jackson.l", name: "Jackson Lee" },
  { username: "isabella.n", name: "Isabella Nguyen" },
  { username: "will.k", name: "William Kim" },
  { username: "sofia.d", name: "Sofia Davis" },
];

const StarDisplay = ({ rating }: { rating?: number | null }) => {
    if (rating === undefined || rating === null) return <span className="text-muted-foreground">N/A</span>;
    return (
        <div className="flex items-center gap-1">
            <Star className="h-4 w-4 text-primary" />
            <span>{rating.toFixed(1)}</span>
        </div>
    );
};

interface OrdersTableProps {
    orders: (Order & { dateObj: Date })[];
    onEdit: (order: Order) => void;
    onDelete: (order: Order) => void;
}

const OrdersTableComponent = ({ orders, onEdit, onDelete }: OrdersTableProps) => {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Gig</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {orders.length > 0 ? (
                    orders.map((order) => (
                        <TableRow key={order.id}>
                            <TableCell>{format(order.dateObj, 'PPP')}</TableCell>
                            <TableCell className="font-medium">{order.id}</TableCell>
                            <TableCell>{clients.find(c => c.username === order.clientUsername)?.name || order.clientUsername}</TableCell>
                            <TableCell className="text-right">${order.amount.toFixed(2)}</TableCell>
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
                            <TableCell>{order.gig || <span className="text-muted-foreground">N/A</span>}</TableCell>
                            <TableCell>
                                <StarDisplay rating={order.rating} />
                            </TableCell>
                            <TableCell>
                                <Badge variant={order.status === 'Cancelled' ? 'destructive' : order.status === 'Completed' ? 'default' : 'secondary'}>
                                    {order.status}
                                </Badge>
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
                        <TableCell colSpan={9} className="h-24 text-center">
                            No orders found.
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    );
};

export const OrdersTable = memo(OrdersTableComponent);
