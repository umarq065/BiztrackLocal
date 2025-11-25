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

import { type DashboardOverviewData } from "@/lib/services/analyticsService";

interface AiInsightsProps {
  initialInsights: string;
  dashboardMetrics: Partial<DashboardOverviewData>;
}

export default function AiInsights({ initialInsights, dashboardMetrics }: AiInsightsProps) {
  const [insights, setInsights] = useState(initialInsights);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleGenerateInsights = async () => {
    setLoading(true);
    setInsights("");
    try {
      // Construct input from real dashboard data
      const totalRevenue = dashboardMetrics.totalRevenue?.value || 0;
      const totalExpenses = 0; // We might need to fetch this or derive it if available in metrics
      // Actually, netProfit is available in dashboardMetrics
      const netProfit = dashboardMetrics.netProfit?.value || 0;
      const orderCount = dashboardMetrics.orderMetrics?.total || 0;
      const averageOrderValue = dashboardMetrics.averageOrderValue?.value || 0;
      const monthlyTargetRevenue = dashboardMetrics.monthlyTarget || 0;
      const averageDailyRevenue = dashboardMetrics.keyMetrics?.adr || 0;
      const requiredDailyRevenue = dashboardMetrics.requiredDailyRevenue || 0;

      const input = {
        totalRevenue,
        totalExpenses: totalRevenue - netProfit, // Derive expenses
        netProfit,
        orderCount,
        clientAcquisitionRate: 0, // Not yet calculated
        repeatClientRate: 0, // Not yet calculated
        averageOrderValue,
        monthlyTargetRevenue,
        averageDailyRevenue,
        requiredDailyRevenue,
        // Optional fields left undefined
        // dailyRevenueTrendGraph: ...,
        // netProfitGraph: ...,
        // incomeBySourceChart: ...,
        competitorOrderCount: 0,
        additionalNotes: "Generated from live dashboard data."
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
      <Card className="relative h-full border-0 bg-card/90 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-card-foreground">
            <Wand2 className="h-5 w-5 text-purple-500" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-pink-600">
              AI-Powered Insights
            </span>
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Get AI-driven recommendations based on your data.
          </CardDescription>
        </CardHeader>
        <CardContent className="min-h-[160px]">
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full bg-muted" />
              <Skeleton className="h-4 w-full bg-muted" />
              <Skeleton className="h-4 w-3/4 bg-muted" />
              <Skeleton className="h-4 w-1/2 bg-muted" />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground leading-relaxed">{insights}</p>
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
