import { z } from "zod";
import { Facebook, Twitter, Linkedin, Github, Globe } from "lucide-react";
import { differenceInMonths } from "date-fns";

export const socialLinkSchema = z.object({
  platform: z.string().min(1, "Platform is required."),
  url: z.string().url("Please enter a valid URL."),
});

export const clientFormSchema = z.object({
  username: z.string().min(2, { message: "Username must be at least 2 characters." }),
  name: z.string().optional(),
  email: z.string().email({ message: "Invalid email address." }).optional().or(z.literal('')),
  avatarUrl: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
  source: z.string().min(1, { message: "Income source is required." }),
  socialLinks: z.array(socialLinkSchema).optional(),
  notes: z.string().optional(),
  tags: z.string().optional(),
  isVip: z.boolean().default(false),
});

export type ClientFormValues = z.infer<typeof clientFormSchema>;

export interface Client {
    id: string;
    username: string;
    name?: string;
    email?: string;
    avatarUrl?: string;
    source: string;
    socialLinks?: { platform: string; url: string }[];
    clientType: 'New' | 'Repeat';
    clientSince: string;
    totalOrders: number;
    totalEarning: number;
    lastOrder: string;
    notes?: string;
    tags?: string[];
    isVip?: boolean;
}

export const getClientStatus = (lastOrderDateString: string): { text: 'Active' | 'At Risk' | 'Inactive'; color: string } => {
    if (lastOrderDateString === 'N/A') {
        return { text: 'Inactive', color: 'bg-red-500' };
    }
    const lastOrderDate = new Date(lastOrderDateString.replace(/-/g, '/'));
    const now = new Date();
    const diffMonths = differenceInMonths(now, lastOrderDate);

    if (diffMonths <= 3) {
        return { text: 'Active', color: 'bg-green-500' };
    }
    if (diffMonths <= 6) {
        return { text: 'At Risk', color: 'bg-yellow-500' };
    }
    return { text: 'Inactive', color: 'bg-red-500' };
};


export const initialClients: Client[] = [
  { id: "1", name: "Olivia Martin", username: "olivia.m", email: "olivia.martin@email.com", avatarUrl: "https://placehold.co/100x100.png", source: "Comprehensive Web Design & Development for Enterprise", clientType: "Repeat", clientSince: "2023-01-15", totalOrders: 5, totalEarning: 8500, lastOrder: "2024-05-20", socialLinks: [{platform: "LinkedIn", url: "#"}, {platform: "Twitter", url: "#"}], isVip: true, tags: ["Reseller", "Minimalist Design"], notes: "Prefers quick, daily updates on order progress. Tends to ask for one major revision, so plan for it." },
  { id: "2", name: "Jackson Lee", username: "jackson.l", email: "jackson.lee@email.com", source: "Consulting", clientType: "New", clientSince: "2024-03-10", totalOrders: 1, totalEarning: 1200, lastOrder: "2024-03-21", socialLinks: [{platform: "GitHub", url: "#"}], tags: ["Tech Startup"], notes: "" },
  { id: "3", name: "Isabella Nguyen", username: "isabella.n", email: "isabella.nguyen@email.com", source: "Logo Design", clientType: "Repeat", clientSince: "2022-11-05", totalOrders: 8, totalEarning: 4500, lastOrder: "2023-05-18", socialLinks: [], isVip: false, tags: [], notes: "Loves bold fonts." },
  { id: "4", name: "William Kim", username: "will.k", email: "will@email.com", source: "Comprehensive Web Design & Development for Enterprise", clientType: "Repeat", clientSince: "2023-08-20", totalOrders: 3, totalEarning: 6200, lastOrder: "2024-04-30", socialLinks: [{platform: "Website", url: "#"}], isVip: true, tags: ["Enterprise", "Long-term"], notes: "Communication needs to be top-notch as they are a reseller." },
  { id: "5", name: "Sofia Davis", username: "sofia.d", email: "sofia.davis@email.com", source: "SEO Services and Digital Marketing Campaigns", clientType: "New", clientSince: "2024-04-01", totalOrders: 2, totalEarning: 1800, lastOrder: "2024-05-24", socialLinks: [{platform: "Facebook", url: "#"}, {platform: "Twitter", url: "#"}], tags: ["Social Media Focus"], notes: "" },
];

export const incomeSources = ["Comprehensive Web Design & Development for Enterprise", "Consulting", "Logo Design", "SEO Services and Digital Marketing Campaigns", "Maintenance"];

export const socialPlatforms = [
    { value: "Facebook", icon: Facebook },
    { value: "Twitter", icon: Twitter },
    { value: "LinkedIn", icon: Linkedin },
    { value: "GitHub", icon: Github },
    { value: "Website", icon: Globe },
];
