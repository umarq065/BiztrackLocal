"use client";

import { useState, useRef } from "react";
import { Upload, Loader2, FileText, CheckCircle, AlertCircle } from "lucide-react";
import Papa from "papaparse";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import type { IncomeSource } from "@/lib/data/incomes-data";
import { cn } from "@/lib/utils";

interface ImportGigDataDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    incomeSources: IncomeSource[];
    onSuccess?: () => void;
}

interface CsvData {
    Date: string;
    Impressions: string;
    Clicks: string;
}

export function ImportGigDataDialog({
    open,
    onOpenChange,
    incomeSources,
    onSuccess,
}: ImportGigDataDialogProps) {
    const [selectedSourceId, setSelectedSourceId] = useState<string>("");
    const [selectedGigId, setSelectedGigId] = useState<string>("");
    const [file, setFile] = useState<File | null>(null);
    const [isImporting, setIsImporting] = useState(false);
    const [parseStats, setParseStats] = useState<{ total: number; valid: number } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    const selectedSource = incomeSources.find((s) => s.id === selectedSourceId);
    const gigs = selectedSource?.gigs || [];

    const resetState = () => {
        setSelectedSourceId("");
        setSelectedGigId("");
        setFile(null);
        setParseStats(null);
        setIsImporting(false);
    };

    const handleOpenChange = (newOpen: boolean) => {
        if (!newOpen) {
            resetState();
        }
        onOpenChange(newOpen);
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            // Optional: Pre-parse to show stats or validate immediately
            validateFile(selectedFile);
        }
    };

    const validateFile = (file: File) => {
        Papa.parse<CsvData>(file, {
            header: true,
            skipEmptyLines: true,
            preview: 5, // Just check headers and first few rows
            complete: (results) => {
                const { data, meta } = results;
                if (meta.fields && (!meta.fields.includes("Date") || !meta.fields.includes("Impressions") || !meta.fields.includes("Clicks"))) {
                    toast({
                        variant: "destructive",
                        title: "Invalid CSV Format",
                        description: "CSV must have headers: Date, Impressions, Clicks",
                    });
                    setFile(null); // Clear invalid file
                }
            }
        });
    }

    const handleImport = async () => {
        if (!file || !selectedGigId || !selectedSourceId) return;

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
                            description: "There were errors parsing the CSV file.",
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

                    let successCount = 0;
                    let failCount = 0;

                    // Process rows
                    for (const row of data) {
                        try {
                            const dateStr = row.Date;
                            const impressions = parseInt(row.Impressions, 10);
                            const clicks = parseInt(row.Clicks, 10);

                            if (!dateStr || isNaN(impressions) || isNaN(clicks)) {
                                failCount++;
                                continue;
                            }

                            const date = new Date(dateStr);
                            if (isNaN(date.getTime())) {
                                failCount++;
                                continue;
                            }

                            const payload = {
                                date: date,
                                impressions,
                                clicks,
                                sourceId: selectedSourceId,
                            };

                            const response = await fetch(`/api/gigs/${selectedGigId}/performance`, {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
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
                        description: `Successfully imported ${successCount} records. ${failCount > 0 ? `Failed: ${failCount}` : ""
                            }`,
                    });

                    if (onSuccess) onSuccess();
                    handleOpenChange(false);
                } catch (error) {
                    console.error("Import Error:", error);
                    toast({
                        variant: "destructive",
                        title: "Import Failed",
                        description: "An unexpected error occurred during import.",
                    });
                } finally {
                    setIsImporting(false);
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
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[500px] glass border-white/10">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-headline">Import Gig Data</DialogTitle>
                    <DialogDescription>
                        Upload a CSV file to import performance metrics (Impressions, Clicks).
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="source">Income Source</Label>
                        <Select value={selectedSourceId} onValueChange={(val) => { setSelectedSourceId(val); setSelectedGigId(""); }}>
                            <SelectTrigger id="source" className="bg-white/5 border-white/10">
                                <SelectValue placeholder="Select source..." />
                            </SelectTrigger>
                            <SelectContent>
                                {incomeSources.map((source) => (
                                    <SelectItem key={source.id} value={source.id}>
                                        {source.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="gig">Gig</Label>
                        <Select value={selectedGigId} onValueChange={setSelectedGigId} disabled={!selectedSourceId}>
                            <SelectTrigger id="gig" className="bg-white/5 border-white/10">
                                <SelectValue placeholder={selectedSourceId ? "Select gig..." : "Select source first"} />
                            </SelectTrigger>
                            <SelectContent>
                                {gigs.map((gig) => (
                                    <SelectItem key={gig.id} value={gig.id}>
                                        {gig.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label>CSV File</Label>
                        <div
                            className={cn(
                                "border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors",
                                file ? "border-primary/50 bg-primary/5" : "border-white/10 hover:border-white/20 hover:bg-white/5"
                            )}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input
                                type="file"
                                accept=".csv"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                className="hidden"
                            />
                            {file ? (
                                <div className="flex flex-col items-center gap-2">
                                    <FileText className="h-8 w-8 text-primary" />
                                    <span className="font-medium text-sm">{file.name}</span>
                                    <span className="text-xs text-muted-foreground">Click to change</span>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-2">
                                    <Upload className="h-8 w-8 text-muted-foreground" />
                                    <span className="font-medium text-sm">Click to upload CSV</span>
                                    <span className="text-xs text-muted-foreground">Format: Date, Impressions, Clicks</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={() => handleOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleImport} disabled={!file || !selectedGigId || isImporting} className="bg-primary hover:bg-primary/90 shadow-glow">
                        {isImporting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Importing...
                            </>
                        ) : (
                            "Import Data"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
