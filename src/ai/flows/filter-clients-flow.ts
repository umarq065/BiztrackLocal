
'use server';
/**
 * @fileOverview An AI flow for filtering clients based on a natural language queries.
 * 
 * - filterClients - A function that handles the client filtering process.
 * - ClientFilters - The return type for the filterClients function, defining the filter criteria.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ClientFiltersSchema = z.object({
    nameOrUsername: z.string().optional().describe('A partial or full name or username to search for.'),
    source: z.string().optional().describe('The income source of the client.'),
    clientType: z.enum(['New', 'Repeat']).optional().describe('The type of the client.'),
    isVip: z.boolean().optional().describe('Whether the client is a VIP.'),
    dateRange: z.object({
        from: z.string().optional().describe("The start date for the filter in 'YYYY-MM-DD' format."),
        to: z.string().optional().describe("The end date for the filter in 'YYYY-MM-DD' format.")
    }).optional().describe("A date range to filter clients by their last order date."),
    minTotalOrders: z.number().optional().describe('The minimum number of total orders a client has made.')
});
export type ClientFilters = z.infer<typeof ClientFiltersSchema>;

export async function filterClients(prompt: string): Promise<ClientFilters> {
  return filterClientsFlow(prompt);
}

const filterPrompt = ai.definePrompt({
  name: 'filterClientsPrompt',
  input: { schema: z.string() },
  output: { schema: ClientFiltersSchema },
  prompt: `You are an AI assistant that helps filter a list of clients based on a natural language query.
  Analyze the user's query and return a JSON object with the appropriate filter criteria.

  The available filters are:
  - nameOrUsername (string): Search by client name or username.
  - source (string): Filter by income source (e.g., 'Web Design', 'Consulting').
  - clientType ('New' or 'Repeat'): Filter by client type.
  - isVip (boolean): Filter VIP clients.
  - dateRange (object with 'from' and 'to' in 'YYYY-MM-DD' format): Filter by the client's last order date.
  - minTotalOrders (number): Filter by a minimum number of orders.

  Today's date is ${new Date().toISOString().split('T')[0]}. When asked about time periods like "last month", "this year", or "last summer", calculate the corresponding date range. For example, "last summer" could be from June to August of the previous year.

  User query: {{{input}}}
  `,
});

const filterClientsFlow = ai.defineFlow(
  {
    name: 'filterClientsFlow',
    inputSchema: z.string(),
    outputSchema: ClientFiltersSchema,
  },
  async (input) => {
    const { output } = await filterPrompt(input);
    return output!;
  }
);
