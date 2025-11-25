

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
    onSetTarget: (newTarget: number, month: string, year: number) => void;
    daysLeft: number;
    monthlyTargets: Record<string, number>;
}

export function DashboardHeader({
    date,
    setDate,
    onSetTarget,
    daysLeft,
    monthlyTargets,
}: DashboardHeaderProps) {
    const today = new Date();
    const targetMonth = format(today, 'MMMM');
    const targetYear = today.getFullYear();

    return (
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between relative z-10">
            <div className="space-y-1">
                <h1 className="font-headline text-3xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-100 to-white drop-shadow-sm md:text-4xl">
                    Dashboard
                </h1>
                <p className="text-sm text-blue-200/60 font-medium">
                    Overview of your business performance
                </p>
            </div>
            <div className="flex w-full items-center justify-end gap-3 sm:w-auto">
                <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-blue-100 backdrop-blur-md shadow-sm sm:flex ring-1 ring-white/5">
                    <CalendarDays className="h-3.5 w-3.5 text-blue-400" />
                    <span>{daysLeft} days left in {targetMonth}</span>
                </div>
                <div className="flex items-center gap-2 bg-white/5 p-1 rounded-lg border border-white/10 backdrop-blur-sm">
                    <DateFilter date={date} setDate={setDate} absoluteDuration={true} className="border-0" />
                    <SetTargetDialog
                        monthlyTargets={monthlyTargets}
                        onSetTarget={onSetTarget}
                        initialMonth={targetMonth}
                        initialYear={targetYear}
                    />
                </div>
            </div>
        </div>
    );
}
