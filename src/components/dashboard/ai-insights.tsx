"use client";

import { useState } from "react";
import { Wand2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { generateBusinessInsights } from "@/ai/flows/generate-business-insights";
import { useToast } from "@/hooks/use-toast";

export default function AiInsights({ initialInsights }: { initialInsights: string }) {
  const [insights, setInsights] = useState(initialInsights);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleGenerateInsights = async () => {
    setLoading(true);
    setInsights("");
    try {
      // In a real app, this data would be dynamic based on filters.
      const input = {
        totalRevenue: 45231.89,
        totalExpenses: 10543.00,
        netProfit: 34688.89,
        orderCount: 12234,
        clientAcquisitionRate: 15,
        repeatClientRate: 34,
        averageOrderValue: 131.5,
        monthlyTargetRevenue: 50000,
        averageDailyRevenue: 1507.73,
        requiredDailyRevenue: 1625.6,
        // Chart data would be base64 encoded images in a real scenario
        dailyRevenueTrendGraph: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
        netProfitGraph: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
        incomeBySourceChart: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
        competitorOrderCount: 10500,
        additionalNotes: "Launched a new marketing campaign this month."
      };
      const result = await generateBusinessInsights(input);
      
      let animatedText = "";
      const words = result.insights.split(' ');
      for (const word of words) {
        animatedText += word + ' ';
        setInsights(animatedText);
        await new Promise(resolve => setTimeout(resolve, 50));
      }

    } catch (error) {
      console.error("Failed to generate insights:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not generate AI insights. Please try again.",
      });
      setInsights(initialInsights); // Restore initial insights on error
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wand2 className="text-primary" />
          <span>AI-Powered Insights</span>
        </CardTitle>
        <CardDescription>
          Get AI-driven recommendations based on your data.
        </CardDescription>
      </CardHeader>
      <CardContent className="min-h-[160px]">
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{insights}</p>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={handleGenerateInsights} disabled={loading} className="w-full">
          {loading ? "Generating..." : "Generate New Insights"}
        </Button>
      </CardFooter>
    </Card>
  );
}
