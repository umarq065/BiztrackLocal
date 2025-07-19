
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";

interface MonthYearPickerProps {
    date: { month: number; year: number } | null;
    setDate: (date: { month: number; year: number } | null) => void;
    label: string;
}

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function MonthYearPicker({ date, setDate, label }: MonthYearPickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [viewYear, setViewYear] = useState(date?.year || new Date().getFullYear());

    const years = Array.from({ length: 12 }, (_, i) => viewYear - 5 + i);

    const handleDateSelect = (month: number, year: number) => {
        setDate({ month, year });
        setIsOpen(false);
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant={"outline"}
                    className={cn(
                        "w-[160px] justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    <div>
                         <p className="text-xs text-muted-foreground -mb-1">{label}</p>
                        {date ? `${months[date.month - 1]} ${date.year}` : `Pick a date`}
                    </div>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
                <div className="p-2">
                    <div className="flex items-center justify-between pb-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => setViewYear(v => v - 12)}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="font-semibold text-sm">{viewYear-5} - {viewYear+6}</span>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => setViewYear(v => v + 12)}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                        {years.map((year) => (
                            <div key={year} className="space-y-1">
                                <div className="text-center font-semibold text-sm py-1">{year}</div>
                                <div className="grid grid-cols-3 gap-1">
                                     {months.map((month, monthIndex) => (
                                        <Button
                                            key={month}
                                            variant={date?.year === year && date.month === monthIndex + 1 ? "default" : "ghost"}
                                            size="sm"
                                            className="h-7 text-xs"
                                            onClick={() => handleDateSelect(monthIndex + 1, year)}
                                        >
                                            {month}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
