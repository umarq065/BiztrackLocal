
"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PlusCircle, Trash2, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { socialPlatforms, clientFormSchema, type ClientFormValues, type Client } from "@/lib/data/clients-data";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

interface AddClientDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onClientAdded: (client: Client) => void;
    incomeSources: string[];
    children: React.ReactNode;
}

export function AddClientDialog({ open, onOpenChange, onClientAdded, incomeSources, children }: AddClientDialogProps) {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<ClientFormValues>({
        resolver: zodResolver(clientFormSchema),
        defaultValues: {
            username: "",
            name: "",
            email: "",
            avatarUrl: "",
            source: "",
            socialLinks: [],
            notes: "",
            tags: "",
            isVip: false,
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "socialLinks",
    });

    async function onSubmit(values: ClientFormValues) {
        setIsSubmitting(true);
        try {
            const response = await fetch('/api/clients', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(values),
            });

            if (!response.ok) {
                throw new Error('Failed to add client');
            }

            const newClient = await response.json();
            onClientAdded(newClient);

            toast({
                title: "Client Added",
                description: `${values.name || values.username} has been added to your client list.`,
            });
            form.reset();
            onOpenChange(false);
        } catch (error) {
            console.error(error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Could not add client. Please try again.",
            });
        } finally {
            setIsSubmitting(false);
        }
    }
    
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Add New Client</DialogTitle>
                    <DialogDescription>
                        Fill in the details below to add a new client to your list.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto p-1 pr-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="username"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Username*</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., johndoe99" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Client Name (Optional)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., John Doe" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Email (Optional)</FormLabel>
                                <FormControl>
                                    <Input type="email" placeholder="e.g., john.doe@example.com" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="avatarUrl"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Avatar URL (Optional)</FormLabel>
                                <FormControl>
                                    <Input type="url" placeholder="https://example.com/avatar.png" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="source"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Income Source*</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select an income source" />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {incomeSources.map(source => <SelectItem key={source} value={source}>{source}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="tags"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Tags</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g. minimalist, reseller, daily-updates" {...field} />
                                </FormControl>
                                <FormDescription>
                                    Comma-separated tags for easy filtering and identification.
                                </FormDescription>
                                <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Strategic Notes</FormLabel>
                                <FormControl>
                                    <Textarea placeholder="Client preferences, communication style, etc." className="min-h-24" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        
                        <FormField
                            control={form.control}
                            name="isVip"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                    <div className="space-y-0.5">
                                        <FormLabel>VIP Client</FormLabel>
                                        <FormDescription>
                                            Mark this client as a VIP for special recognition.
                                        </FormDescription>
                                    </div>
                                    <FormControl>
                                        <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                        
                        <div>
                            <FormLabel>Social Links (Optional)</FormLabel>
                            <div className="mt-2 space-y-4">
                                {fields.map((field, index) => (
                                    <div key={field.id} className="flex items-end gap-2">
                                        <FormField
                                            control={form.control}
                                            name={`socialLinks.${index}.platform`}
                                            render={({ field }) => (
                                                <FormItem className="w-1/3">
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Platform" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {socialPlatforms.map(p => {
                                                                const Icon = p.icon;
                                                                return (
                                                                    <SelectItem key={p.value} value={p.value}>
                                                                        <div className="flex items-center gap-2">
                                                                            <Icon className="h-4 w-4" />
                                                                            <span>{p.value}</span>
                                                                        </div>
                                                                    </SelectItem>
                                                                )
                                                            })}
                                                        </SelectContent>
                                                    </Select>
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name={`socialLinks.${index}.url`}
                                            render={({ field }) => (
                                                <FormItem className="flex-grow">
                                                    <FormControl>
                                                        <Input placeholder="https://..." {...field} />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            onClick={() => remove(index)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            <span className="sr-only">Remove Link</span>
                                        </Button>
                                    </div>
                                ))}
                            </div>
                             <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="mt-4"
                                onClick={() => append({ platform: "", url: "" })}
                                >
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Add Social Link
                            </Button>
                        </div>
                        
                        <DialogFooter className="pt-4">
                            <DialogClose asChild>
                            <Button type="button" variant="secondary">
                                Cancel
                            </Button>
                            </DialogClose>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Add Client
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
