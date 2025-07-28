
"use client";

import { Suspense, lazy, useState, useMemo, memo, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { type YearlyStatsData, type SingleYearData } from "@/lib/data/yearly-stats-data";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChevronDown, Loader2 } from "lucide-react";


const MyOrdersVsCompetitorAvgChart = lazy(() => import("@/components/yearly-stats/my-orders-vs-competitor-avg-chart"));
const TotalYearlyOrdersDistributionChart = lazy(() => import("@/components/yearly-stats/total-yearly-orders-distribution-chart"));
const MonthlyOrdersVsCompetitorsChart = lazy(() => import("@/components/yearly-stats/monthly-orders-vs-competitors-chart"));
const MonthlyFinancialsChart = lazy(() => import("@/components/yearly-stats/monthly-financials-chart"));
const MonthlyRevenueVsTargetChart = lazy(() => import("@/components/yearly-stats/monthly-revenue-vs-target-chart"));
const YearlySummaryTable = lazy(() => import("@/components/yearly-stats/yearly-summary-table"));


const YearlyStatsPageComponent = () => {
    const currentYear = new Date().getFullYear();
    const availableYears = useMemo(() => Array.from({ length: 10 }, (_, i) => currentYear + 1 - i), [currentYear]);
    const [selectedYears, setSelectedYears] = useState<number[]>([currentYear]);
    
    const [fetchedData, setFetchedData] = useState<YearlyStatsData>({});
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
      async function fetchDataForYears() {
          setIsLoading(true);
          const yearsToFetch = selectedYears.filter(year => !fetchedData[year]);
          if (yearsToFetch.length === 0) {
            setIsLoading(false);
            return;
          }

          const dataPromises = yearsToFetch.map(year =>
              fetch(`/api/analytics/yearly-stats/${year}`)
                  .then(async res => {
                      if (!res.ok) {
                          const errorText = await res.text();
                          console.error(`Failed to fetch data for ${year}: ${res.status} ${errorText}`);
                          throw new Error(`Failed to fetch data for ${year}: ${res.status} ${errorText}`);
                      }
                      return res.json();
                  })
                  .then(data => ({ year, data }))
                  .catch(err => {
                      console.error(`Failed to fetch data for ${year}`, err);
                      return { year, data: null }; // Return null on error
                  })
          );
          
          const results = await Promise.all(dataPromises);
          
          const newData: YearlyStatsData = {};
          results.forEach(({ year, data }) => {
              if (data) {
                  newData[year] = data;
              }
          });
          
          setFetchedData(prev => ({...prev, ...newData}));
          setIsLoading(false);
      }
      fetchDataForYears();
    }, [selectedYears, fetchedData]);

    const handleYearToggle = (year: number) => {
        setSelectedYears(prev => {
            const newSelection = prev.includes(year)
                ? prev.filter(y => y !== year)
                : [...prev, year];
            if (newSelection.length === 0) return [year]; // Keep at least one year selected
            return newSelection.sort((a,b) => b-a);
        });
    };

    const yearsWithData = useMemo(() => {
      return selectedYears.map(year => fetchedData[year]).filter(Boolean);
    }, [selectedYears, fetchedData]);
    
  return (
    <main className="flex flex-1 flex-col gap-6 p-4 md:gap-8 md:p-8">
      <div className="flex items-center">
        <h1 className="font-headline text-lg font-semibold md:text-2xl">
          Yearly Stats
        </h1>
        <div className="ml-auto flex items-center gap-2">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-[180px]">
                        {isLoading && selectedYears.some(year => !fetchedData[year]) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> :
                         selectedYears.length > 1 ? `${selectedYears.length} years selected` : `Year: ${selectedYears[0]}`
                        }
                        <ChevronDown className="ml-auto h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                    <DropdownMenuLabel>Select Years</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {availableYears.map(year => (
                        <DropdownMenuCheckboxItem
                            key={year}
                            checked={selectedYears.includes(year)}
                            onSelect={(e) => e.preventDefault()}
                            onCheckedChange={() => handleYearToggle(year)}
                        >
                            {year}
                        </DropdownMenuCheckboxItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Suspense fallback={<Skeleton className="h-[500px] lg:col-span-2" />}>
            <MyOrdersVsCompetitorAvgChart allYearlyData={fetchedData} selectedYears={selectedYears}/>
        </Suspense>
        
        {isLoading && selectedYears.some(year => !fetchedData[year]) ? (
          <Skeleton className="h-[500px]" />
        ) : yearsWithData.length > 0 ? (
          <Card>
             <CardHeader>
                <CardTitle>Total Yearly Orders Distribution</CardTitle>
                <CardDescription>A pie chart showing the market share of orders between you and your competitors for {selectedYears.join(', ')}.</CardDescription>
            </CardHeader>
            <CardContent>
                <Suspense fallback={<Skeleton className="h-[300px]" />}>
                   <TotalYearlyOrdersDistributionChart yearsData={yearsWithData} />
                </Suspense>
            </CardContent>
          </Card>
        ) : (
          <Card className="flex items-center justify-center h-[500px]">
            <CardContent>
              <p className="text-muted-foreground">No data available for {selectedYears.join(', ')}.</p>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Suspense fallback={<Skeleton className="h-[500px]" />}>
          <MonthlyOrdersVsCompetitorsChart allYearlyData={fetchedData} selectedYears={selectedYears} />
        </Suspense>
      </div>

      <div className="grid grid-cols-1 gap-6">
          <Suspense fallback={<Skeleton className="h-[500px]" />}>
              <MonthlyRevenueVsTargetChart allYearlyData={fetchedData} selectedYears={selectedYears} />
          </Suspense>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
          <Suspense fallback={<Skeleton className="h-[500px]" />}>
              <MonthlyFinancialsChart allYearlyData={fetchedData} selectedYears={selectedYears} />
          </Suspense>
      </div>
      
      {selectedYears.map(year => (
        <div key={year} className="grid grid-cols-1 gap-6">
          <Suspense fallback={<Skeleton className="h-[500px]" />}>
            <YearlySummaryTable allYearlyData={fetchedData} selectedYear={year} />
          </Suspense>
        </div>
      ))}

    </main>
  );
}

const MemoizedYearlyStatsPage = memo(YearlyStatsPageComponent);

export default function YearlyStatsPage() {
  return <MemoizedYearlyStatsPage />;
}
