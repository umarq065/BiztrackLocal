
"use client";

import { useState, useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { format } from 'date-fns';
import type { DateRange } from "react-day-picker";
import { DateFilter } from "@/components/dashboard/date-filter";
import NProgressLink from "@/components/layout/nprogress-link";
import { cn } from "@/lib/utils";

const metricNavItems = [
    { href: "/detailed-metrics/financial", label: "Financial" },
    { href: "/detailed-metrics/client", label: "Client" },
    { href: "/detailed-metrics/growth", label: "Growth" },
    { href: "/detailed-metrics/sales", label: "Sales" },
    { href: "/detailed-metrics/marketing", label: "Marketing" },
    { href: "/detailed-metrics/project", label: "Project & Delivery" },
];

export default function DetailedMetricsLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [date, setDate] = useState<DateRange | undefined>(() => {
        const fromParam = searchParams.get('from');
        const toParam = searchParams.get('to');
        if (fromParam && toParam) {
            const from = new Date(fromParam.replace(/-/g, '/'));
            const to = new Date(toParam.replace(/-/g, '/'));
            if (!isNaN(from.getTime()) && !isNaN(to.getTime())) {
                return { from, to };
            }
        }
        const today = new Date();
        const from = new Date(today.getFullYear(), today.getMonth(), 1);
        return { from, to: today };
    });

    const createQueryString = useCallback(
        (paramsToUpdate: Record<string, string | null>) => {
            const params = new URLSearchParams(searchParams.toString());
            for (const [name, value] of Object.entries(paramsToUpdate)) {
                if (value) {
                    params.set(name, value);
                } else {
                    params.delete(name);
                }
            }
            return params.toString();
        },
        [searchParams]
    );

    const handleSetDate = (newDate: DateRange | undefined) => {
        setDate(newDate);
        router.push(`${pathname}?${createQueryString({
            from: newDate?.from ? format(newDate.from, 'yyyy-MM-dd') : null,
            to: newDate?.to ? format(newDate.to, 'yyyy-MM-dd') : null,
        })}`, { scroll: false });
    };

    return (
        <main className="flex flex-1 flex-col gap-6 p-4 md:gap-8 md:p-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <h1 className="font-headline text-lg font-semibold md:text-2xl">
                    Detailed Metrics
                </h1>
                <div className="ml-auto flex items-center gap-2">
                    <DateFilter date={date} setDate={handleSetDate} />
                </div>
            </div>

            <nav className="border-b">
                <div className="flex items-center gap-4 overflow-x-auto pb-0">
                    {metricNavItems.map((item) => (
                        <NProgressLink
                            key={item.href}
                            href={`${item.href}?${searchParams.toString()}`}
                            className={cn(
                                "whitespace-nowrap border-b-2 border-transparent py-3 px-1 text-sm font-medium text-muted-foreground hover:border-primary/50 hover:text-foreground",
                                pathname === item.href && "border-primary text-primary"
                            )}
                        >
                            {item.label}
                        </NProgressLink>
                    ))}
                </div>
            </nav>

            <div className="space-y-6">
                {children}
            </div>
        </main>
    );
}
