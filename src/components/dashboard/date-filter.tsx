
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
        const weeks = differenceInWeeks(date.to, date.from, { roundingMethod: 'floor' });
        if (weeks > 0) parts.push(`${weeks} week${weeks > 1 ? 's' : ''}`);
      }
      if (days >= 30) {
        // More precise month calculation
        const months = parseFloat((days / 30.44).toFixed(1));
        if (months > 0) parts.push(`${months} month${months > 1 ? 's' : ''}`);
      }


      if (parts.length > 0) {
        return (
          <p className={cn(
            "text-xs text-muted-foreground mt-1 text-center",
            absoluteDuration && "absolute top-full left-0 w-full"
          )}>
            {parts.join(' | ')}
          </p>
        );
      }
    }
    return null;
  };

  return (
    <div className={cn(absoluteDuration ? "relative" : "grid gap-1", className)}>
      <div className="flex items-center gap-1">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              id="date"
              variant={"outline"}
              className={cn(
                "w-[260px] justify-start text-left font-normal",
                !date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
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
                className="w-full justify-center"
                onClick={() => {
                  setDate(undefined);
                  setIsOpen(false);
                }}
              >
                All Time
              </Button>
            </div>
          </PopoverContent>
        </Popover>
        <div className="flex items-center rounded-md border p-0.5">
          {predefinedRanges.map(range => (
            <Button
              key={range.label}
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs"
              onClick={() => handlePredefinedRangeClick(range.value)}
            >
              {range.label}
            </Button>
          ))}
        </div>
      </div>
      {renderDuration()}
    </div>
  );
}
