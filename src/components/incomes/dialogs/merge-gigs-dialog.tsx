
"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import type { IncomeSource } from "@/lib/data/incomes-data";

interface MergeGigsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  source: IncomeSource;
  selectedGigs: string[];
  onMergeSuccess: () => void;
}

export function MergeGigsDialog({ open, onOpenChange, source, selectedGigs, onMergeSuccess }: MergeGigsDialogProps) {
  const [mainGigId, setMainGigId] = useState<string | null>(null);
  const { toast } = useToast();

  const gigsForMerge = source.gigs.filter(g => selectedGigs.includes(g.id));

  const handleConfirmMerge = async () => {
    if (!mainGigId) return;

    try {
      const gigsToMergeIds = selectedGigs.filter(id => id !== mainGigId);

      const response = await fetch('/api/incomes/merge-gigs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sourceId: source.id,
          mainGigId,
          gigsToMergeIds,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to merge gigs');
      }

      toast({ title: "Gigs Merged Successfully" });
      onMergeSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error merging gigs:", error);
      toast({
        title: "Error Merging Gigs",
        description: "Please try again later.",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Gig Merge</DialogTitle>
          <DialogDescription>
            Select one gig to keep as the main gig. The other selected gigs will be removed. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <RadioGroup onValueChange={setMainGigId} className="my-4 space-y-2">
          {gigsForMerge.map(gig => (
            <div key={gig.id} className="flex items-center space-x-2 rounded-md border p-3">
              <RadioGroupItem value={gig.id} id={gig.id} />
              <Label htmlFor={gig.id} className="flex-grow font-normal cursor-pointer">{gig.name} ({format(new Date(gig.date.replace(/-/g, '/')), "PPP")})</Label>
            </div>
          ))}
        </RadioGroup>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" onClick={() => setMainGigId(null)}>Cancel</Button>
          </DialogClose>
          <Button onClick={handleConfirmMerge} disabled={!mainGigId}>
            Confirm Merge
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
