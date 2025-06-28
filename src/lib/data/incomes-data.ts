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

const generateAnalytics = (startDate: Date, days: number, baseImpressions: number, baseClicks: number, baseOrders: number) => {
    return Array.from({ length: days }, (_, i) => {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        const impressions = baseImpressions + Math.floor(Math.random() * 200 - 100);
        const clicks = baseClicks + Math.floor(Math.random() * 20 - 10);
        const orders = baseOrders + Math.floor(Math.random() * 5 - 2);
        return {
            date: format(date, "yyyy-MM-dd"),
            impressions: Math.max(0, impressions),
            clicks: Math.max(0, clicks),
            ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
            orders: Math.max(0, orders),
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
      { id: "g1", name: "Acme Corp Redesign", date: "2023-01-15", messages: 125, analytics: generateAnalytics(new Date("2024-05-01"), 30, 500, 40, 5) },
      { id: "g2", name: "Startup Landing Page", date: "2023-01-25", messages: 52, analytics: generateAnalytics(new Date("2024-05-01"), 30, 300, 20, 2) },
      { id: "g3", name: "E-commerce Site for 'ShopEasy'", date: "2023-02-05", messages: 210, analytics: generateAnalytics(new Date("2024-05-01"), 30, 800, 60, 8) },
    ],
    dataPoints: generateMessages(new Date("2024-05-01"), 30, 15),
  },
  {
    id: "2",
    name: "Consulting",
    gigs: [{ id: "g4", name: "Q1 Strategy Session", date: "2023-01-20", messages: 30, analytics: generateAnalytics(new Date("2024-05-01"), 30, 150, 10, 1) }],
    dataPoints: generateMessages(new Date("2024-05-01"), 30, 5),
  },
  {
    id: "3",
    name: "Logo Design",
    gigs: [
      { id: "g5", name: "Brand Identity for 'Innovate'", date: "2023-02-01", messages: 15, analytics: generateAnalytics(new Date("2024-05-01"), 30, 200, 15, 3) },
    ],
    dataPoints: [],
  },
  {
    id: "4",
    name: "SEO Services",
    gigs: [{ id: "g6", name: "Monthly SEO Retainer", date: "2023-02-10", messages: 88, analytics: generateAnalytics(new Date("2024-05-01"), 30, 400, 25, 4) }],
    dataPoints: generateMessages(new Date("2024-05-01"), 30, 8),
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
