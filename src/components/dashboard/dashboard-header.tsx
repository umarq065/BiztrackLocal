
"use client";

import { DateFilter } from "./date-filter";
import { SetTargetDialog } from "./set-target-dialog";
import type { DateRange } from "react-day-picker";
import { CalendarDays, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";

interface DashboardHeaderProps {
    date: DateRange | undefined;
    setDate: (date: DateRange | undefined) => void;
    currentTarget: number;
    onSetTarget: (newTarget: number, month: string, year: number) => void;
    daysLeft: number;
    isLoading: boolean;
}

export function DashboardHeader({
    date,
    setDate,
    currentTarget,
    onSetTarget,
    daysLeft,
    isLoading
}: DashboardHeaderProps) {
    const today = new Date();
    const targetMonth = format(today, 'MMMM');
    const targetYear = today.getFullYear();
    return (
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="font-headline text-lg font-semibold md:text-2xl">
                Dashboard
            </h1>
            <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
                <div className="hidden items-center gap-2 rounded-md border border-destructive bg-card px-3 py-2 text-sm font-medium text-muted-foreground shadow-sm sm:flex">
                    <CalendarDays className="h-4 w-4" />
                    <span>{daysLeft} days left</span>
                </div>
                <DateFilter date={date} setDate={setDate} />
                {isLoading ? (
                    <Button disabled>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Set Target
                    </Button>
                ) : (
                    <SetTargetDialog
                        currentTarget={currentTarget}
                        onSetTarget={onSetTarget}
                        targetMonth={targetMonth}
                        targetYear={targetYear}
                    />
                )}
            </div>
        </div>
    );
}
