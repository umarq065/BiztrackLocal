import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

const summaries = [
    { id: 1, date: "2024-05-25", content: "Great progress today. Closed two new clients and finished the design for Project X. Need to follow up with the marketing team tomorrow about the new campaign." },
    { id: 2, date: "2024-05-24", content: "Team meeting was productive. Outlined the goals for Q3. Spent the afternoon on bug fixes for the main app. Client Y is happy with the latest delivery." },
    { id: 3, date: "2024-05-23", content: "Onboarded a new developer. Most of the day was spent on code reviews and planning the next sprint. Quiet day otherwise." },
];

export default function DailySummaryPage() {
  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center">
        <h1 className="font-headline text-lg font-semibold md:text-2xl">
          Daily Summary
        </h1>
      </div>
      <div className="grid gap-6">
        <Card>
            <CardHeader>
                <CardTitle>Add New Summary</CardTitle>
                <CardDescription>Log your progress for today.</CardDescription>
            </CardHeader>
            <CardContent>
                <Textarea placeholder="What did you accomplish today?" />
            </CardContent>
            <CardFooter>
                 <Button className="ml-auto">Save Summary</Button>
            </CardFooter>
        </Card>

        <div className="space-y-4">
            <h2 className="text-xl font-semibold">Recent Summaries</h2>
            {summaries.map(summary => (
                <Card key={summary.id}>
                    <CardHeader>
                        <CardTitle>{new Date(summary.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">{summary.content}</p>
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
