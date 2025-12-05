"use client";

import type { IncomeSource, Gig } from "@/lib/data/incomes-data";
import { IncomeSourceCard } from "./income-source-card";

interface IncomeSourceGridProps {
    incomeSources: IncomeSource[];
    onAddGig: (sourceId: string) => void;
    onAddSourceData: (source: IncomeSource) => void;
    onAddGigData: (source: IncomeSource, gig: Gig) => void;
    onEditSource: (source: IncomeSource) => void;
    onEditGig: (sourceId: string, gig: Gig) => void;
    onDeleteGig: (sourceId: string, gig: Gig) => void;
    onDeleteSource: (source: IncomeSource) => void;
}

export function IncomeSourceGrid({
    incomeSources,
    onAddGig,
    onAddSourceData,
    onAddGigData,
    onEditSource,
    onEditGig,
    onDeleteGig,
    onDeleteSource,
}: IncomeSourceGridProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {incomeSources.map((source, index) => (
                <div
                    key={source.id}
                    className="animate-in fade-in zoom-in duration-500 fill-mode-backwards"
                    style={{ animationDelay: `${index * 100}ms` }}
                >
                    <IncomeSourceCard
                        source={source}
                        onAddGig={onAddGig}
                        onAddSourceData={onAddSourceData}
                        onAddGigData={onAddGigData}
                        onEditSource={onEditSource}
                        onEditGig={onEditGig}
                        onDeleteGig={onDeleteGig}
                        onDeleteSource={onDeleteSource}
                    />
                </div>
            ))}
        </div>
    );
}
