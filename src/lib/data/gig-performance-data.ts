
import { z } from "zod";
import type { ObjectId } from "mongodb";

export const addGigPerformanceSchema = z.object({
    date: z.date({ required_error: "A date is required." }),
    impressions: z.coerce.number().int().min(0, { message: "Impressions must be a non-negative number." }),
    clicks: z.coerce.number().int().min(0, { message: "Clicks must be a non-negative number." }),
    sourceId: z.string().min(1),
    gigId: z.string().min(1),
});

export type AddGigPerformanceFormValues = z.infer<typeof addGigPerformanceSchema>;

export interface GigPerformance {
  _id: ObjectId;
  id: string;
  sourceId: string;
  gigId: string;
  date: string; // YYYY-MM-DD
  impressions: number;
  clicks: number;
}
