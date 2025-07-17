
import { z } from "zod";
import type { ObjectId } from "mongodb";

export const noteFormSchema = z.object({
  date: z.date({
    required_error: "A date for the note is required.",
  }),
  title: z.string().min(3, { message: "Title must be at least 3 characters." }),
  content: z.string().min(3, { message: "Note content must be at least 3 characters." }),
});

export type NoteFormValues = z.infer<typeof noteFormSchema>;

export interface BusinessNote {
  _id: ObjectId;
  id: string;
  date: Date;
  title: string;
  content: string;
}

export const initialNotesData: Omit<BusinessNote, 'id' | '_id' | 'date'> & { date: string }[] = [
    { date: "2024-05-20", title: "Q3 Marketing Ideas", content: "- Launch social media campaign for new service.\n- Collaborate with influencer in our niche.\n- Offer a time-limited discount." },
    { date: "2024-05-15", title: "Website Redesign V2 Feedback", content: "- Client loves the new homepage layout.\n- Needs changes to the color scheme in the contact page.\n- Add testimonials section." },
    { date: "2024-05-10", title: "New Feature Brainstorm", content: "- AI-powered analytics.\n- Client portal for project tracking.\n- Integration with popular accounting software." },
];
