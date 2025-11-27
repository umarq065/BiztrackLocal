
"use client";

import { useEffect, useState } from "react";
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
import { socialPlatforms, clientFormSchema, type ClientFormValues, type Client, countries } from "@/lib/data/clients-data";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

interface EditClientDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onClientUpdated: (client: Client) => void;
    client: Client;
    incomeSources: string[];
    children?: React.ReactNode;
}

export function EditClientDialog({ open, onOpenChange, onClientUpdated, client, incomeSources, children }: EditClientDialogProps) {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<ClientFormValues>({
        resolver: zodResolver(clientFormSchema),
        defaultValues: {
            emails: [],
            phoneNumbers: [],
            socialLinks: [],
        }
    });

    useEffect(() => {
        if (open && client) {
            // Migration logic for existing email
            const existingEmails = client.emails || (client.email ? [{ value: client.email }] : []);

            form.reset({
                username: client.username,
                name: client.name || "",
                emails: existingEmails,
                phoneNumbers: client.phoneNumbers || [],
                country: client.country || "",
                avatarUrl: client.avatarUrl || "",
                source: client.source,
                socialLinks: client.socialLinks || [],
                notes: client.notes || "",
                tags: client.tags?.join(", ") || "",
                isVip: client.isVip || false,
            });
        }
    }, [open, client, form]);

    const { fields: socialFields, append: appendSocial, remove: removeSocial } = useFieldArray({
        control: form.control,
        name: "socialLinks",
    });

    const { fields: emailFields, append: appendEmail, remove: removeEmail } = useFieldArray({
        control: form.control,
        name: "emails",
    });

    const { fields: phoneFields, append: appendPhone, remove: removePhone } = useFieldArray({
        control: form.control,
        name: "phoneNumbers",
    });

    async function onSubmit(values: ClientFormValues) {
        setIsSubmitting(true);
        try {
            // Ensure backward compatibility by setting the first email as the primary 'email' field
            const primaryEmail = values.emails && values.emails.length > 0 ? values.emails[0].value : "";

            const payload = {
                ...values,
                email: primaryEmail
            };

            const response = await fetch(`/api/clients/${client.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update client');
            }

            const updatedClient = await response.json();
            onClientUpdated(updatedClient);
            toast({
                title: "Client Updated",
                description: `${values.name || values.username} has been updated.`,
            });
            onOpenChange(false);
        } catch (error) {
            console.error(error);
            toast({
                variant: "destructive",
                title: "Error",
                description: (error as Error).message || "Could not update client. Please try again.",
            });
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {children && (
                <DialogTrigger asChild>
                    {children}
                </DialogTrigger>
            )}
            <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col p-0 gap-0 border-0 shadow-2xl bg-background/80 backdrop-blur-xl ring-1 ring-white/10 overflow-hidden">
                <DialogHeader className="p-6 pb-6 bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 text-white relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-soft-light"></div>
                    <div className="relative z-10">
                        <DialogTitle className="text-2xl font-bold tracking-tight">Edit {client.name || client.username} details</DialogTitle>
                    </div>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-6 space-y-8 bg-gradient-to-b from-background to-muted/20">

                        {/* Section 1: Identity */}
                        <div className="space-y-4 group">
                            <h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 bg-clip-text text-transparent bg-gradient-to-r from-violet-500 to-fuchsia-500">
                                <span className="w-1.5 h-1.5 rounded-full bg-violet-500"></span>
                                Identity
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 border border-indigo-500/10 rounded-xl bg-indigo-500/5 hover:border-indigo-500/20 hover:bg-indigo-500/10 transition-all duration-300">
                                <FormField
                                    control={form.control}
                                    name="username"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-foreground/80">Username</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g., johndoe99" {...field} className="bg-background/50 border-indigo-200/20 focus:border-violet-500 focus:ring-violet-500/20 transition-all" />
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
                                            <FormLabel className="text-foreground/80">Client Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g., John Doe" {...field} className="bg-background/50 border-indigo-200/20 focus:border-violet-500 focus:ring-violet-500/20 transition-all" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        {/* Section 2: Social Links */}
                        <div className="space-y-4 group">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-cyan-500">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                    Social Presence
                                </h3>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-xs text-blue-500 hover:text-blue-600 hover:bg-blue-500/10"
                                    onClick={() => appendSocial({ platform: "", url: "" })}
                                >
                                    <PlusCircle className="mr-1.5 h-3.5 w-3.5" />
                                    Add Link
                                </Button>
                            </div>

                            <div className="space-y-3 p-5 border border-blue-500/10 rounded-xl bg-blue-500/5 hover:border-blue-500/20 hover:bg-blue-500/10 transition-all duration-300 min-h-[100px]">
                                {socialFields.length === 0 ? (
                                    <div className="text-sm text-muted-foreground/60 text-center py-6 italic flex flex-col items-center gap-2">
                                        <div className="p-3 rounded-full bg-blue-500/10 text-blue-500">
                                            <PlusCircle className="h-5 w-5" />
                                        </div>
                                        No social links added yet.
                                    </div>
                                ) : (
                                    socialFields.map((field, index) => (
                                        <div key={field.id} className="flex items-start gap-3 group/item animate-in fade-in slide-in-from-bottom-2 duration-300">
                                            <FormField
                                                control={form.control}
                                                name={`socialLinks.${index}.platform`}
                                                render={({ field }) => (
                                                    <FormItem className="w-[140px] flex-shrink-0">
                                                        <Select onValueChange={field.onChange} value={field.value}>
                                                            <FormControl>
                                                                <SelectTrigger className="bg-background/50 border-blue-200/20 focus:border-blue-500 focus:ring-blue-500/20 transition-all">
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
                                                            <Input placeholder="Profile URL" {...field} className="bg-background/50 border-blue-200/20 focus:border-blue-500 focus:ring-blue-500/20 transition-all" />
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-colors"
                                                onClick={() => removeSocial(index)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                                <span className="sr-only">Remove Link</span>
                                            </Button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Section 3: Contact & Business */}
                        <div className="space-y-4 group">
                            <h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 to-teal-500">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                Contact & Business
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 border border-emerald-500/10 rounded-xl bg-emerald-500/5 hover:border-emerald-500/20 hover:bg-emerald-500/10 transition-all duration-300">

                                {/* Emails */}
                                <div className="md:col-span-2 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <FormLabel className="text-foreground/80">Email Addresses</FormLabel>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 text-xs text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10"
                                            onClick={() => appendEmail({ value: "" })}
                                        >
                                            <PlusCircle className="mr-1.5 h-3 w-3" />
                                            Add Email
                                        </Button>
                                    </div>
                                    {emailFields.map((field, index) => (
                                        <div key={field.id} className="flex items-center gap-2 group/item animate-in fade-in slide-in-from-bottom-2 duration-300">
                                            <FormField
                                                control={form.control}
                                                name={`emails.${index}.value`}
                                                render={({ field }) => (
                                                    <FormItem className="flex-grow">
                                                        <FormControl>
                                                            <Input type="email" placeholder="e.g., john@example.com" {...field} className="bg-background/50 border-emerald-200/20 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all" />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-colors"
                                                onClick={() => removeEmail(index)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                    {emailFields.length === 0 && (
                                        <div className="text-sm text-muted-foreground/60 italic pl-1">No emails added.</div>
                                    )}
                                </div>

                                {/* Phone Numbers */}
                                <div className="md:col-span-2 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <FormLabel className="text-foreground/80">Phone Numbers</FormLabel>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 text-xs text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10"
                                            onClick={() => appendPhone({ value: "" })}
                                        >
                                            <PlusCircle className="mr-1.5 h-3 w-3" />
                                            Add Phone
                                        </Button>
                                    </div>
                                    {phoneFields.map((field, index) => (
                                        <div key={field.id} className="flex items-center gap-2 group/item animate-in fade-in slide-in-from-bottom-2 duration-300">
                                            <FormField
                                                control={form.control}
                                                name={`phoneNumbers.${index}.value`}
                                                render={({ field }) => (
                                                    <FormItem className="flex-grow">
                                                        <FormControl>
                                                            <Input placeholder="+1 (555) 000-0000" {...field} className="bg-background/50 border-emerald-200/20 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all" />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-colors"
                                                onClick={() => removePhone(index)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                    {phoneFields.length === 0 && (
                                        <div className="text-sm text-muted-foreground/60 italic pl-1">No phone numbers added.</div>
                                    )}
                                </div>

                                <FormField
                                    control={form.control}
                                    name="country"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-foreground/80">Country</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="bg-background/50 border-emerald-200/20 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all">
                                                        <SelectValue placeholder="Select country" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {countries.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="source"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-foreground/80">Income Source</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="bg-background/50 border-emerald-200/20 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all">
                                                        <SelectValue placeholder="Select source" />
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
                                    name="avatarUrl"
                                    render={({ field }) => (
                                        <FormItem className="md:col-span-2">
                                            <FormLabel className="text-foreground/80">Avatar URL</FormLabel>
                                            <FormControl>
                                                <Input type="url" placeholder="https://..." {...field} className="bg-background/50 border-emerald-200/20 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="tags"
                                    render={({ field }) => (
                                        <FormItem className="md:col-span-2">
                                            <FormLabel className="text-foreground/80">Tags</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. minimalist, reseller, daily-updates" {...field} className="bg-background/50 border-emerald-200/20 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all" />
                                            </FormControl>
                                            <FormDescription className="text-xs text-muted-foreground/70">
                                                Comma-separated tags for organization.
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="isVip"
                                    render={({ field }) => (
                                        <FormItem className="md:col-span-2 flex flex-row items-center justify-between rounded-xl border border-yellow-500/20 p-4 bg-yellow-500/5 shadow-sm hover:bg-yellow-500/10 transition-all">
                                            <div className="space-y-0.5">
                                                <FormLabel className="text-base font-semibold text-yellow-600 dark:text-yellow-400">VIP Client Status</FormLabel>
                                                <FormDescription className="text-yellow-600/70 dark:text-yellow-400/70">
                                                    Mark this client for special priority and recognition.
                                                </FormDescription>
                                            </div>
                                            <FormControl>
                                                <Switch
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                    className="data-[state=checked]:bg-yellow-500"
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        {/* Section 4: Notes */}
                        <div className="space-y-4 group">
                            <h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-amber-500">
                                <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                                Strategic Notes
                            </h3>
                            <div className="p-5 border border-orange-500/10 rounded-xl bg-orange-500/5 hover:border-orange-500/20 hover:bg-orange-500/10 transition-all duration-300">
                                <FormField
                                    control={form.control}
                                    name="notes"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Enter client preferences, communication style, or other important details..."
                                                    className="min-h-[120px] bg-background/50 border-orange-200/20 focus:border-orange-500 focus:ring-orange-500/20 transition-all resize-y"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                    </form>
                </Form>

                <DialogFooter className="p-6 pt-4 border-t border-white/10 bg-muted/5 backdrop-blur-sm">
                    <DialogClose asChild>
                        <Button type="button" variant="outline" className="border-white/10 hover:bg-white/5 hover:text-foreground transition-colors">
                            Cancel
                        </Button>
                    </DialogClose>
                    <Button
                        type="submit"
                        onClick={form.handleSubmit(onSubmit)}
                        disabled={isSubmitting}
                        className="min-w-[140px] bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-indigo-500/25 border-0 transition-all duration-300 transform hover:scale-[1.02]"
                    >
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
