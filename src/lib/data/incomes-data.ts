
import { z } from "zod";
import { format } from "date-fns";
import type { ObjectId } from 'mongodb';

export const formSchema = z.object({
  sourceName: z.string().min(2, {
    message: "Source name must be at least 2 characters.",
  }),
  gigs: z
    .array(
      z.object({
        name: z.string().min(2, {
          message: "Gig name must be at least 2 characters.",
        }),
        date: z.date({
          required_error: "A date for the gig is required.",
        }),
      })
    )
    .min(1, { message: "You must add at least one gig." }),
});

export interface Gig {
  id: string; // Should be unique within the source, maybe a short random string or nanoid
  name: string;
  date: string;
}

export interface IncomeSource {
  _id?: ObjectId; // From MongoDB
  id: string; // String version of _id or a separate unique ID
  name: string;
  gigs: Gig[];
}

// This initial data will only be used if the database is empty.
export const initialIncomeSources: Omit<IncomeSource, '_id' | 'id'>[] = [
  {
    name: "Web Design",
    gigs: [
      { id: "g1", name: "Acme Corp Redesign", date: "2023-01-15" },
      { id: "g2", name: "Startup Landing Page", date: "2023-01-25" },
      { id: "g3", name: "E-commerce Site for 'ShopEasy'", date: "2023-02-05" },
    ],
  },
  {
    name: "Consulting",
    gigs: [{ id: "g4", name: "Q1 Strategy Session", date: "2023-01-20" }],
  },
  {
    name: "Logo Design",
    gigs: [
      { id: "g5", name: "Brand Identity for 'Innovate'", date: "2023-02-01" },
    ],
  },
];
