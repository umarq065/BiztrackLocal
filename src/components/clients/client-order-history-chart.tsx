
"use client";

import { useMemo, useState } from "react";
import { Bar, BarChart, Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Text } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from "@/components/ui/chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from "@/components/ui/button";
import { BarChart2, LineChartIcon } from "lucide-react";
import { 
    format, 
    startOfWeek,
    endOfWeek,
    startOfMonth, 
    startOfQuarter,
    startOfYear,
    getQuarter, 
    getYear, 
    parseISO,
    eachDayOfInterval,
    eachWeekOfInterval,
    eachMonthOfInterval,
    eachQuarterOfInterval,
    eachYearOfInterval,
    isWithinInterval,
} from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


interface Order {
    date: string;
    dateObj: Date;
    amount: number;
    id: string;
}

interface ClientOrderHistoryChartProps {
    data: Order[];
}

const chartConfig = {
    amount: {
        label: "Order Amount",
        color: "hsl(var(--chart-1))",
    },
} satisfies ChartConfig;

type ChartView = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

const CustomXAxisTick = ({ x, y, payload }: any) => {
    if (payload && payload.value) {
        // Split value into parts if it contains a newline character
        const parts = String(payload.value).split('\n');
        return (
            <Text x={x} y={y} dy={16} textAnchor="middle" fill="#666" fontSize={12}>
                {parts.map((part, index) => (
                    <tspan x={x} dy={index > 0 ? "1.2em" : 0} key={index}>{part}</tspan>
                ))}
            </Text>
        );
    }
    return null;
};


