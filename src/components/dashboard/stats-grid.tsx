import type { Stat } from "@/lib/placeholder-data";
import StatCard from "./stat-card";

interface StatsGridProps {
    title: string;
    stats: Stat[];
    gridClassName?: string;
}

export function StatsGrid({ title, stats, gridClassName }: StatsGridProps) {
    return (
        <section>
            <h2 className="text-xl font-semibold mb-4">{title}</h2>
            <div className={gridClassName}>
                {stats.map((stat) => (
                    <StatCard key={stat.title} {...stat} />
                ))}
            </div>
        </section>
    );
}
