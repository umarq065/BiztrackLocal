"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DollarSign } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SetTargetDialogProps {
  currentTarget: number;
  onSetTarget: (newTarget: number, month: string, year: number) => void;
  targetMonth: string;
  targetYear: number;
}

export function SetTargetDialog({
  currentTarget,
  onSetTarget,
  targetMonth,
  targetYear,
}: SetTargetDialogProps) {
  const [target, setTarget] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState(0);
  const [open, setOpen] = useState(false);

  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() + i);

  useEffect(() => {
    if (open) {
      setTarget(currentTarget > 0 ? currentTarget.toString() : "");
      setMonth(targetMonth);
      setYear(targetYear);
    }
  }, [open, currentTarget, targetMonth, targetYear]);

  const handleSave = () => {
    const newTarget = parseFloat(target);
    if (!isNaN(newTarget) && month && year) {
      onSetTarget(newTarget, month, year);
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Set Target</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Set Monthly Target</DialogTitle>
          <DialogDescription>
            Set your revenue target for the selected month. This will help track
            your performance.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="month" className="text-right">
              Month
            </Label>
            <Select value={month} onValueChange={setMonth}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent>
                {months.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="year" className="text-right">
              Year
            </Label>
            <Select value={String(year)} onValueChange={(val) => setYear(Number(val))}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                {years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="target" className="text-right">
              Target
            </Label>
            <div className="relative col-span-3">
              <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="target"
                type="number"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                className="pl-8"
                placeholder="e.g., 50000"
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleSave}>Save Target</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
