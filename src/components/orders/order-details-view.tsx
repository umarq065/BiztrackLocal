"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ArrowLeft, Calendar, CreditCard, User, Briefcase, Star, AlertCircle, Layers, Edit, Trash2, Loader2, ExternalLink } from "lucide-react";
import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { Order } from "@/lib/data/orders-data";
import type { IncomeSource } from "@/lib/data/incomes-data";
import { OrderFormDialog } from "@/components/orders/order-form-dialog";
import NProgressLink from "@/components/layout/nprogress-link";

interface OrderDetailsViewProps {
    initialOrder: Order;
    incomeSources: IncomeSource[];
}

const FiverrIcon = ({ className }: { className?: string }) => (
    <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className={className}
        xmlns="http://www.w3.org/2000/svg"
    >
        <circle cx="12" cy="12" r="10" className="opacity-20" />
        <path d="M16.5 8.5C16.5 8.5 15.5 8.5 15 9C14.5 9.5 14.5 10.5 14.5 10.5V15.5H12.5V10.5C12.5 10.5 12.5 9.5 12 9C11.5 8.5 10.5 8.5 10.5 8.5H9.5V15.5H7.5V7.5H10.5C11.5 7.5 12.5 8 13 9C13.5 8 14.5 7.5 15.5 7.5H16.5V8.5Z" />
    </svg>
);

