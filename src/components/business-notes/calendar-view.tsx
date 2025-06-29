"use client";

import { useMemo } from 'react';
import { 
    startOfMonth, 
    endOfMonth, 
    startOfWeek, 
    endOfWeek, 
    eachDayOfInterval, 
    isSameMonth, 
    format 
} from 'date-fns';
import { utcToZonedTime } from 'date-fns-tz';
import { cn } from '@/lib/utils';
import type { BusinessNote } from '@/app/business-notes/page';

interface CalendarViewProps {
    currentDate: Date;
    notes: BusinessNote[];
    onDateClick: (date: Date) => void;
    onNoteClick: (note: BusinessNote) => void;
}

const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

const isSameDate = (date1: Date, date2: Date) => {
    return date1.getUTCFullYear() === date2.getUTCFullYear() &&
           date1.getUTCMonth() === date2.getUTCMonth() &&
           date1.getUTCDate() === date2.getUTCDate();
};


export default function CalendarView({ currentDate, notes, onDateClick, onNoteClick }: CalendarViewProps) {
    const daysInMonth = useMemo(() => {
        const start = startOfWeek(startOfMonth(currentDate));
        const end = endOfWeek(endOfMonth(currentDate));
        return eachDayOfInterval({ start, end });
    }, [currentDate]);

    const notesByDate = useMemo(() => {
        const map = new Map<string, BusinessNote[]>();
        notes.forEach(note => {
            const dateKey = format(note.date, 'yyyy-MM-dd', { timeZone: 'UTC' });
            if (!map.has(dateKey)) {
                map.set(dateKey, []);
            }
            map.get(dateKey)!.push(note);
        });
        return map;
    }, [notes]);
    
    const today = useMemo(() => new Date(), []);

    return (
        <div className="flex-1 grid grid-cols-7 grid-rows-[auto_repeat(6,minmax(0,1fr))] border-l summary-calendar">
            {WEEKDAYS.map(day => (
                <div key={day} className="text-center text-xs font-bold text-muted-foreground p-2 border-b">
                    {day}
                </div>
            ))}
            
            {daysInMonth.map((day) => {
                const zonedDay = utcToZonedTime(day, 'UTC');
                const dayKey = format(zonedDay, 'yyyy-MM-dd', { timeZone: 'UTC' });
                const dayNotes = notesByDate.get(dayKey) || [];
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isToday = isSameDate(zonedDay, today);

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
                            {dayNotes.map(note => (
                                <button
                                    key={note.id}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onNoteClick(note);
                                    }}
                                    className="w-full text-left text-xs bg-primary/90 text-primary-foreground rounded-md px-2 py-1 truncate hover:bg-primary"
                                >
                                    {note.title}
                                </button>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}