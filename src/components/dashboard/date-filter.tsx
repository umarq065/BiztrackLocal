"use client";

import * as React from "react";
import { format, differenceInDays, differenceInWeeks, subMonths, subYears } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import type { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DateFilterProps extends React.HTMLAttributes<HTMLDivElement> {
  date: DateRange | undefined;
  setDate: (date: DateRange | undefined) => void;
  absoluteDuration?: boolean;
}

const predefinedRanges = [
  { label: "7d", value: { days: 7 } },
  { label: "14d", value: { days: 14 } },
  { label: "30d", value: { days: 30 } },
  { label: "60d", value: { days: 60 } },
  { label: "90d", value: { days: 90 } },
  { label: "6M", value: { months: 6 } },
  { label: "1Y", value: { years: 1 } },
];

export function DateFilter({
  className,
  date,
  setDate,
  absoluteDuration = false,
}: DateFilterProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const handlePredefinedRangeClick = (range: { days?: number, months?: number, years?: number }) => {
    const today = new Date();
    let fromDate: Date;

    if (range.days) {
      fromDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - (range.days - 1));
    } else if (range.months) {
      fromDate = subMonths(today, range.months);
    } else if (range.years) {
      fromDate = subYears(today, range.years);
    } else {
      return;
    }

    setDate({ from: fromDate, to: today });
    setIsOpen(false);
  }

  const renderDuration = () => {
    if (date?.from && date.to) {
      const days = differenceInDays(date.to, date.from) + 1;

      const parts = [];
      if (days > 0) parts.push(`${days} day${days > 1 ? 's' : ''}`);
      if (days >= 7) {
        const weeks = (days / 7).toFixed(1);
        parts.push(`${weeks} weeks`);
      }
      if (days >= 30) {
        const months = parseFloat((days / 30.44).toFixed(1));
        if (months > 0) parts.push(`${months} month${months > 1 ? 's' : ''}`);
      }

      if (parts.length > 0) {
        return (
          <span className="text-[10px] text-muted-foreground ml-2 whitespace-nowrap hidden xl:inline-block">
            {parts.join(' | ')}
          </span>
        );
      }
    }
    return null;
  };

  return (
    <div className={cn("grid gap-1", className)}>
      <div className="flex items-center gap-1">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              id="date"
              variant={"outline"}
              className={cn(
                "w-[240px] justify-start text-left font-normal h-8 text-xs",
                !date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-3.5 w-3.5" />
              {date?.from ? (
                date.to ? (
                  <>
                    {format(date.from, "LLL dd, y")} -{" "}
                    {format(date.to, "LLL dd, y")}
                  </>
                ) : (
                  format(date.from, "LLL dd, y")
                )
              ) : (
                <span>All Time</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={date?.from}
              selected={date}
              onSelect={setDate}
              numberOfMonths={2}
            />
            <div className="border-t p-2">
              <Button
                variant="ghost"
                className="w-full justify-center h-8 text-xs"
                onClick={() => {
                  setDate(undefined);
                  setIsOpen(false);
                }}
              >
                Clear Filter (All Time)
              </Button>
            </div>
          </PopoverContent>
        </Popover>
        <div className="hidden lg:flex items-center rounded-md border p-0.5 bg-background/50">
          {predefinedRanges.map(range => (
            <Button
              key={range.label}
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-[10px]"
              onClick={() => handlePredefinedRangeClick(range.value)}
            >
              {range.label}
            </Button>
          ))}
        </div>
        {renderDuration()}
      </div>
    </div>
  );
}
