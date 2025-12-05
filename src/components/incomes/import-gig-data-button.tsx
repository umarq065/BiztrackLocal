"use client";

import { useState, useRef } from "react";
import { Upload, Loader2 } from "lucide-react";
import Papa from "papaparse";
import { format, parse } from "date-fns";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface ImportGigDataButtonProps {
    sourceId: string;
    gigId: string;
    onSuccess?: () => void;
}

interface CsvData {
    Date: string;
    Impressions: string;
    Clicks: string;
}

export function ImportGigDataButton({
    sourceId,
    gigId,
    onSuccess,
}: ImportGigDataButtonProps) {
    const [isImporting, setIsImporting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsImporting(true);

        Papa.parse<CsvData>(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                try {
                    const { data, errors } = results;

                    if (errors.length > 0) {
                        console.error("CSV Parsing Errors:", errors);
                        toast({
                            variant: "destructive",
                            title: "CSV Parse Error",
                            description: "There were errors parsing the CSV file. Please check the format.",
                        });
                        setIsImporting(false);
                        return;
                    }

                    if (data.length === 0) {
                        toast({
                            variant: "destructive",
                            title: "Empty CSV",
                            description: "The CSV file appears to be empty.",
                        });
                        setIsImporting(false);
                        return;
                    }

                    // Validate headers
                    const firstRow = data[0];
                    if (!("Date" in firstRow) || !("Impressions" in firstRow) || !("Clicks" in firstRow)) {
                        toast({
                            variant: "destructive",
                            title: "Invalid CSV Format",
                            description: "CSV must have headers: Date, Impressions, Clicks",
                        });
                        setIsImporting(false);
                        return;
                    }

                    let successCount = 0;
                    let failCount = 0;

                    // Process each row
                    // We'll do this sequentially to avoid overwhelming the server, or we could do `Promise.all` for small batches.
                    // Given it's a client-side import, sequential or small batches is safer.
                    for (const row of data) {
                        try {
                            // Parse date. Assuming M/d/yyyy based on screenshot, but let's try to be robust.
                            // If the date string is already in a format `new Date()` understands, great.
                            // Otherwise we might need `date-fns` `parse`.
                            // The screenshot shows "9/6/2025".
                            const dateStr = row.Date;
                            const impressions = parseInt(row.Impressions, 10);
                            const clicks = parseInt(row.Clicks, 10);

                            if (!dateStr || isNaN(impressions) || isNaN(clicks)) {
                                console.warn("Skipping invalid row:", row);
                                failCount++;
                                continue;
                            }

                            const date = new Date(dateStr);
                            if (isNaN(date.getTime())) {
                                console.warn("Skipping invalid date:", dateStr);
                                failCount++;
                                continue;
                            }

                            const payload = {
                                date: date,
                                impressions,
                                clicks,
                                sourceId,
                            };

                            const response = await fetch(`/api/gigs/${gigId}/performance`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(payload),
                            });

                            if (!response.ok) {
                                throw new Error(`Failed to save data for ${dateStr}`);
                            }
                            successCount++;

                        } catch (err) {
                            console.error(err);
                            failCount++;
                        }
                    }

                    toast({
                        title: "Import Complete",
                        description: `Successfully imported ${successCount} records. ${failCount > 0 ? `Failed: ${failCount}` : ""}`,
                        variant: failCount > 0 ? "default" : "default", // Could use a warning variant if we had one
                    });

                    if (onSuccess) {
                        onSuccess();
                    }

                } catch (error) {
                    console.error("Import Error:", error);
                    toast({
                        variant: "destructive",
                        title: "Import Failed",
                        description: "An unexpected error occurred during import.",
                    });
                } finally {
                    setIsImporting(false);
                    if (fileInputRef.current) {
                        fileInputRef.current.value = ""; // Reset input
                    }
                }
            },
            error: (error) => {
                console.error("Papa Parse Error:", error);
                toast({
                    variant: "destructive",
                    title: "CSV Read Error",
                    description: "Could not read the CSV file.",
                });
                setIsImporting(false);
            }
        });
    };

    const handleButtonClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <>
            <input
                type="file"
                accept=".csv"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
            />
            <Button
                variant="ghost"
                size="sm"
                onClick={handleButtonClick}
                disabled={isImporting}
            >
                {isImporting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <Upload className="mr-2 h-4 w-4" />
                )}
                {isImporting ? "Importing..." : "Import CSV"}
            </Button>
        </>
    );
}