export function OrderDetailsView({ initialOrder, incomeSources }: OrderDetailsViewProps) {
    const [order, setOrder] = useState<Order>(initialOrder);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const router = useRouter();
    const { toast } = useToast();

    const statusColors = {
        "Completed": "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]",
        "In Progress": "bg-amber-500/10 text-amber-500 border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.1)]",
        "Cancelled": "bg-red-500/10 text-red-500 border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.1)]",
    };

    const handleOrderUpdated = (updatedOrder: Order) => {
        setOrder(updatedOrder);
        setIsEditOpen(false);
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            const response = await fetch(`/api/orders/${order.id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to delete order');
            }

            toast({
                title: "Order Deleted",
                description: `Order ${order.id} has been successfully deleted.`,
            });

            router.push('/orders');
            router.refresh();
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: (error as Error).message,
            });
            setIsDeleting(false);
        }
    };

    return (
        <div className="min-h-screen bg-muted/30 dark:bg-gradient-to-br dark:from-[#0f172a] dark:via-[#1e1b4b] dark:to-[#0f172a] p-4 md:p-8">
            <div className="container max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

                {/* Header Section */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 p-6 text-white shadow-xl shadow-indigo-500/20 ring-1 ring-white/10">
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-soft-light"></div>
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" size="icon" asChild className="rounded-full w-10 h-10 bg-white/10 hover:bg-white/20 text-white ring-1 ring-white/20 transition-all hover:scale-105">
                                <Link href="/orders">
                                    <ArrowLeft className="w-5 h-5" />
                                </Link>
                            </Button>
                            <div>
                                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white drop-shadow-sm">Order Details</h1>
                                <p className="text-blue-100/80 mt-1 flex items-center gap-2">
                                    Viewing order <span className="font-mono font-semibold text-white bg-white/10 px-1.5 py-0.5 rounded border border-white/10">{order.id}</span>
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <Button
                                onClick={() => setIsEditOpen(true)}
                                className="bg-white/90 text-indigo-600 hover:bg-white shadow-lg shadow-black/10 border-0 font-bold transition-all hover:-translate-y-0.5"
                            >
                                <Edit className="w-4 h-4 mr-2" />
                                Edit Order
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={() => setIsDeleteOpen(true)}
                                className="bg-red-500/90 hover:bg-red-500 text-white shadow-lg shadow-red-900/20 border-0 font-bold transition-all hover:-translate-y-0.5"
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                    {/* Left Column (2/3 width) */}
                    <div className="md:col-span-2 space-y-6">

                        {/* Project Info Card */}
                        <div className="p-6 rounded-2xl bg-white dark:bg-[#0a0a0a]/80 backdrop-blur-xl border border-border/50 dark:border-white/10 shadow-xl relative overflow-hidden group hover:shadow-2xl transition-all duration-500">
                            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                            <div className="flex items-center justify-between mb-8 relative z-10">
                                <h2 className="text-lg font-bold flex items-center gap-2 text-foreground dark:text-white uppercase tracking-wide">
                                    <Briefcase className="w-5 h-5 text-violet-500" />
                                    Project Information
                                </h2>
                                <Badge className={cn("px-4 py-1.5 text-sm font-bold border rounded-full transition-all hover:scale-105", statusColors[order.status])}>
                                    {order.status}
                                </Badge>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 relative z-10">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                                        Order ID
                                    </label>
                                    <div className="flex items-center gap-3">
                                        <p className="text-lg font-mono font-bold text-foreground dark:text-white select-all">{order.id}</p>
                                        <a
                                            href={`https://www.fiverr.com/orders/${order.id}/activities`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="group/link flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1dbf73]/10 hover:bg-[#1dbf73]/20 border border-[#1dbf73]/20 transition-all"
                                            title="View on Fiverr"
                                        >
                                            <span className="text-[#1dbf73] font-bold text-xs">Fiverr</span>
                                            <ExternalLink className="w-3 h-3 text-[#1dbf73] group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
                                        </a>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Date</label>
                                    <div className="flex items-center gap-2 text-foreground dark:text-white bg-muted/30 dark:bg-white/5 p-2 rounded-lg border border-border/50 dark:border-white/5 w-fit">
                                        <Calendar className="w-4 h-4 text-violet-500" />
                                        <span className="text-base font-medium">{format(new Date(order.date), "PPP")}</span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Client</label>
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-bold text-xs">
                                            {order.clientUsername.substring(0, 2).toUpperCase()}
                                        </div>
                                        <NProgressLink
                                            href={`/clients/${order.clientUsername}`}
                                            className="text-lg font-bold text-foreground dark:text-white hover:text-violet-500 dark:hover:text-violet-400 transition-colors flex items-center gap-1 group/client"
                                        >
                                            {order.clientUsername}
                                            <ExternalLink className="w-3 h-3 opacity-0 group-hover/client:opacity-50 transition-opacity" />
                                        </NProgressLink>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Gig / Service</label>
                                    <div className="flex items-center gap-2 text-foreground dark:text-white">
                                        <Layers className="w-4 h-4 text-indigo-500" />
                                        <span className="text-base font-medium line-clamp-1" title={order.gig}>{order.gig}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Financials Card */}
                        <div className="p-6 rounded-2xl bg-white dark:bg-[#0a0a0a]/80 backdrop-blur-xl border border-border/50 dark:border-white/10 shadow-xl relative overflow-hidden group hover:shadow-2xl transition-all duration-500">
                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                            <h2 className="text-lg font-bold mb-8 flex items-center gap-2 text-foreground dark:text-white uppercase tracking-wide relative z-10">
                                <CreditCard className="w-5 h-5 text-emerald-500" />
                                Financial Details
                            </h2>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 relative z-10">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Order Value</label>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-2xl text-emerald-600 dark:text-emerald-500 font-bold">$</span>
                                        <p className="text-4xl font-bold text-emerald-600 dark:text-emerald-500 font-mono tracking-tight">{order.amount.toFixed(2)}</p>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Income Source</label>
                                    <div className="flex items-center gap-3 bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-xl w-fit">
                                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-500 font-bold text-xs ring-1 ring-emerald-500/20">
                                            {order.source.charAt(0).toUpperCase()}
                                        </span>
                                        <p className="text-lg text-foreground dark:text-white font-bold">{order.source}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column (1/3 width) */}
                    <div className="space-y-6">
                        <div className="p-6 rounded-2xl bg-white dark:bg-[#0a0a0a]/80 backdrop-blur-xl border border-border/50 dark:border-white/10 shadow-xl h-full relative overflow-hidden flex flex-col hover:shadow-2xl transition-all duration-500">
                            <h2 className="text-lg font-bold mb-8 flex items-center gap-2 text-foreground dark:text-white uppercase tracking-wide">
                                <Star className="w-5 h-5 text-amber-500" />
                                Performance
                            </h2>

                            <div className="space-y-8 flex-1">
                                <div className="space-y-4 text-center py-8 bg-gradient-to-b from-muted/30 to-transparent dark:from-white/5 dark:to-transparent rounded-2xl border border-border/50 dark:border-white/5 relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent"></div>
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Client Rating</label>
                                    {order.rating ? (
                                        <div className="flex flex-col items-center gap-3">
                                            <span className="text-6xl font-black text-foreground dark:text-white tracking-tighter drop-shadow-lg">{order.rating}</span>
                                            <div className="flex text-amber-500 gap-1.5">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star key={i} className={cn("w-6 h-6 fill-current drop-shadow-sm", i >= Math.round(order.rating!) ? "text-muted-foreground/20 fill-muted-foreground/20" : "")} />
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="py-4">
                                            <p className="text-muted-foreground italic text-sm">No rating provided</p>
                                        </div>
                                    )}
                                </div>

                                {order.status === 'Cancelled' && (
                                    <div className="pt-6 border-t border-border/50 dark:border-white/10 space-y-4 animate-in fade-in slide-in-from-bottom-2">
                                        <div className="flex items-center gap-2 text-red-500">
                                            <AlertCircle className="w-5 h-5" />
                                            <span className="font-bold uppercase tracking-wide text-sm">Cancellation Reasons</span>
                                        </div>
                                        <div className="bg-red-50 dark:bg-red-500/10 rounded-xl p-4 border border-red-100 dark:border-red-500/20 shadow-inner">
                                            <ul className="space-y-3">
                                                {order.cancellationReasons?.map((reason, i) => (
                                                    <li key={i} className="text-sm text-red-700 dark:text-red-200/90 flex items-start gap-3 font-medium">
                                                        <span className="block w-1.5 h-1.5 mt-1.5 rounded-full bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.8)]" />
                                                        {reason}
                                                    </li>
                                                ))}
                                                {(!order.cancellationReasons || order.cancellationReasons.length === 0) && (
                                                    <li className="text-sm text-red-700 dark:text-red-200/90 italic">No specific reasons recorded.</li>
                                                )}
                                            </ul>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Dialog */}
            <OrderFormDialog
                open={isEditOpen}
                onOpenChange={setIsEditOpen}
                editingOrder={order}
                incomeSources={incomeSources}
                onOrderAdded={() => { }} // Not used in edit mode
                onOrderUpdated={handleOrderUpdated}
            />

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Order?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete order <span className="font-mono font-semibold text-foreground">{order.id}</span> and remove it from all records.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                handleDelete();
                            }}
                            className={cn(buttonVariants({ variant: "destructive" }))}
                            disabled={isDeleting}
                        >
                            {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                            Delete Order
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
