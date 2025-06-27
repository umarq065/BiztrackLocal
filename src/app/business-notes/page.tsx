import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const notes = [
    { id: 1, date: "2024-05-20", title: "Q3 Marketing Ideas", content: "- Launch social media campaign for new service.\n- Collaborate with influencer in our niche.\n- Offer a time-limited discount." },
    { id: 2, date: "2024-05-15", title: "Website Redesign V2 Feedback", content: "- Client loves the new homepage layout.\n- Needs changes to the color scheme in the contact page.\n- Add testimonials section." },
    { id: 3, date: "2024-05-10", title: "New Feature Brainstorm", content: "- AI-powered analytics.\n- Client portal for project tracking.\n- Integration with popular accounting software." },
];

export default function BusinessNotesPage() {
  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center">
        <h1 className="font-headline text-lg font-semibold md:text-2xl">
          Business Notes
        </h1>
      </div>
      <div className="grid gap-6">
        <Card>
            <CardHeader>
                <CardTitle>Add New Note</CardTitle>
                <CardDescription>Jot down your ideas and reminders.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Input placeholder="Note Title" />
                <Textarea placeholder="Write your note here..." />
            </CardContent>
            <CardFooter>
                 <Button className="ml-auto">Save Note</Button>
            </CardFooter>
        </Card>

        <div className="space-y-4">
            <h2 className="text-xl font-semibold">Recent Notes</h2>
            {notes.map(note => (
                <Card key={note.id}>
                    <CardHeader>
                        <CardTitle>{note.title}</CardTitle>
                        <CardDescription>{new Date(note.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground whitespace-pre-line">{note.content}</p>
                    </CardContent>
                    <CardFooter className="flex justify-end gap-2">
                        <Button variant="outline">Edit</Button>
                        <Button variant="destructive">Delete</Button>
                    </CardFooter>
                </Card>
            ))}
        </div>
      </div>
    </main>
  );
}
