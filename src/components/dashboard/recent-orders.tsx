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
    <div className="rounded-md border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden">
      <Table>
        <TableHeader className="bg-white/5">
          <TableRow className="border-white/10 hover:bg-white/5">
            <TableHead className="text-blue-100/80">Client</TableHead>
            <TableHead className="text-blue-100/80">Date</TableHead>
            <TableHead className="text-blue-100/80">Source</TableHead>
            <TableHead className="text-blue-100/80">Status</TableHead>
            <TableHead className="text-right text-blue-100/80">Amount</TableHead>
            <TableHead className="text-right text-blue-100/80">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id} className="border-white/5 hover:bg-white/10 transition-colors">
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="hidden h-8 w-8 sm:flex ring-2 ring-white/10">
                    <AvatarImage src={order.avatarUrl} alt="Avatar" />
                    <AvatarFallback className="bg-blue-900/50 text-blue-200">{order.username.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="grid gap-0.5">
                    <p className="text-sm font-medium leading-none text-white">
                      {order.username}
                    </p>
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-blue-200/70">
                {format(toZonedTime(order.date, 'UTC'), "MMM dd, yyyy")}
              </TableCell>
              <TableCell className="text-blue-200/70">{order.source}</TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={`border-0 ${order.status === 'Cancelled' ? 'bg-red-500/20 text-red-300' :
                      order.status === 'Completed' ? 'bg-emerald-500/20 text-emerald-300' :
                        'bg-blue-500/20 text-blue-300'
                    }`}
                >
                  {order.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right font-medium text-white">
                ${order.amount.toFixed(2)}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEditOrder(order.id)}
                  className="h-8 w-8 p-0 text-blue-200/70 hover:text-white hover:bg-white/10"
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
