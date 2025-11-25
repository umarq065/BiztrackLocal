import { ai } from '../src/ai/genkit';
import { z } from 'genkit';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const GenerateBusinessInsightsInputSchema = z.object({
    totalRevenue: z.number().describe('The total revenue for the selected period.'),
    totalExpenses: z.number().describe('The total expenses for the selected period.'),
    netProfit: z.number().describe('The net profit for the selected period.'),
    orderCount: z.number().describe('The total number of orders for the selected period.'),
    clientAcquisitionRate: z
        .number()
        .optional()
        .describe('The rate of new client acquisition for the selected period.'),
    repeatClientRate: z
        .number()
        .optional()
        .describe('The rate of repeat clients for the selected period.'),
    averageOrderValue: z
        .number()
        .describe('The average order value for the selected period.'),
    monthlyTargetRevenue: z.number().describe('The monthly target revenue.'),
    averageDailyRevenue: z.number().describe('The average daily revenue.'),
    requiredDailyRevenue: z.number().describe(
        'The required daily revenue to meet the monthly target.'
    ),
    dailyRevenueTrendGraph: z
        .string()
        .optional()
        .describe('A data URI representing the daily revenue trend graph.'),
    netProfitGraph: z.string().optional().describe('A data URI representing the net profit graph.'),
    incomeBySourceChart: z.string().optional().describe('A data URI representing the income by source chart.'),
    competitorOrderCount: z
        .number()
        .optional()
        .describe('The average order count of competitors for the selected period.'),
    additionalNotes: z.string().optional().describe('Additional notes about the business.'),
});

const GenerateBusinessInsightsOutputSchema = z.object({
    insights: z.string().describe('AI-generated insights and recommendations.'),
});

const prompt = ai.definePrompt({
    name: 'testGenerateBusinessInsightsPrompt',
    input: { schema: GenerateBusinessInsightsInputSchema },
    output: { schema: GenerateBusinessInsightsOutputSchema },
    prompt: `You are an AI-powered business consultant. Analyze the following business data and provide insights and recommendations to improve business performance.

Business Data:
Total Revenue: {{{totalRevenue}}}
Total Expenses: {{{totalExpenses}}}
Net Profit: {{{netProfit}}}
Order Count: {{{orderCount}}}
Client Acquisition Rate: {{{clientAcquisitionRate}}}
Repeat Client Rate: {{{repeatClientRate}}}
Average Order Value: {{{averageOrderValue}}}
Monthly Target Revenue: {{{monthlyTargetRevenue}}}
Average Daily Revenue: {{{averageDailyRevenue}}}
Required Daily Revenue: {{{requiredDailyRevenue}}}
Competitor Order Count: {{{competitorOrderCount}}}

Charts:
{{#dailyRevenueTrendGraph}}
Daily Revenue Trend Graph: {{media url=dailyRevenueTrendGraph}}
{{/dailyRevenueTrendGraph}}
{{#netProfitGraph}}
Net Profit Graph: {{media url=netProfitGraph}}
{{/netProfitGraph}}
{{#incomeBySourceChart}}
Income by Source Chart: {{media url=incomeBySourceChart}}
{{/incomeBySourceChart}}

Additional Notes: {{{additionalNotes}}}

Provide actionable insights and recommendations based on the provided data. Focus on areas for improvement, and strategies to increase revenue and profitability.`,
});

async function main() {
    console.log("Testing Full AI Flow with Zeros...");
    const input = {
        totalRevenue: 0,
        totalExpenses: 0,
        netProfit: 0,
        orderCount: 0,
        clientAcquisitionRate: 0,
        repeatClientRate: 0,
        averageOrderValue: 0,
        monthlyTargetRevenue: 0,
        averageDailyRevenue: 0,
        requiredDailyRevenue: 0,
        competitorOrderCount: 0,
        additionalNotes: "Generated from live dashboard data."
    };

    try {
        const { output } = await prompt(input);
        console.log("Result:", output);
    } catch (error) {
        console.error("Flow Error:", error);
    }
}

main();
