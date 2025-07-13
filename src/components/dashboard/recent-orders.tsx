import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { type RecentOrder } from "@/lib/placeholder-data";
import { Badge } from "../ui/badge";
import { format } from "date-fns";
import { Button } from "../ui/button";
import { MoreHorizontal, Edit } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "../ui/dropdown-menu";
import NProgressLink from "../layout/nprogress-link";

interface RecentOrdersProps {
  orders: RecentOrder[];
}

export default function RecentOrders({ orders }: RecentOrdersProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Client</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Source</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Amount</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((order) => (
          <TableRow key={order.id}>
            <TableCell>
              <div className="flex items-center gap-4">
                <Avatar className="hidden h-9 w-9 sm:flex">
                  <AvatarImage src={order.avatarUrl} alt="Avatar" data-ai-hint="avatar person" />
                  <AvatarFallback>{order.username.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="grid gap-1">
                  <p className="text-sm font-medium leading-none">
                    {order.username}
                  </p>
                </div>
              </div>
            </TableCell>
            <TableCell>
                {format(new Date(order.date.replace(/-/g, '/')), "PPP")}
            </TableCell>
            <TableCell>{order.source}</TableCell>
            <TableCell>
                <Badge variant={order.status === 'Cancelled' ? 'destructive' : order.status === 'Completed' ? 'default' : 'secondary'}>
                    {order.status}
                </Badge>
            </TableCell>
            <TableCell className="text-right font-medium">
              ${order.amount.toFixed(2)}
            </TableCell>
            <TableCell className="text-right">
                <NProgressLink href={`/orders`}>
                    <Button variant="outline" size="sm">
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                    </Button>
                </NProgressLink>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