export default function ClientOrderHistoryChart({ data }: ClientOrderHistoryChartProps) {
    const [chartType, setChartType] = useState<'bar' | 'line'>('bar');
    const [chartView, setChartView] = useState<ChartView>('monthly');

    const chartData = useMemo(() => {
        if (!data || data.length === 0) return [];

        const sortedData = data.sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
        const firstOrderDate = sortedData[0].dateObj;
        const lastOrderDate = sortedData[sortedData.length - 1].dateObj;
        const interval = { start: firstOrderDate, end: lastOrderDate };
        
        if (chartView === 'daily') {
             return sortedData.map(order => ({
                ...order,
                dateLabel: format(order.dateObj, "MMM d"),
            }));
        }

        const aggregatedData: Record<string, { amount: number, count: number, dateObj: Date }> = {};
        
        sortedData.forEach(order => {
            let key = '';
            const date = order.dateObj;

            switch(chartView) {
                case 'weekly':
                    key = format(startOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd');
                    break;
                case 'monthly':
                    key = format(startOfMonth(date), 'yyyy-MM');
                    break;
                case 'quarterly':
                     const quarter = getQuarter(date);
                     key = `${getYear(date)}-Q${quarter}`;
                    break;
                case 'yearly':
                    key = getYear(date).toString();
                    break;
            }

            if (!aggregatedData[key]) {
                aggregatedData[key] = { amount: 0, count: 0, dateObj: date };
            }
            aggregatedData[key].amount += order.amount;
            aggregatedData[key].count++;
        });

        // Generate all intervals and fill in gaps
        let allIntervals: Date[];
        switch (chartView) {
            case 'weekly': allIntervals = eachWeekOfInterval(interval, { weekStartsOn: 1 }); break;
            case 'monthly': allIntervals = eachMonthOfInterval(interval); break;
            case 'quarterly': allIntervals = eachQuarterOfInterval(interval); break;
            case 'yearly': allIntervals = eachYearOfInterval(interval); break;
            default: allIntervals = [];
        }

        return allIntervals.map(intervalDate => {
            let key = '';
            let dateLabel = '';
            
            switch (chartView) {
                case 'weekly': {
                    key = format(intervalDate, 'yyyy-MM-dd');
                    const weekEnd = endOfWeek(intervalDate, { weekStartsOn: 1 });
                    const startMonth = format(intervalDate, 'MMM');
                    const endMonth = format(weekEnd, 'MMM');
                    const startDay = format(intervalDate, 'd');
                    const endDay = format(weekEnd, 'd');
                    const year = format(intervalDate, 'yyyy');

                    if (startMonth === endMonth) {
                        dateLabel = `${startMonth} ${startDay}-${endDay}\n${year}`;
                    } else {
                        dateLabel = `${startMonth} ${startDay} - ${endMonth} ${endDay}\n${year}`;
                    }
                    break;
                }
                case 'monthly':
                    key = format(intervalDate, 'yyyy-MM');
                    dateLabel = format(intervalDate, "MMM yyyy");
                    break;
                case 'quarterly':
                    const quarter = getQuarter(intervalDate);
                    key = `${getYear(intervalDate)}-Q${quarter}`;
                    dateLabel = key;
                    break;
                case 'yearly':
                    key = getYear(intervalDate).toString();
                    dateLabel = key;
                    break;
            }

            const dataPoint = aggregatedData[key];
            return {
                dateLabel,
                amount: dataPoint ? dataPoint.amount : 0,
                count: dataPoint ? dataPoint.count : 0,
                dateObj: intervalDate
            };
        });

    }, [data, chartView]);

    const ChartTooltipContentCustom = (
        <ChartTooltipContent 
            formatter={(value, name, props) => {
                const payload = props.payload as any;
                if (payload.count) {
                   return [`$${(value as number).toFixed(2)} from ${payload.count} orders`, "Amount"];
                }
                return [`$${(value as number).toFixed(2)}`, "Amount"]
            }}
            labelFormatter={(label, payload) => {
                const order = payload?.[0]?.payload;
                if (!order) return label;
                
                if (chartView === 'daily') {
                    return (
                        <div>
                            <div>{format(order.dateObj, 'PPP')}</div>
                            <div className="text-xs text-muted-foreground">ID: {order.id}</div>
                        </div>
                    )
                }
                return String(label).replace('\n', ' ');
            }}
            indicator="dot" 
        />
    );


    return (
        <Card>
            <CardHeader className="flex flex-row items-start justify-between">
                <div>
                    <CardTitle>Order History Graph</CardTitle>
                    <CardDescription>A visual representation of the client's orders over time.</CardDescription>
                </div>
                 <div className="flex items-center gap-2">
                    <Select value={chartView} onValueChange={(value) => setChartView(value as ChartView)}>
                        <SelectTrigger className="w-[120px]">
                            <SelectValue placeholder="Select view" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="quarterly">Quarterly</SelectItem>
                            <SelectItem value="yearly">Yearly</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button
                        variant={chartType === 'bar' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setChartType('bar')}
                        aria-label="Switch to Bar Chart"
                    >
                        <BarChart2 className="h-4 w-4" />
                        <span className="ml-2 hidden sm:inline">Bar</span>
                    </Button>
                    <Button
                        variant={chartType === 'line' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setChartType('line')}
                        aria-label="Switch to Line Chart"
                    >
                        <LineChartIcon className="h-4 w-4" />
                        <span className="ml-2 hidden sm:inline">Line</span>
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="pl-2">
                {chartData.length > 0 ? (
                    <ChartContainer config={chartConfig} className="h-[350px] w-full">
                       {chartType === 'bar' ? (
                            <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: chartView === 'weekly' ? 40 : (chartView === 'daily' ? 50 : 5), left: 20 }}>
                                <CartesianGrid vertical={false} />
                                <XAxis
                                    dataKey="dateLabel"
                                    tickLine={false}
                                    axisLine={false}
                                    interval="preserveStartEnd"
                                    height={chartView === 'weekly' ? 50 : (chartView === 'daily' ? 60 : 30)}
                                    tick={<CustomXAxisTick />}
                                />
                                <YAxis
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={8}
                                    tickFormatter={(value) => `$${value}`}
                                />
                                <Tooltip
                                    cursor={{ fill: 'hsl(var(--muted))' }}
                                    content={ChartTooltipContentCustom}
                                />
                                <Bar dataKey="amount" fill="var(--color-amount)" radius={4} />
                            </BarChart>
                       ) : (
                            <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: chartView === 'weekly' ? 40 : (chartView === 'daily' ? 50 : 5), left: 20 }}>
                                <CartesianGrid vertical={false} />
                                <XAxis
                                    dataKey="dateLabel"
                                    tickLine={false}
                                    axisLine={false}
                                    interval="preserveStartEnd"
                                    height={chartView === 'weekly' ? 50 : (chartView === 'daily' ? 60 : 30)}
                                    tick={<CustomXAxisTick />}
                                />
                                <YAxis
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={8}
                                    tickFormatter={(value) => `$${value}`}
                                />
                                <Tooltip
                                    cursor={false}
                                    content={ChartTooltipContentCustom}
                                />
                                <Line dataKey="amount" type="monotone" stroke="var(--color-amount)" strokeWidth={2} dot={false} activeDot={{ r: 6 }}/>
                            </LineChart>
                       )}
                    </ChartContainer>
                ) : (
                    <div className="flex h-[300px] w-full items-center justify-center">
                        <p className="text-muted-foreground">No order data to display chart.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
