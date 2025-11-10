
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
      <div className="relative flex h-screen w-full">
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center gap-3">
              <AppLogo />
              <div className="flex flex-col group-data-[collapsed=true]:hidden">
                <h2 className="font-headline text-lg font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-primary to-foreground/80">
                  BizTrack Pro
                </h2>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith(item.href)}
                    tooltip={item.label}
                  >
                    <NProgressLink href={item.href}>
                      <item.icon />
                      <span className="group-data-[collapsed=true]:hidden">{item.label}</span>
                    </NProgressLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="mt-auto">
            <SidebarMenu>
              {settingsItems.map((item) => (
                  <SidebarMenuItem key={item.label}>
                      <SidebarMenuButton asChild isActive={pathname === item.href} tooltip={item.label}>
                          <NProgressLink href={item.href}>
                              <item.icon />
                              <span className="group-data-[collapsed=true]:hidden">{item.label}</span>
                          </NProgressLink>
                      </SidebarMenuButton>
                  </SidebarMenuItem>
              ))}
              <SidebarMenuItem>
                <ThemeToggle />
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={handleSignOut} tooltip="Sign Out">
                    <LogOut />
                    <span className="group-data-[collapsed=true]:hidden">Sign Out</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>

            <SidebarSeparator />
            
            <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                      <NProgressLink href="/business-profile">
                          <Avatar className="size-7">
                              <AvatarImage src="https://placehold.co/100x100.png" alt="@johndoe" data-ai-hint="male avatar" />
                              <AvatarFallback>JD</AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col group-data-[collapsed=true]:hidden">
                              <span className="font-semibold text-sm">John Doe</span>
                              <span className="text-xs text-muted-foreground">john.doe@example.com</span>
                          </div>
                      </NProgressLink>
                  </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
            
            <SidebarSeparator />
            <div className="p-2 flex items-center justify-center">
                <SidebarTrigger className="hidden md:block" />
            </div>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset>
          <div className="p-2 md:hidden">
            <SidebarTrigger />
          </div>
          {children}
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
