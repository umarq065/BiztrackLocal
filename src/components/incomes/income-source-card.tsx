"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
    MoreHorizontal,
    Pencil,
    PlusCircle,
    Trash2,
    TrendingUp,
    ExternalLink,
    FileUp,
} from "lucide-react";
import NProgressLink from "@/components/layout/nprogress-link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
    TooltipProvider,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";

import type { IncomeSource, Gig } from "@/lib/data/incomes-data";
import { ImportGigDataButton } from "./import-gig-data-button";
import { MergeGigsDialog } from "./dialogs/merge-gigs-dialog";
import { useToast } from "@/hooks/use-toast";

interface IncomeSourceCardProps {
    source: IncomeSource;
    onAddGig: (sourceId: string) => void;
    onAddSourceData: (source: IncomeSource) => void;
    onAddGigData: (source: IncomeSource, gig: Gig) => void;
    onEditSource: (source: IncomeSource) => void;
    onEditGig: (sourceId: string, gig: Gig) => void;
    onDeleteGig: (sourceId: string, gig: Gig) => void;
    onDeleteSource: (source: IncomeSource) => void;
}

export function IncomeSourceCard({
    source,
    onAddGig,
    onAddSourceData,
    onAddGigData,
    onEditSource,
    onEditGig,
    onDeleteGig,
    onDeleteSource,
}: IncomeSourceCardProps) {
    const [selectedGigs, setSelectedGigs] = useState<Record<string, boolean>>({});
    const [isMergeDialogOpen, setIsMergeDialogOpen] = useState(false);
    const { toast } = useToast();

    const handleInitiateMerge = () => {
        const selectedCount = Object.values(selectedGigs).filter(Boolean).length;
        if (selectedCount < 2) {
            toast({
                variant: "destructive",
                title: "Select Gigs",
                description: "Please select at least two gigs to merge.",
            });
            return;
        }
        setIsMergeDialogOpen(true);
    };

    const handleSelectAllGigs = (checked: boolean) => {
        const newSelectedGigs = { ...selectedGigs };
        source.gigs.forEach(gig => {
            newSelectedGigs[gig.id] = checked;
        });
        setSelectedGigs(newSelectedGigs);
    };

    const selectedCount = Object.values(selectedGigs).filter(Boolean).length;

    return (
        <>
            <div className="glass-card rounded-xl p-6 flex flex-col h-full relative group overflow-hidden border border-white/10 hover:border-primary/30 transition-all duration-300">
                {/* Background Glow */}
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/20 rounded-full blur-3xl group-hover:bg-primary/30 transition-all duration-500" />

                {/* Header */}
                <div className="flex justify-between items-start mb-4 relative z-10">
                    <div>
                        <h3 className="font-headline text-2xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors duration-300">
                            {source.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-2">
                            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 backdrop-blur-sm">
                                {source.gigs.length} Active Gigs
                            </Badge>
                            {selectedCount >= 2 && (
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    className="h-6 text-xs bg-primary/80 hover:bg-primary text-primary-foreground animate-in fade-in zoom-in"
                                    onClick={handleInitiateMerge}
                                >
                                    Merge ({selectedCount})
                                </Button>
                            )}
                        </div>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Open menu</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="glass border-white/10">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => onEditSource(source)}>
                                <Pencil className="mr-2 h-4 w-4" /> Edit Source
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onAddSourceData(source)}>
                                <TrendingUp className="mr-2 h-4 w-4" /> Add Data
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-white/10" />
                            <DropdownMenuItem onClick={() => onDeleteSource(source)} className="text-destructive focus:text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" /> Delete Source
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Gigs List */}
                <div className="flex-grow relative z-10 min-h-[200px]">
                    <div className="flex items-center justify-between mb-2 px-2">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Gigs</span>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Select All</span>
                            <Checkbox
                                checked={source.gigs.length > 0 && source.gigs.every(g => selectedGigs[g.id])}
                                onCheckedChange={(checked) => handleSelectAllGigs(!!checked)}
                                className="h-3 w-3 border-white/20 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                            />
                        </div>
                    </div>

                    <ScrollArea className="h-[300px] pr-4 -mr-4">
                        <div className="space-y-2 pb-2">
                            {source.gigs.length > 0 ? (
                                source.gigs.map(gig => (
                                    <div key={gig.id} className="group/gig relative flex flex-col gap-2 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all border border-white/5 hover:border-white/10">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <Checkbox
                                                    checked={!!selectedGigs[gig.id]}
                                                    onCheckedChange={(checked) => setSelectedGigs(prev => ({ ...prev, [gig.id]: !!checked }))}
                                                    className="h-4 w-4 border-white/20 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                                />
                                                <div className="flex flex-col overflow-hidden">
                                                    <NProgressLink href={`/gigs/${gig.id}`} className="text-sm font-medium truncate hover:text-primary transition-colors">
                                                        {gig.name}
                                                    </NProgressLink>
                                                    <span className="text-xs text-muted-foreground">
                                                        {format(new Date(gig.date), "MMM d, yyyy")}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Buttons Row */}
                                        <div className="flex items-center justify-between gap-1 pt-2 border-t border-white/5 mt-1">
                                            <TooltipProvider>
                                                <div className="flex items-center gap-1">
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-7 w-7 hover:bg-primary/20 hover:text-primary"
                                                                onClick={() => onAddGigData(source, gig)}
                                                            >
                                                                <TrendingUp className="h-3.5 w-3.5" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent side="bottom">Add Metrics</TooltipContent>
                                                    </Tooltip>

                                                    <ImportGigDataButton
                                                        sourceId={source.id}
                                                        gigId={gig.id}
                                                        variant="icon"
                                                    />
                                                </div>

                                                <div className="flex items-center gap-1">
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-7 w-7 hover:bg-white/20"
                                                                onClick={() => onEditGig(source.id, gig)}
                                                            >
                                                                <Pencil className="h-3.5 w-3.5" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent side="bottom">Edit Gig</TooltipContent>
                                                    </Tooltip>

                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-7 w-7 hover:bg-destructive/20 hover:text-destructive"
                                                                onClick={() => onDeleteGig(source.id, gig)}
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent side="bottom">Delete Gig</TooltipContent>
                                                    </Tooltip>
                                                </div>
                                            </TooltipProvider>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-sm text-muted-foreground italic py-8 text-center border border-dashed border-white/10 rounded-lg">
                                    No gigs yet. <br /> Click "+" to add one.
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </div>

                {/* Footer Actions */}
                <div className="mt-4 pt-4 border-t border-white/10 relative z-10">
                    <Button
                        className="w-full bg-primary/20 hover:bg-primary/30 text-primary border border-primary/20 shadow-glow group-hover:shadow-glow-lg transition-all"
                        onClick={() => onAddGig(source.id)}
                    >
                        <PlusCircle className="mr-2 h-4 w-4" /> Add New Gig
                    </Button>
                </div>
            </div>

            {isMergeDialogOpen && (
                <MergeGigsDialog
                    open={isMergeDialogOpen}
                    onOpenChange={setIsMergeDialogOpen}
                    source={source}
                    selectedGigs={Object.keys(selectedGigs).filter(k => selectedGigs[k])}
                    onMergeSuccess={() => {
                        setIsMergeDialogOpen(false);
                        setSelectedGigs({});
                    }}
                />
            )}
        </>
    );
}
