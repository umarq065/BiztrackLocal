
"use client";

import { memo } from "react";
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
import { Textarea } from "@/components/ui/textarea";

const BusinessProfilePageComponent = () => {
  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center">
        <h1 className="font-headline text-lg font-semibold md:text-2xl">
          Business Profile
        </h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Your Business Information</CardTitle>
          <CardDescription>
            Update your business details here.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="business-name">Business Name</Label>
            <Input id="business-name" defaultValue="BizTrack Pro" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Contact Email</Label>
            <Input id="email" type="email" defaultValue="contact@biztrackpro.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input id="address" defaultValue="123 Business Rd, Suite 456, Commerce City, USA" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bio">Short Bio / Tagline</Label>
            <Textarea id="bio" defaultValue="The best way to track your business performance and CRM." />
          </div>
        </CardContent>
        <CardFooter>
          <Button className="ml-auto">Save Changes</Button>
        </CardFooter>
      </Card>
    </main>
  );
}

const MemoizedBusinessProfilePage = memo(BusinessProfilePageComponent);

export default function BusinessProfilePage() {
  return <MemoizedBusinessProfilePage />;
}
