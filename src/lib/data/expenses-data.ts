import { z } from "zod";

export const expenseFormSchema = z.object({
  date: z.date({ required_error: "An expense date is required." }),
  type: z.string().min(2, { message: "Type must be at least 2 characters." }),
  amount: z.coerce.number().positive({ message: "Amount must be positive." }),
  category: z.string().min(1, { message: "Please select a category." }),
  recurring: z.boolean().default(false),
});

export type ExpenseFormValues = z.infer<typeof expenseFormSchema>;

export interface Expense {
    id: string;
    date: string;
    type: string;
    amount: number;
    category: string;
    recurring?: boolean;
}

export const initialExpenses: Expense[] = [
  // May 2024
  { id: "1", date: "2024-05-01", type: "Figma Subscription", amount: 49.99, category: "Software", recurring: true },
  { id: "2", date: "2024-05-05", type: "New Monitors", amount: 599.00, category: "Hardware" },
  { id: "3", date: "2024-05-10", type: "Google Ads", amount: 500.00, category: "Marketing" },
  { id: "4", date: "2024-05-15", type: "Vercel Hosting", amount: 75.00, category: "Cloud Hosting", recurring: true },
  { id: "5", date: "2024-05-20", type: "Contractor John", amount: 1200.00, category: "Freelancer Payment" },
  { id: "11", date: "2024-05-25", type: "Lunch with client", amount: 85.00, category: "Travel" },
  { id: "12", date: "2024-05-28", type: "Stock Photos", amount: 99.00, category: "Software" },

  // April 2024
  { id: "6", date: "2024-04-15", type: "Stationery", amount: 80.00, category: "Office Supplies" },
  { id: "7", date: "2024-04-25", type: "Flight to Conference", amount: 350.00, category: "Travel" },
  { id: "13", date: "2024-04-01", type: "Figma Subscription", amount: 49.99, category: "Software", recurring: true },
  { id: "14", date: "2024-04-10", type: "LinkedIn Ads", amount: 450.00, category: "Marketing" },
  { id: "15", date: "2024-04-20", type: "Contractor Sarah", amount: 1100.00, category: "Freelancer Payment" },
  { id: "16", date: "2024-04-28", type: "New Keyboard", amount: 150.00, category: "Hardware" },
  { id: "21", date: "2024-04-15", type: "Vercel Hosting", amount: 75.00, category: "Cloud Hosting", recurring: true },

  // March 2024
  { id: "17", date: "2024-03-01", type: "Figma Subscription", amount: 49.99, category: "Software", recurring: true },
  { id: "18", date: "2024-03-12", type: "Webinar Software", amount: 200.00, category: "Software", recurring: true },
  { id: "19", date: "2024-03-18", type: "Facebook Ads", amount: 300.00, category: "Marketing" },
  { id: "20", date: "2024-03-25", type: "Contractor Mike", amount: 950.00, category: "Freelancer Payment" },
  { id: "22", date: "2024-03-15", type: "Vercel Hosting", amount: 75.00, category: "Cloud Hosting", recurring: true },
  
  // Old data
  { id: "8", date: "2023-12-20", type: "Contractor Jane", amount: 1500.00, category: "Freelancer Payment" },
  { id: "9", date: "2023-12-05", type: "AWS Bill", amount: 75.00, category: "Cloud Hosting", recurring: true },
  { id: "10", date: "2022-01-10", type: "Adobe Creative Cloud", amount: 49.99, category: "Software", recurring: true },
];
