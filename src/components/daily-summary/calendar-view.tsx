
"use client";

import { useMemo, useState, useEffect } from 'react';
import { 
    startOfMonth, 
    endOfMonth, 
    startOfWeek, 
    endOfWeek, 
    eachDayOfInterval, 
    isSameMonth, 
    format,
    isSameDay,
} from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { cn } from '@/lib/utils';
import type { DailySummary } from '@/lib/data/daily-summary-data';

interface CalendarViewProps {
    currentDate: Date;
    summaries: DailySummary[];
    onDateClick: (date: Date) => void;
    onSummaryClick: (summary: DailySummary) => void;
    timezone: string;
}

const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

export default function CalendarView({ currentDate, summaries, onDateClick, onSummaryClick, timezone }: CalendarViewProps) {
    const daysInMonth = useMemo(() => {
        const start = startOfWeek(startOfMonth(currentDate));
        const end = endOfWeek(endOfMonth(currentDate));
        return eachDayOfInterval({ start, end });
    }, [currentDate]);

    const summariesByDate = useMemo(() => {
        const map = new Map<string, DailySummary[]>();
        summaries.forEach(summary => {
            const zonedDate = toZonedTime(summary.date, timezone);
            const dateKey = format(zonedDate, 'yyyy-MM-dd');
            if (!map.has(dateKey)) {
                map.set(dateKey, []);
            }
            map.get(dateKey)!.push(summary);
        });
        return map;
    }, [summaries, timezone]);
    
    const [isClient, setIsClient] = useState(false);
    useEffect(() => {
        setIsClient(true);
    }, []);

    const today = useMemo(() => new Date(), []);

    return (
        <div className="flex-1 grid grid-cols-7 grid-rows-[auto_repeat(6,minmax(0,1fr))] border-l summary-calendar">
            {WEEKDAYS.map(day => (
                <div key={day} className="text-center text-xs font-bold text-muted-foreground p-2 border-b">
                    {day}
                </div>
            ))}
            
            {daysInMonth.map((day) => {
                const dayKey = format(day, 'yyyy-MM-dd');
                const daySummaries = summariesByDate.get(dayKey) || [];
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isToday = isClient && isSameDay(day, today);

                return (
                    <div 
                        key={day.toString()} 
                        className={cn(
                            "border-b border-r p-1 flex flex-col cursor-pointer transition-colors hover:bg-accent/50",
                            !isCurrentMonth && "bg-muted/30 hover:bg-muted/40",
                        )}
                        onClick={() => onDateClick(day)}
                    >
                        <div className="flex justify-end">
                            <div 
                                className={cn(
                                    "self-end text-sm w-7 h-7 flex items-center justify-center rounded-full",
                                    isToday && "bg-primary text-primary-foreground",
                                    !isCurrentMonth && "text-muted-foreground"
                                )}
                            >
                                {format(day, 'd')}
                            </div>
                        </div>
                        <div className="mt-1 space-y-1 overflow-hidden flex-1">
                            {daySummaries.map(summary => (
                                <button
                                    key={summary.id}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onSummaryClick(summary);
                                    }}
                                    className="w-full text-left text-xs bg-primary/90 text-primary-foreground rounded-md px-2 py-1 truncate hover:bg-primary"
                                >
                                    {summary.content}
                                </button>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
