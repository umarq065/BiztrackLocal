
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { listTimeZones } from "date-fns-tz";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

const SettingsPageComponent = () => {
  const [timezones, setTimezones] = useState<string[]>([]);
  const [selectedTimezone, setSelectedTimezone] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const allTimezones = listTimeZones();
    setTimezones(allTimezones);
    
    // Set user's current timezone as default
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (allTimezones.includes(userTimezone)) {
      setSelectedTimezone(userTimezone);
    } else if (allTimezones.length > 0) {
      setSelectedTimezone(allTimezones[0]);
    }
    setIsLoading(false);
  }, []);

  const handleSaveChanges = () => {
    // In a real app, you would save this to a user profile in a database.
    toast({
      title: "Settings Saved",
      description: `Timezone set to ${selectedTimezone}.`,
    });
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
          <CardTitle>Time Zone</CardTitle>
          <CardDescription>
            Set your preferred time zone for all date and time displays.
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
              <Label htmlFor="timezone">Select Timezone</Label>
              <Select value={selectedTimezone} onValueChange={setSelectedTimezone}>
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
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button className="ml-auto" onClick={handleSaveChanges} disabled={isLoading}>
            Save Changes
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
};

const MemoizedSettingsPage = memo(SettingsPageComponent);

export default function SettingsPage() {
    return <MemoizedSettingsPage />;
}
