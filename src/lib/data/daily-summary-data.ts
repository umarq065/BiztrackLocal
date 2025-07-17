import { z } from "zod";
import type { ObjectId } from "mongodb";

export const summaryFormSchema = z.object({
  date: z.date({ required_error: "A date is required." }),
  content: z.string().min(3, { message: "Summary must be at least 3 characters." }),
});

export type SummaryFormValues = z.infer<typeof summaryFormSchema>;

export interface DailySummary {
  _id: ObjectId;
  id: string;
  date: string;
  content: string;
}
