
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
  messages?: number;
  analytics?: {
    date: string;
    impressions: number;
    clicks: number;
  }[];
}

export interface SourceDataPoint {
  date: string;
  messages: number;
}

export interface IncomeSource {
  _id?: ObjectId; // From MongoDB
  id: string; // String version of _id or a separate unique ID
  name: string;
  gigs: Gig[];
  dataPoints?: SourceDataPoint[];
}

const generateAnalytics = (startDate: Date, days: number, baseImpressions: number, baseClicks: number) => {
    return Array.from({ length: days }, (_, i) => {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        const impressions = baseImpressions + Math.floor(Math.random() * 200 - 100);
        const clicks = baseClicks + Math.floor(Math.random() * 20 - 10);
        return {
            date: format(date, "yyyy-MM-dd"),
            impressions: Math.max(0, impressions),
            clicks: Math.max(0, clicks),
        };
    });
};

const generateMessages = (startDate: Date, days: number, baseMessages: number) => {
    return Array.from({ length: days }, (_, i) => {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        return {
            date: format(date, "yyyy-MM-dd"),
            messages: Math.max(0, baseMessages + Math.floor(Math.random() * 10 - 5)),
        };
    });
};

// This initial data will only be used if the database is empty.
export const initialIncomeSources: Omit<IncomeSource, '_id' | 'id'>[] = [
  {
    name: "Web Design",
    gigs: [
      { id: "g1", name: "Acme Corp Redesign", date: "2023-01-15", messages: 125, analytics: generateAnalytics(new Date("2024-04-01"), 60, 500, 40) },
      { id: "g2", name: "Startup Landing Page", date: "2023-01-25", messages: 52, analytics: generateAnalytics(new Date("2024-04-01"), 60, 300, 20) },
      { id: "g3", name: "E-commerce Site for 'ShopEasy'", date: "2023-02-05", messages: 210, analytics: generateAnalytics(new Date("2024-04-01"), 60, 800, 60) },
    ],
    dataPoints: generateMessages(new Date("2024-04-01"), 60, 15),
  },
  {
    name: "Consulting",
    gigs: [{ id: "g4", name: "Q1 Strategy Session", date: "2023-01-20", messages: 30, analytics: generateAnalytics(new Date("2024-04-01"), 60, 150, 10) }],
    dataPoints: generateMessages(new Date("2024-04-01"), 60, 5),
  },
  {
    name: "Logo Design",
    gigs: [
      { id: "g5", name: "Brand Identity for 'Innovate'", date: "2023-02-01", messages: 15, analytics: generateAnalytics(new Date("2024-04-01"), 60, 200, 15) },
    ],
    dataPoints: [],
  },
];
