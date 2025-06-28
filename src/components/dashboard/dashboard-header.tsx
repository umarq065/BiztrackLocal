"use client";

import { DateFilter } from "./date-filter";
import { SetTargetDialog } from "./set-target-dialog";
import type { DateRange } from "react-day-picker";

interface DashboardHeaderProps {
    date: DateRange | undefined;
    setDate: (date: DateRange | undefined) => void;
    currentTarget: number;
    onSetTarget: (newTarget: number, month: string, year: number) => void;
    targetMonth: string;
    targetYear: number;
}

export function DashboardHeader({
    date,
    setDate,
    currentTarget,
    onSetTarget,
    targetMonth,
    targetYear,
}: DashboardHeaderProps) {
    return (
        <div className="flex items-center">
            <h1 className="font-headline text-lg font-semibold md:text-2xl">
                Dashboard
            </h1>
            <div className="ml-auto flex items-center gap-2">
                <DateFilter date={date} setDate={setDate} />
                <SetTargetDialog
                    currentTarget={currentTarget}
                    onSetTarget={onSetTarget}
                    targetMonth={targetMonth}
                    targetYear={targetYear}
                />
            </div>
        </div>
    );
}
