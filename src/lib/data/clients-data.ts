
import { z } from "zod";
import { Facebook, Twitter, Linkedin, Github, Globe } from "lucide-react";
import { differenceInMonths } from "date-fns";
import type { ObjectId } from 'mongodb';

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
    _id: ObjectId; // From MongoDB
    id: string; // String version of _id
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

export const socialPlatforms = [
    { value: "Facebook", icon: Facebook },
    { value: "Twitter", icon: Twitter },
    { value: "LinkedIn", icon: Linkedin },
    { value: "GitHub", icon: Github },
    { value: "Website", icon: Globe },
];
