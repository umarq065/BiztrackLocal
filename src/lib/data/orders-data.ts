import { z } from "zod";

export const orderFormSchema = z.object({
  date: z.date({ required_error: "An order date is required." }),
  id: z.string().min(1, "Order ID is required."),
  username: z.string().min(1, "Username is required."),
  amount: z.coerce.number().positive({ message: "Amount must be positive." }),
  source: z.string().min(1, "Source is required."),
  gig: z.string().min(1, "Gig is required."),
  status: z.enum(["Completed", "In Progress", "Cancelled"]),
  rating: z.coerce.number().min(0, "Rating must be at least 0").max(5, "Rating cannot be more than 5").optional(),
  cancellationReasons: z.array(z.string()).optional(),
  customCancellationReason: z.string().optional(),
}).refine(data => {
    if (data.status === 'Cancelled') {
        return (data.cancellationReasons?.length ?? 0) > 0 || (data.customCancellationReason?.trim() ?? "") !== "";
    }
    return true;
}, {
    message: "At least one cancellation reason must be provided for cancelled orders.",
    path: ["cancellationReasons"],
});

export const cancellationReasonsList = [
    "Cancelled without requirements",
    "Expectations beyond requirements",
    "Not satisfied with design",
    "Not satisfied with animations",
    "Late delivery",
    "Unresponsive buyer",
];

export interface Order {
    id: string;
    clientUsername: string;
    date: string;
    amount: number;
    source: string;
    gig?: string;
    status: 'Completed' | 'In Progress' | 'Cancelled';
    rating?: number;
    cancellationReasons?: string[];
}

export const initialOrders: Order[] = [
    { id: 'ORD001', clientUsername: 'olivia.m', date: '2024-05-20', amount: 1999.00, source: 'Web Design', gig: 'Acme Corp Redesign', status: 'Completed', rating: 5 },
    { id: 'ORD002', clientUsername: 'jackson.l', date: '2024-05-21', amount: 399.00, source: 'Consulting', gig: 'Q1 Strategy Session', status: 'Completed', rating: 4.2 },
    { id: 'ORD003', clientUsername: 'isabella.n', date: '2024-05-22', amount: 299.00, source: 'Logo Design', gig: "Brand Identity for 'Innovate'", status: 'Cancelled', cancellationReasons: ["Not satisfied with design"] },
    { id: 'ORD004', clientUsername: 'will.k', date: '2024-05-23', amount: 999.00, source: 'Web Design', gig: 'Startup Landing Page', status: 'In Progress' },
    { id: 'ORD005', clientUsername: 'sofia.d', date: '2024-05-24', amount: 499.00, source: 'SEO Services', gig: 'Monthly SEO Retainer', status: 'Completed', rating: 3.7 },
    { id: 'ORD006', clientUsername: 'olivia.m', date: '2024-04-15', amount: 2500.00, source: 'Web Design', gig: 'E-commerce Platform', status: 'Completed', rating: 4.8 },
    { id: 'ORD007', clientUsername: 'isabella.n', date: '2024-03-18', amount: 500.00, source: 'Logo Design', gig: 'Branding Refresh', status: 'Completed', rating: 5 },
];
