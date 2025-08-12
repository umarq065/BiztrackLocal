"use client";

import { useState, useEffect, memo } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

const collectionsToClear = [
    { id: "businessNotes", label: "Business Notes" },
    { id: "clients", label: "Clients" },
    { id: "competitors", label: "Competitors" },
    { id: "dailySummaries", label: "Daily Summaries" },
    { id: "expenseCategories", label: "Expense Categories" },
    { id: "expenses", label: "Expenses" },
    { id: "incomes", label: "Income Sources & Gigs" },
    { id: "monthlyTargets", label: "Monthly Targets" },
    { id: "orders", label: "Orders" },
];

const SettingsPageComponent = () => {
  const [timezones, setTimezones] = useState<string[]>([]);
  const [selectedTimezone, setSelectedTimezone] = useState<string>("");
  const [geminiApiKey, setGeminiApiKey] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedCollections, setSelectedCollections] = useState<Record<string, boolean>>({});
  const [deleteStep, setDeleteStep] = useState(0);

  const { toast } = useToast();

  useEffect(() => {
    async function fetchSettingsData() {
      setIsLoading(true);
      try {
        // Fetch saved settings
        const response = await fetch('/api/settings');
        if (!response.ok) throw new Error('Failed to fetch settings');
        const savedSettings = await response.json();
        
        // Populate timezones
        const allTimezones = Intl.supportedValuesOf('timeZone');
        setTimezones(allTimezones);

        // Set selected timezone from DB or default to browser's timezone
        if (savedSettings?.timezone && allTimezones.includes(savedSettings.timezone)) {
          setSelectedTimezone(savedSettings.timezone);
        } else {
           const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
           if (allTimezones.includes(userTimezone)) {
             setSelectedTimezone(userTimezone);
           } else if (allTimezones.length > 0) {
             setSelectedTimezone(allTimezones[0]);
           }
        }

        // Set Gemini API Key
        if (savedSettings?.geminiApiKey) {
            setGeminiApiKey(savedSettings.geminiApiKey);
        }

      } catch (error) {
        console.error("Failed to load settings:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not load settings. Using defaults.",
        });
        // Fallback to browser default on error
        const allTimezones = Intl.supportedValuesOf('timeZone');
        if (allTimezones.length > 0) {
            const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            setTimezones(allTimezones);
            setSelectedTimezone(allTimezones.includes(userTimezone) ? userTimezone : allTimezones[0]);
        }
      } finally {
        setIsLoading(false);
      }
    }

    fetchSettingsData();
  }, [toast]);

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            timezone: selectedTimezone,
            geminiApiKey: geminiApiKey,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save settings');
      }

      toast({
        title: "Settings Saved",
        description: `Your settings have been updated successfully.`,
      });
    } catch (error) {
       console.error("Failed to save settings:", error);
       toast({
        variant: "destructive",
        title: "Error",
        description: (error as Error).message || "Could not save settings. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCollectionToggle = (collectionId: string, checked: boolean) => {
    setSelectedCollections(prev => ({ ...prev, [collectionId]: checked }));
  };

  const numSelectedCollections = Object.values(selectedCollections).filter(Boolean).length;
  
  const handleClearData = async () => {
    setIsDeleting(true);
    const collectionsToClear = Object.keys(selectedCollections).filter(key => selectedCollections[key]);
    
    try {
        const response = await fetch('/api/settings/clear-data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ collections: collectionsToClear }),
        });
        
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || "Failed to clear data.");
        }
        
        toast({ title: "Data Cleared", description: result.message });
        setSelectedCollections({});
        setDeleteStep(0);
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Error",
            description: (error as Error).message || "An unexpected error occurred."
        });
    } finally {
        setIsDeleting(false);
    }
  };

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center">
        <h1 className="font-headline text-lg font-semibold md:text-2xl">
          Settings
        </h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
          <CardDescription>
            Manage your application-wide settings here.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-full max-w-sm" />
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select value={selectedTimezone} onValueChange={setSelectedTimezone} disabled={timezones.length === 0}>
                <SelectTrigger id="timezone" className="w-full max-w-sm">
                  <SelectValue placeholder="Select a timezone" />
                </SelectTrigger>
                <SelectContent>
                  {timezones.map((tz) => (
                    <SelectItem key={tz} value={tz}>
                      {tz}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
               <p className="text-sm text-muted-foreground">Set your preferred time zone for all date and time displays.</p>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button className="ml-auto" onClick={handleSaveChanges} disabled={isLoading || isSaving}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </CardFooter>
      </Card>

       <Card>
        <CardHeader>
          <CardTitle>API Keys</CardTitle>
          <CardDescription>
            Manage third-party API keys for AI features and integrations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-full max-w-sm" />
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="gemini-api-key">Gemini API Key</Label>
              <Input 
                id="gemini-api-key"
                type="password" 
                className="w-full max-w-sm"
                placeholder="Enter your Gemini API Key"
                value={geminiApiKey}
                onChange={(e) => setGeminiApiKey(e.target.value)}
              />
               <p className="text-sm text-muted-foreground">This key will be used for all Generative AI features.</p>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button className="ml-auto" onClick={handleSaveChanges} disabled={isLoading || isSaving}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </CardFooter>
      </Card>
      
      <Card className="border-destructive">
          <CardHeader>
              <CardTitle>Danger Zone</CardTitle>
              <CardDescription>These actions are irreversible. Please proceed with caution.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
              <div>
                  <Label className="text-base font-semibold">Clear Database Collections</Label>
                  <p className="text-sm text-muted-foreground">Select the collections you want to permanently delete all data from.</p>
              </div>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                  {collectionsToClear.map(collection => (
                      <div key={collection.id} className="flex items-center space-x-2">
                          <Checkbox 
                              id={collection.id}
                              checked={!!selectedCollections[collection.id]}
                              onCheckedChange={(checked) => handleCollectionToggle(collection.id, !!checked)}
                          />
                          <Label htmlFor={collection.id} className="font-normal">{collection.label}</Label>
                      </div>
                  ))}
              </div>
          </CardContent>
          <CardFooter>
              <Button 
                variant="destructive" 
                className="ml-auto"
                disabled={numSelectedCollections === 0}
                onClick={() => setDeleteStep(1)}
              >
                  Clear {numSelectedCollections > 0 ? numSelectedCollections : ''} Collection{numSelectedCollections === 1 ? '' : 's'}
              </Button>
          </CardFooter>
      </Card>

        <AlertDialog open={deleteStep > 0} onOpenChange={(open) => !open && setDeleteStep(0)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        {deleteStep === 1 ? "Are you absolutely sure?" : "Final Confirmation"}
                    </AlertDialogTitle>
                    <AlertDialogDescription asChild>
                         {deleteStep === 1 ? (
                            <div>
                                You are about to permanently delete all data from the following collection(s):
                                <ul className="list-disc pl-5 mt-2 font-medium">
                                    {Object.keys(selectedCollections).filter(k => selectedCollections[k]).map(k => (
                                        <li key={k}>{collectionsToClear.find(c => c.id === k)?.label}</li>
                                    ))}
                                </ul>
                                <p className="mt-2">This action cannot be undone.</p>
                            </div>
                         ) : (
                            <div>This is your final warning. Once deleted, the data cannot be recovered.</div>
                         )}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setDeleteStep(0)} disabled={isDeleting}>Cancel</AlertDialogCancel>
                    {deleteStep === 1 && (
                        <Button variant="destructive" onClick={() => setDeleteStep(2)}>Continue</Button>
                    )}
                    {deleteStep === 2 && (
                         <AlertDialogAction onClick={handleClearData} disabled={isDeleting} className={cn(buttonVariants({ variant: "destructive" }))}>
                            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Delete Permanently
                        </AlertDialogAction>
                    )}
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </main>
  );
};

const MemoizedSettingsPage = memo(SettingsPageComponent);

export default function SettingsPage() {
    return <MemoizedSettingsPage />;
}
