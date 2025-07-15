
"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  BarChart,
  Pencil,
  PlusCircle,
  Trash2,
} from "lucide-react";
import NProgressLink from "@/components/layout/nprogress-link";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import type { IncomeSource, Gig } from "@/lib/data/incomes-data";
import { MergeGigsDialog } from "./dialogs/merge-gigs-dialog";
import { useToast } from "@/hooks/use-toast";

interface IncomeSourceAccordionProps {
  incomeSources: IncomeSource[];
  onAddGig: (sourceId: string) => void;
  onAddSourceData: (sourceId: string) => void;
  onAddGigData: (sourceId: string, gigId: string) => void;
  onEditGig: (sourceId: string, gig: Gig) => void;
  onDeleteGig: (sourceId: string, gig: Gig) => void;
  onDeleteSource: (source: IncomeSource) => void;
}

export function IncomeSourceAccordion({
  incomeSources,
  onAddGig,
  onAddSourceData,
  onAddGigData,
  onEditGig,
  onDeleteGig,
  onDeleteSource,
}: IncomeSourceAccordionProps) {
  const [mergingSourceId, setMergingSourceId] = useState<string | null>(null);
  const [selectedGigs, setSelectedGigs] = useState<Record<string, boolean>>({});
  const [isMergeDialogOpen, setIsMergeDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleCancelMerge = () => {
    setMergingSourceId(null);
    setSelectedGigs({});
  };
  
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
  
  const handleSelectAllGigs = (gigs: Gig[]) => (checked: boolean) => {
    const newSelectedGigs = { ...selectedGigs };
    gigs.forEach(gig => {
        newSelectedGigs[gig.id] = checked;
    });
    setSelectedGigs(newSelectedGigs);
  };

  return (
    <>
      <Accordion type="multiple" className="w-full space-y-2">
        {incomeSources.map((source) => (
          <AccordionItem
            value={source.id}
            key={source.id}
            className="rounded-md border"
          >
            <div className="flex items-center pr-4">
                <AccordionTrigger className="flex-grow px-4">
                <div className="flex items-center gap-4">
                    <span className="font-semibold text-lg">{source.name}</span>
                    <Badge variant="secondary">{source.gigs.length} Gigs</Badge>
                </div>
                </AccordionTrigger>
                <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                    <Button variant="outline" size="sm" asChild>
                        <NProgressLink href={`/incomes/${source.id}`}>
                            Analytics
                        </NProgressLink>
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => onDeleteSource(source)}>
                        Delete Source
                    </Button>
                </div>
            </div>
            <AccordionContent className="px-4">
              <div className="flex justify-end gap-2 mb-4">
                {mergingSourceId === source.id ? (
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handleCancelMerge}>Cancel Merge</Button>
                    <Button onClick={handleInitiateMerge}>
                      Merge Selected ({Object.values(selectedGigs).filter(Boolean).length})
                    </Button>
                  </div>
                ) : (
                  <Button variant="outline" onClick={() => {
                    setMergingSourceId(source.id);
                    setSelectedGigs({});
                  }}>
                    Merge Gigs
                  </Button>
                )}
                 <Button variant="secondary" onClick={() => onAddSourceData(source.id)}>
                    Add Messages Data
                </Button>
                 <Button variant="outline" onClick={() => onAddGig(source.id)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Gig
                </Button>
              </div>
              <TooltipProvider>
                <Table>
                    <TableHeader>
                    <TableRow>
                        {mergingSourceId === source.id && (
                        <TableHead className="w-12">
                            <Checkbox
                            onCheckedChange={(checked) => handleSelectAllGigs(source.gigs)(!!checked)}
                            checked={
                                source.gigs.length > 0 && source.gigs.every((gig) => selectedGigs[gig.id])
                            }
                            aria-label="Select all gigs for this source"
                            />
                        </TableHead>
                        )}
                        <TableHead>Gig Name</TableHead>
                        <TableHead>Date Added</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {source.gigs.map((gig) => (
                        <TableRow key={gig.id}>
                        {mergingSourceId === source.id && (
                            <TableCell>
                                <Checkbox
                                    onCheckedChange={(checked) => {
                                        setSelectedGigs(prev => ({...prev, [gig.id]: !!checked}));
                                    }}
                                    checked={!!selectedGigs[gig.id]}
                                    aria-label={`Select gig ${gig.name}`}
                                />
                            </TableCell>
                        )}
                        <TableCell className="font-medium">
                            <NProgressLink href={`/gigs/${gig.id}`} className="hover:underline">
                                {gig.name}
                            </NProgressLink>
                        </TableCell>
                        <TableCell>
                            {format(new Date(gig.date.replace(/-/g, '/')), "PPP")}
                        </TableCell>
                        <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => onAddGigData(source.id, gig.id)}
                                >
                                    <BarChart className="h-4 w-4" />
                                    <span className="sr-only">Add Data</span>
                                </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                <p>Add Performance Data</p>
                                </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => onEditGig(source.id, gig)}
                                >
                                    <Pencil className="h-4 w-4" />
                                    <span className="sr-only">Edit Gig</span>
                                </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                <p>Edit Gig</p>
                                </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                    onClick={() => onDeleteGig(source.id, gig)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                    <span className="sr-only">Delete Gig</span>
                                </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                <p>Delete Gig</p>
                                </TooltipContent>
                            </Tooltip>
                            </div>
                        </TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
              </TooltipProvider>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      
      {mergingSourceId && (
        <MergeGigsDialog
          open={isMergeDialogOpen}
          onOpenChange={setIsMergeDialogOpen}
          source={incomeSources.find(s => s.id === mergingSourceId)!}
          selectedGigs={Object.keys(selectedGigs).filter(k => selectedGigs[k])}
          onMergeSuccess={() => {
            handleCancelMerge();
            // Optionally, you might want to refetch sources here
          }}
        />
      )}
    </>
  );
}
