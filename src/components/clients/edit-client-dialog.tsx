
"use client";

import { useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PlusCircle, Trash2 } from "lucide-react";

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
import { incomeSources, socialPlatforms, clientFormSchema, type ClientFormValues, type Client } from "@/lib/data/clients-data";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

interface EditClientDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onClientUpdated: (client: Client) => void;
    client: Client;
    children?: React.ReactNode;
}

export function EditClientDialog({ open, onOpenChange, onClientUpdated, client, children }: EditClientDialogProps) {
    const { toast } = useToast();

    const form = useForm<ClientFormValues>({
        resolver: zodResolver(clientFormSchema),
    });

    useEffect(() => {
        if (open && client) {
            form.reset({
                username: client.username,
                name: client.name || "",
                email: client.email || "",
                avatarUrl: client.avatarUrl || "",
                source: client.source,
                socialLinks: client.socialLinks || [],
                notes: client.notes || "",
                tags: client.tags?.join(", ") || "",
                isVip: client.isVip || false,
            });
        }
    }, [open, client, form]);

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "socialLinks",
    });

    function onSubmit(values: ClientFormValues) {
        const updatedClient: Client = {
            ...client,
            ...values,
            avatarUrl: values.avatarUrl || undefined,
            tags: values.tags ? values.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        };
        onClientUpdated(updatedClient);
        toast({
            title: "Client Updated",
            description: `${values.name || values.username} has been updated.`,
        });
        onOpenChange(false);
    }
    
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {children && (
                <DialogTrigger asChild>
                    {children}
                </DialogTrigger>
            )}
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Edit Client</DialogTitle>
                    <DialogDescription>
                        Update the details for {client.name || client.username}.
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
                                <Select onValueChange={field.onChange} value={field.value}>
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
                                                    <Select onValueChange={field.onChange} value={field.value}>
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
                            <Button type="submit">Save Changes</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
