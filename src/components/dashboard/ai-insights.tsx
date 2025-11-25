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
    <div className="relative group h-full">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-600 to-purple-600 rounded-xl opacity-75 blur transition duration-1000 group-hover:opacity-100 group-hover:duration-200 animate-tilt"></div>
      <Card className="relative h-full border-0 bg-black/40 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Wand2 className="h-5 w-5 text-purple-400" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
              AI-Powered Insights
            </span>
          </CardTitle>
          <CardDescription className="text-blue-200/60">
            Get AI-driven recommendations based on your data.
          </CardDescription>
        </CardHeader>
        <CardContent className="min-h-[160px]">
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full bg-white/10" />
              <Skeleton className="h-4 w-full bg-white/10" />
              <Skeleton className="h-4 w-3/4 bg-white/10" />
              <Skeleton className="h-4 w-1/2 bg-white/10" />
            </div>
          ) : (
            <p className="text-sm text-blue-100/90 leading-relaxed">{insights}</p>
          )}
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleGenerateInsights}
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0 shadow-lg shadow-purple-500/20 transition-all duration-300 hover:shadow-purple-500/40"
          >
            {loading ? (
              <>
                <Wand2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Wand2 className="mr-2 h-4 w-4" />
                Generate New Insights
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
