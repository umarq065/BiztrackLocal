
export interface CompetitorYearlyData {
    id: string;
    name: string;
    monthlyOrders: number[];
    totalOrders: number;
}

export interface MonthlyFinancials {
    month: string;
    revenue: number;
    expenses: number;
    profit: number;
}

export interface YearlyStatsData {
    myTotalYearlyOrders: number;
    monthlyOrders: number[];
    competitors: CompetitorYearlyData[];
    monthlyFinancials: MonthlyFinancials[];
    monthlyTargetRevenue: number[];
}

export const yearlyStatsData: YearlyStatsData = {
    myTotalYearlyOrders: 1550,
    monthlyOrders: [80, 95, 110, 120, 135, 150, 140, 160, 175, 185, 200, 220],
    competitors: [
        {
            id: 'comp1',
            name: 'Creative Solutions Inc.',
            monthlyOrders: [70, 80, 90, 100, 110, 120, 115, 125, 135, 145, 155, 165],
            totalOrders: 1410,
        },
        {
            id: 'comp2',
            name: 'Digital Masters Co.',
            monthlyOrders: [60, 75, 85, 95, 105, 115, 110, 120, 130, 140, 150, 160],
            totalOrders: 1345,
        },
        {
            id: 'comp3',
            name: 'Innovate Web Agency',
            monthlyOrders: [90, 105, 120, 130, 145, 160, 150, 170, 185, 195, 210, 230],
            totalOrders: 1890,
        },
    ],
    monthlyFinancials: [
        { month: 'Jan', revenue: 15000, expenses: 8000, profit: 7000 },
        { month: 'Feb', revenue: 17500, expenses: 9000, profit: 8500 },
        { month: 'Mar', revenue: 20000, expenses: 10000, profit: 10000 },
        { month: 'Apr', revenue: 22000, expenses: 11000, profit: 11000 },
        { month: 'May', revenue: 25000, expenses: 12000, profit: 13000 },
        { month: 'Jun', revenue: 28000, expenses: 13000, profit: 15000 },
        { month: 'Jul', revenue: 26000, expenses: 12500, profit: 13500 },
        { month: 'Aug', revenue: 30000, expenses: 14000, profit: 16000 },
        { month: 'Sep', revenue: 32000, expenses: 15000, profit: 17000 },
        { month: 'Oct', revenue: 35000, expenses: 16000, profit: 19000 },
        { month: 'Nov', revenue: 38000, expenses: 17000, profit: 21000 },
        { month: 'Dec', revenue: 42000, expenses: 18000, profit: 24000 },
    ],
    monthlyTargetRevenue: [16000, 18000, 19000, 21000, 24000, 27000, 25000, 29000, 31000, 34000, 37000, 40000],
};

