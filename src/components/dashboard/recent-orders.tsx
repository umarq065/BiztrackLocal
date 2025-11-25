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
import { toZonedTime } from "date-fns-tz";
import { Button } from "../ui/button";
import { MoreHorizontal, Edit } from "lucide-react";

interface RecentOrdersProps {
  orders: RecentOrder[];
  onEditOrder: (orderId: string) => void;
}

export default function RecentOrders({ orders, onEditOrder }: RecentOrdersProps) {
  return (
    <div className="rounded-md border border-border bg-card backdrop-blur-sm overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow className="border-border hover:bg-muted/50">
            <TableHead className="text-muted-foreground">Client</TableHead>
            <TableHead className="text-muted-foreground">Date</TableHead>
            <TableHead className="text-muted-foreground">Source</TableHead>
            <TableHead className="text-muted-foreground">Status</TableHead>
            <TableHead className="text-right text-muted-foreground">Amount</TableHead>
            <TableHead className="text-right text-muted-foreground">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id} className="border-border hover:bg-muted/50 transition-colors">
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="hidden h-8 w-8 sm:flex ring-2 ring-border">
                    <AvatarImage src={order.avatarUrl} alt="Avatar" />
                    <AvatarFallback className="bg-primary/10 text-primary">{order.username.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="grid gap-0.5">
                    <p className="text-sm font-medium leading-none text-foreground">
                      {order.username}
                    </p>
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {format(toZonedTime(order.date, 'UTC'), "MMM dd, yyyy")}
              </TableCell>
              <TableCell className="text-muted-foreground">{order.source}</TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={`border-0 ${order.status === 'Cancelled' ? 'bg-red-500/20 text-red-600 dark:text-red-300' :
                    order.status === 'Completed' ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300' :
                      'bg-blue-500/20 text-blue-600 dark:text-blue-300'
                    }`}
                >
                  {order.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right font-medium text-foreground">
                ${order.amount.toFixed(2)}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEditOrder(order.id)}
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                  <Edit className="h-4 w-4" />
                  <span className="sr-only">Edit</span>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
