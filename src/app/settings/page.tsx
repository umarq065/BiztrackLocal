
"use client";

import { useState, useEffect, memo } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
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
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

const collectionsToClear = [
    { id: 'businessNotes', label: 'Business Notes' },
    { id: 'clients', label: 'Clients' },
    { id: 'competitors', label: 'Competitors' },
    { id: 'dailySummaries', label: 'Daily Summaries' },
    { id: 'expenseCategories', label: 'Expense Categories' },
    { id: 'expenses', label: 'Expenses' },
    { id: 'incomes', label: 'Incomes' },
    { id: 'monthlyTargets', label: 'Monthly Targets' },
    { id: 'orders', label: 'Orders' },
];

const SettingsPageComponent = () => {
  const [timezones, setTimezones] = useState<string[]>([]);
  const [selectedTimezone, setSelectedTimezone] = useState<string>("");
  const [geminiApiKey, setGeminiApiKey] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [selectedCollections, setSelectedCollections] = useState<Record<string, boolean>>({});
  const [isClearDataDialogOpen, setIsClearDataDialogOpen] = useState(false);
  const [clearDataStep, setClearDataStep] = useState(1);
  const [confirmDeleteInput, setConfirmDeleteInput] = useState("");
  const [isClearingData, setIsClearingData] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    async function fetchSettingsData() {
      setIsLoading(true);
      try {
        const response = await fetch('/api/settings');
        if (!response.ok) throw new Error('Failed to fetch settings');
        const savedSettings = await response.json();
        
        const allTimezones = Intl.supportedValuesOf('timeZone');
        setTimezones(allTimezones);

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

  const handleClearData = async () => {
    setIsClearingData(true);
    const collectionsToClear = Object.keys(selectedCollections).filter(k => selectedCollections[k]);
    try {
        const response = await fetch('/api/settings/clear-data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ collections: collectionsToClear }),
        });

        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.error || 'Failed to clear data');
        }
        
        toast({
            title: "Data Cleared",
            description: "Selected collections have been cleared successfully.",
        });
        
    } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
    } finally {
        setIsClearingData(false);
        setConfirmDeleteInput("");
        setClearDataStep(1);
        setSelectedCollections({});
        setIsClearDataDialogOpen(false);
    }
  };
  
  const selectedCount = Object.values(selectedCollections).filter(Boolean).length;

  return (
    <>
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
              <CardDescription>
                  Permanently delete all data from selected database collections. This action cannot be undone.
              </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
              <div className="space-y-2">
                  <Label>Select Collections to Clear</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 rounded-md border p-4">
                      {collectionsToClear.map((collection) => (
                          <div key={collection.id} className="flex items-center space-x-2">
                              <Checkbox
                                  id={`collection-${collection.id}`}
                                  checked={selectedCollections[collection.id] || false}
                                  onCheckedChange={(checked) => setSelectedCollections(prev => ({ ...prev, [collection.id]: !!checked }))}
                              />
                              <label htmlFor={`collection-${collection.id}`} className="text-sm font-medium leading-none">
                                  {collection.label}
                              </label>
                          </div>
                      ))}
                  </div>
              </div>
          </CardContent>
          <CardFooter>
              <Button variant="destructive" className="ml-auto" disabled={selectedCount === 0} onClick={() => setIsClearDataDialogOpen(true)}>
                  Clear {selectedCount > 0 ? `${selectedCount} ` : ''}Collection{selectedCount > 1 ? 's' : ''}
              </Button>
          </CardFooter>
        </Card>
    </main>
    
    <AlertDialog open={isClearDataDialogOpen} onOpenChange={setIsClearDataDialogOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>
                    {clearDataStep === 1 && "Are you absolutely sure?"}
                    {clearDataStep === 2 && "Final Confirmation"}
                </AlertDialogTitle>
                <AlertDialogDescription asChild>
                    {clearDataStep === 1 ? (
                        <div>
                            <p>This will permanently delete all data from the following collection(s):</p>
                            <ul className="list-disc pl-5 mt-2 font-medium text-destructive">
                                {Object.keys(selectedCollections).filter(k => selectedCollections[k]).map(k => (
                                    <li key={k}>{collectionsToClear.find(c => c.id === k)?.label}</li>
                                ))}
                            </ul>
                            <p className="mt-2">This action is irreversible.</p>
                        </div>
                    ) : (
                         <div>
                            <p>This is your final warning. To proceed, please type "DELETE" in the box below.</p>
                         </div>
                    )}
                </AlertDialogDescription>
            </AlertDialogHeader>
             {clearDataStep === 2 && (
                <Input
                    value={confirmDeleteInput}
                    onChange={(e) => setConfirmDeleteInput(e.target.value)}
                    placeholder="Type DELETE to confirm"
                    autoFocus
                />
            )}
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setClearDataStep(1)}>Cancel</AlertDialogCancel>
                {clearDataStep === 1 && (
                    <AlertDialogAction
                        className={cn(buttonVariants({ variant: "destructive" }))}
                        onClick={() => setClearDataStep(2)}
                    >
                        I understand, proceed
                    </AlertDialogAction>
                )}
                {clearDataStep === 2 && (
                     <AlertDialogAction
                        className={cn(buttonVariants({ variant: "destructive" }))}
                        disabled={confirmDeleteInput !== 'DELETE' || isClearingData}
                        onClick={handleClearData}
                    >
                         {isClearingData && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Delete Data
                    </AlertDialogAction>
                )}
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>

    </>
  );
};

const MemoizedSettingsPage = memo(SettingsPageComponent);

export default function SettingsPage() {
    return <MemoizedSettingsPage />;
}
