
import { z } from "zod";
import { Facebook, Linkedin, Github, Globe, Instagram, Youtube, X } from "lucide-react";
import { differenceInMonths } from "date-fns";
import type { ObjectId } from 'mongodb';

export const socialLinkSchema = z.object({
    platform: z.string().min(1, "Platform is required."),
    url: z.string().url("Please enter a valid URL."),
});

export const clientFormSchema = z.object({
    username: z.string().min(2, { message: "Username must be at least 2 characters." }),
    name: z.string().optional(),
    emails: z.array(z.object({ value: z.string().email("Invalid email address.") })).optional(),
    phoneNumbers: z.array(z.object({ value: z.string().min(5, "Invalid phone number.") })).optional(),
    country: z.string().optional(),
    avatarUrl: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
    source: z.string().min(1, { message: "Income source is required." }),
    socialLinks: z.array(socialLinkSchema).optional(),
    notes: z.string().optional(),
    tags: z.string().optional(),
    isVip: z.boolean().default(false),
});

export type ClientFormValues = z.infer<typeof clientFormSchema>;

export interface Client {
    _id: ObjectId; // From MongoDB
    id: string; // String version of _id
    username: string;
    name?: string;
    email?: string; // Kept for backward compatibility, but we'll prefer emails array
    emails?: { value: string }[];
    phoneNumbers?: { value: string }[];
    country?: string;
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

export const socialPlatforms = [
    { value: "Facebook", icon: Facebook },
    { value: "X", icon: X },
    { value: "Instagram", icon: Instagram },
    { value: "LinkedIn", icon: Linkedin },
    { value: "GitHub", icon: Github },
    { value: "YouTube", icon: Youtube },
    { value: "Website", icon: Globe },
];

export const countries = [
    "United States", "United Kingdom", "Canada", "Australia", "Germany", "France", "Spain", "Italy", "Netherlands", "Brazil", "India", "China", "Japan", "South Korea", "Russia", "Mexico", "Indonesia", "Turkey", "Saudi Arabia", "Switzerland", "Sweden", "Poland", "Belgium", "Austria", "Norway", "United Arab Emirates", "Singapore", "Denmark", "Finland", "Ireland", "New Zealand", "Portugal", "Greece", "Czech Republic", "Hungary", "Romania", "Ukraine", "South Africa", "Egypt", "Nigeria", "Kenya", "Argentina", "Chile", "Colombia", "Peru", "Thailand", "Vietnam", "Malaysia", "Philippines", "Pakistan", "Bangladesh", "Israel"
].sort();
