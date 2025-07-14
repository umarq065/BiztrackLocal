import { z } from "zod";
import { format } from "date-fns";

export interface Gig {
  id: string;
  name: string;
  date: string;
  messages?: number;
  analytics?: {
    date: string;
    impressions: number;
    clicks: number;
    ctr: number;
    orders: number;
    revenue: number;
  }[];
}

export interface SourceDataPoint {
  date: string;
  messages: number;
}

export interface IncomeSource {
  id: string;
  name: string;
  gigs: Gig[];
  dataPoints?: SourceDataPoint[];
}

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


const generateAnalytics = (startDate: Date, days: number, baseImpressions: number, baseClicks: number, baseOrders: number, baseRevenuePerOrder: number) => {
    return Array.from({ length: days }, (_, i) => {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        const impressions = baseImpressions + Math.floor(Math.random() * 200 - 100);
        const clicks = baseClicks + Math.floor(Math.random() * 20 - 10);
        const orders = baseOrders + Math.floor(Math.random() * 5 - 2);
        const revenue = Math.max(0, orders) * (baseRevenuePerOrder + Math.floor(Math.random() * 50 - 25));
        return {
            date: format(date, "yyyy-MM-dd"),
            impressions: Math.max(0, impressions),
            clicks: Math.max(0, clicks),
            ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
            orders: Math.max(0, orders),
            revenue: Math.max(0, revenue),
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

export const initialIncomeSources: IncomeSource[] = [
  {
    id: "1",
    name: "Web Design",
    gigs: [
      { id: "g1", name: "Acme Corp Redesign", date: "2023-01-15", messages: 125, analytics: generateAnalytics(new Date("2024-04-01"), 60, 500, 40, 5, 450) },
      { id: "g2", name: "Startup Landing Page", date: "2023-01-25", messages: 52, analytics: generateAnalytics(new Date("2024-04-01"), 60, 300, 20, 2, 300) },
      { id: "g3", name: "E-commerce Site for 'ShopEasy'", date: "2023-02-05", messages: 210, analytics: generateAnalytics(new Date("2024-04-01"), 60, 800, 60, 8, 600) },
    ],
    dataPoints: generateMessages(new Date("2024-04-01"), 60, 15),
  },
  {
    id: "2",
    name: "Consulting",
    gigs: [{ id: "g4", name: "Q1 Strategy Session", date: "2023-01-20", messages: 30, analytics: generateAnalytics(new Date("2024-04-01"), 60, 150, 10, 1, 1200) }],
    dataPoints: generateMessages(new Date("2024-04-01"), 60, 5),
  },
  {
    id: "3",
    name: "Logo Design",
    gigs: [
      { id: "g5", name: "Brand Identity for 'Innovate'", date: "2023-02-01", messages: 15, analytics: generateAnalytics(new Date("2024-04-01"), 60, 200, 15, 3, 250) },
    ],
    dataPoints: [],
  },
  {
    id: "4",
    name: "SEO Services",
    gigs: [{ id: "g6", name: "Monthly SEO Retainer", date: "2023-02-10", messages: 88, analytics: generateAnalytics(new Date("2024-04-01"), 60, 400, 25, 4, 150) }],
    dataPoints: generateMessages(new Date("2024-04-01"), 60, 8),
  },
  {
    id: "5",
    name: "Maintenance",
    gigs: [
      { id: "g7", name: "Website Support Package", date: "2023-02-15", messages: 5, analytics: [] },
    ],
    dataPoints: [],
  },
];
