"use client";

import { usePathname } from "next/navigation";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  DollarSign,
  CreditCard,
  BookText,
  Swords,
  UserCircle,
  Settings,
  Notebook,
  Gauge,
  CalendarRange,
  LogOut,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "./theme-toggle";
import NProgressLink from "./nprogress-link";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/incomes", icon: DollarSign, label: "Incomes" },
  { href: "/clients", icon: Users, label: "Clients" },
  { href: "/orders", icon: ShoppingCart, label: "Orders" },
  { href: "/expenses", icon: CreditCard, label: "Expenses" },
  { href: "/daily-summary", icon: BookText, label: "Daily Summary" },
  { href: "/business-notes", icon: Notebook, label: "Business Notes" },
  { href: "/competitors", icon: Swords, label: "Competitors" },
  { href: "/detailed-metrics", icon: Gauge, label: "Detailed Metrics" },
  { href: "/yearly-stats", icon: CalendarRange, label: "Yearly Stats" },
];

const settingsItems = [
  { href: "/business-profile", icon: UserCircle, label: "Business Profile" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

function AppLogo() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
    >
      <rect width="28" height="28" rx="8" fill="url(#logo-gradient)" />
      <path d="M8 18.5V14.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 18.5V9.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 18.5V12.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <defs>
        <linearGradient
          id="logo-gradient"
          x1="0"
          y1="0"
          x2="28"
          y2="28"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="hsl(var(--primary))" />
          <stop offset="1" stopColor="hsl(var(--primary) / 0.5)" />
        </linearGradient>
      </defs>
    </svg>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      toast({ title: "Logged Out", description: "You have been successfully signed out." });
      router.push("/");
    } catch (error) {
      toast({ variant: "destructive", title: "Logout Failed", description: "Could not log out. Please try again." });
    }
  };

  return (
    <SidebarProvider>
      <div className="relative flex h-screen w-full bg-background">
        <Sidebar className="border-r border-border/40 bg-card text-card-foreground shadow-2xl dark:bg-[#0f172a] dark:text-slate-300 dark:border-r-0" data-premium="true">
          <SidebarHeader className="border-b border-border/40 bg-card pb-4 pt-4 dark:bg-[#0f172a] dark:border-white/5">
            <div className="flex items-center gap-3 px-2">
              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 shadow-lg shadow-blue-500/20">
                <AppLogo />
              </div>
              <div className="flex flex-col group-data-[collapsed=true]:hidden">
                <h2 className="font-headline text-xl font-bold tracking-tight text-foreground dark:text-white">
                  BizTrack<span className="text-blue-600 dark:text-blue-400">Pro</span>
                </h2>
                <span className="text-xs font-medium text-muted-foreground dark:text-slate-500">Business Management</span>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent className="bg-card px-2 py-4 dark:bg-[#0f172a]">
            <SidebarMenu className="gap-2">
              {navItems.map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton
                      asChild
                      tooltip={item.label}
                      className={cn(
                        "relative overflow-hidden rounded-lg px-3 py-2.5 transition-all duration-200",
                        isActive
                          ? "bg-gradient-to-r from-blue-600/10 to-violet-600/10 text-blue-600 shadow-sm ring-1 ring-blue-600/20 dark:from-blue-600/20 dark:to-violet-600/20 dark:text-white dark:ring-white/10"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white"
                      )}
                    >
                      <NProgressLink href={item.href} className="flex items-center gap-3">
                        <item.icon className={cn("h-5 w-5 transition-colors", isActive ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground group-hover:text-foreground dark:text-slate-500 dark:group-hover:text-slate-300")} />
                        <span className="font-medium tracking-wide group-data-[collapsed=true]:hidden">{item.label}</span>
                        {isActive && (
                          <div className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-blue-600 shadow-[0_0_12px_rgba(37,99,235,0.5)] dark:bg-blue-500 dark:shadow-[0_0_12px_rgba(59,130,246,0.5)]" />
                        )}
                      </NProgressLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="border-t border-border/40 bg-card p-4 dark:bg-[#0f172a] dark:border-white/5">
            <SidebarMenu className="gap-2">
              {settingsItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton
                      asChild
                      tooltip={item.label}
                      className={cn(
                        "rounded-lg px-3 py-2 transition-colors",
                        isActive ? "bg-accent text-accent-foreground dark:bg-white/10 dark:text-white" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white"
                      )}
                    >
                      <NProgressLink href={item.href} className="flex items-center gap-3">
                        <item.icon className="h-4 w-4" />
                        <span className="group-data-[collapsed=true]:hidden">{item.label}</span>
                      </NProgressLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
              <SidebarMenuItem>
                <div className="px-3 py-2">
                  <ThemeToggle />
                </div>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={handleSignOut}
                  tooltip="Sign Out"
                  className="rounded-lg px-3 py-2 text-destructive hover:bg-destructive/10 hover:text-destructive dark:text-red-400 dark:hover:bg-red-500/10 dark:hover:text-red-300"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="group-data-[collapsed=true]:hidden">Sign Out</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>

            <div className="my-4 h-px bg-gradient-to-r from-transparent via-border to-transparent dark:via-white/10" />

            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild className="h-auto py-3 hover:bg-accent dark:hover:bg-white/5">
                  <NProgressLink href="/business-profile" className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="h-9 w-9 border-2 border-background shadow-sm dark:border-white/10">
                        <AvatarImage src="https://placehold.co/100x100.png" alt="@johndoe" />
                        <AvatarFallback className="bg-blue-600 text-white">JD</AvatarFallback>
                      </Avatar>
                      <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-background dark:ring-[#0f172a]" />
                    </div>
                    <div className="flex flex-col gap-0.5 group-data-[collapsed=true]:hidden text-left">
                      <span className="text-sm font-semibold text-foreground dark:text-white">John Doe</span>
                      <span className="text-xs text-muted-foreground dark:text-slate-500">Pro Member</span>
                    </div>
                  </NProgressLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>

            <div className="mt-2 flex justify-center md:justify-end">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground dark:text-slate-400 dark:hover:text-white" />
            </div>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset className="bg-muted/30 dark:bg-muted/5">
          <div className="p-4 md:hidden">
            <SidebarTrigger />
          </div>
          {children}
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
