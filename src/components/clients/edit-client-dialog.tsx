
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
            addresses: [],
            socialLinks: [],
        }
    });

    useEffect(() => {
        if (open && client) {
            // Initial reset with passed client data to show something immediately
            const initialEmails = client.emails || (client.email ? [{ value: client.email }] : []);
            form.reset({
                username: client.username,
                name: client.name || "",
                emails: initialEmails,
                phoneNumbers: client.phoneNumbers || [],
                addresses: client.addresses || [],
                country: client.country || "",
                avatarUrl: client.avatarUrl || "",
                source: client.source,
                socialLinks: client.socialLinks || [],
                notes: client.notes || "",
                tags: client.tags?.join(", ") || "",
                isVip: client.isVip || false,
            });

            // Fetch fresh data from API to ensure we have all fields (socials, etc.)
            // This fixes the issue where the list view might have partial data
            fetch(`/api/clients/${client.id}`)
                .then(res => {
                    if (!res.ok) throw new Error("Failed to fetch client details");
                    return res.json();
                })
                .then((data: Client) => {
                    const existingEmails = data.emails || (data.email ? [{ value: data.email }] : []);
                    form.reset({
                        username: data.username,
                        name: data.name || "",
                        emails: existingEmails,
                        phoneNumbers: data.phoneNumbers || [],
                        addresses: data.addresses || [],
                        country: data.country || "",
                        avatarUrl: data.avatarUrl || "",
                        source: data.source,
                        socialLinks: data.socialLinks || [],
                        notes: data.notes || "",
                        tags: data.tags?.join(", ") || "",
                        isVip: data.isVip || false,
                    });
                })
                .catch(err => console.error("Failed to refresh client details:", err));
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

    const { fields: addressFields, append: appendAddress, remove: removeAddress } = useFieldArray({
        control: form.control,
        name: "addresses",
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
            <DialogContent className="sm:max-w-6xl max-h-[95vh] flex flex-col p-0 gap-0 border-0 shadow-2xl bg-background/80 backdrop-blur-xl ring-1 ring-white/10 overflow-hidden">
                <DialogHeader className="p-6 pb-6 bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 text-white relative overflow-hidden flex-shrink-0">
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-soft-light"></div>
                    <div className="relative z-10">
                        <DialogTitle className="text-2xl font-bold tracking-tight">Edit {client.name || client.username} details</DialogTitle>
                    </div>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-background to-muted/20">

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                            {/* Top Row: Identity - Full Width */}
                            <div className="lg:col-span-12 space-y-4 group">
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

                            {/* Left Column: Contact & Business (Span 8) */}
                            <div className="lg:col-span-8 space-y-6">
                                <div className="space-y-4 group">
                                    <h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 to-teal-500">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                        Contact & Business
                                    </h3>
                                    <div className="p-5 border border-emerald-500/10 rounded-xl bg-emerald-500/5 hover:border-emerald-500/20 hover:bg-emerald-500/10 transition-all duration-300 space-y-6">

                                        {/* Emails & Phones Grid */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Emails */}
                                            <div className="space-y-3">
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
                                                        Add
                                                    </Button>
                                                </div>
                                                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
                                                    {emailFields.map((field, index) => (
                                                        <div key={field.id} className="flex items-center gap-2 group/item animate-in fade-in slide-in-from-bottom-2 duration-300">
                                                            <FormField
                                                                control={form.control}
                                                                name={`emails.${index}.value`}
                                                                render={({ field }) => (
                                                                    <FormItem className="flex-grow">
                                                                        <FormControl>
                                                                            <Input type="email" placeholder="john@example.com" {...field} className="h-9 bg-background/50 border-emerald-200/20 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all" />
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
                                            </div>

                                            {/* Phone Numbers */}
                                            <div className="space-y-3">
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
                                                        Add
                                                    </Button>
                                                </div>
                                                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
                                                    {phoneFields.map((field, index) => (
                                                        <div key={field.id} className="flex items-center gap-2 group/item animate-in fade-in slide-in-from-bottom-2 duration-300">
                                                            <FormField
                                                                control={form.control}
                                                                name={`phoneNumbers.${index}.value`}
                                                                render={({ field }) => (
                                                                    <FormItem className="flex-grow">
                                                                        <FormControl>
                                                                            <Input placeholder="+1 (555) 000-0000" {...field} className="h-9 bg-background/50 border-emerald-200/20 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all" />
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
                                            </div>
                                        </div>

                                        {/* Addresses */}
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <FormLabel className="text-foreground/80">Addresses</FormLabel>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-6 text-xs text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10"
                                                    onClick={() => appendAddress({ value: "" })}
                                                >
                                                    <PlusCircle className="mr-1.5 h-3 w-3" />
                                                    Add Address
                                                </Button>
                                            </div>
                                            <div className="space-y-2">
                                                {addressFields.map((field, index) => (
                                                    <div key={field.id} className="flex items-center gap-2 group/item animate-in fade-in slide-in-from-bottom-2 duration-300">
                                                        <FormField
                                                            control={form.control}
                                                            name={`addresses.${index}.value`}
                                                            render={({ field }) => (
                                                                <FormItem className="flex-grow">
                                                                    <FormControl>
                                                                        <Input placeholder="123 Main St, City, Country" {...field} className="h-9 bg-background/50 border-emerald-200/20 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all" />
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
                                                            onClick={() => removeAddress(index)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                ))}
                                                {addressFields.length === 0 && (
                                                    <div className="text-sm text-muted-foreground/60 italic pl-1">No addresses added.</div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Country, Source, Avatar Grid */}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                                                    <FormItem>
                                                        <FormLabel className="text-foreground/80">Avatar URL</FormLabel>
                                                        <FormControl>
                                                            <Input type="url" placeholder="https://..." {...field} className="bg-background/50 border-emerald-200/20 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all" />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        {/* Tags & VIP */}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                                            <FormField
                                                control={form.control}
                                                name="tags"
                                                render={({ field }) => (
                                                    <FormItem className="md:col-span-2">
                                                        <FormLabel className="text-foreground/80">Tags</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="e.g. minimalist, reseller" {...field} className="bg-background/50 border-emerald-200/20 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all" />
                                                        </FormControl>
                                                        <FormDescription className="text-xs text-muted-foreground/70">
                                                            Comma-separated tags.
                                                        </FormDescription>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="isVip"
                                                render={({ field }) => (
                                                    <FormItem className="flex flex-row items-center justify-between rounded-xl border border-yellow-500/20 p-3 bg-yellow-500/5 shadow-sm hover:bg-yellow-500/10 transition-all h-[76px]">
                                                        <div className="space-y-0.5">
                                                            <FormLabel className="text-sm font-semibold text-yellow-600 dark:text-yellow-400">VIP Status</FormLabel>
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
                                </div>


                                {/* Section 4: Notes (Moved to Left Column) */}
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
                            </div>

                            {/* Right Column: Socials & Notes (Span 4) */}
                            <div className="lg:col-span-4 space-y-6">

                                {/* Social Links */}
                                <div className="space-y-4 group">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-cyan-500">
                                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                            Socials
                                        </h3>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 text-xs text-blue-500 hover:text-blue-600 hover:bg-blue-500/10"
                                            onClick={() => appendSocial({ platform: "", url: "" })}
                                        >
                                            <PlusCircle className="mr-1.5 h-3.5 w-3.5" />
                                            Add
                                        </Button>
                                    </div>

                                    <div className="space-y-3 p-5 border border-blue-500/10 rounded-xl bg-blue-500/5 hover:border-blue-500/20 hover:bg-blue-500/10 transition-all duration-300 min-h-[150px]">
                                        {socialFields.length === 0 ? (
                                            <div className="text-sm text-muted-foreground/60 text-center py-6 italic flex flex-col items-center gap-2">
                                                <div className="p-3 rounded-full bg-blue-500/10 text-blue-500">
                                                    <PlusCircle className="h-5 w-5" />
                                                </div>
                                                No social links.
                                            </div>
                                        ) : (
                                            socialFields.map((field, index) => (
                                                <div key={field.id} className="flex flex-col gap-2 group/item animate-in fade-in slide-in-from-bottom-2 duration-300 p-2 rounded-lg bg-background/40 border border-blue-500/5">
                                                    <div className="flex items-center gap-2">
                                                        <FormField
                                                            control={form.control}
                                                            name={`socialLinks.${index}.platform`}
                                                            render={({ field }) => (
                                                                <FormItem className="w-full">
                                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                                        <FormControl>
                                                                            <SelectTrigger className="h-8 bg-background/50 border-blue-200/20 focus:border-blue-500 focus:ring-blue-500/20 transition-all">
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
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-colors"
                                                            onClick={() => removeSocial(index)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                    <FormField
                                                        control={form.control}
                                                        name={`socialLinks.${index}.url`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormControl>
                                                                    <Input placeholder="Profile URL" {...field} className="h-8 bg-background/50 border-blue-200/20 focus:border-blue-500 focus:ring-blue-500/20 transition-all" />
                                                                </FormControl>
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>


                            </div>
                        </div>

                    </form>
                </Form>

                <DialogFooter className="p-6 pt-4 border-t border-white/10 bg-muted/5 backdrop-blur-sm flex-shrink-0">
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
        </Dialog >
    );
}
