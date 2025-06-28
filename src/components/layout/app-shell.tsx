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
  Calendar,
  Settings,
  Notebook,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "./theme-toggle";
import NProgressLink from "./nprogress-link";

const navItems = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/incomes", icon: DollarSign, label: "Incomes" },
  { href: "/clients", icon: Users, label: "Clients" },
  { href: "/orders", icon: ShoppingCart, label: "Orders" },
  { href: "/expenses", icon: CreditCard, label: "Expenses" },
  { href: "/daily-summary", icon: BookText, label: "Daily Summary" },
  { href: "/business-notes", icon: Notebook, label: "Business Notes" },
  { href: "/competitors", icon: Swords, label: "Competitors" },
  { href: "/business-profile", icon: UserCircle, label: "Business Profile" },
  { href: "/yearly-stats", icon: Calendar, label: "Yearly Stats" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LayoutDashboard className="size-8 text-primary" />
            <div className="flex flex-col group-data-[collapsible=icon]:hidden">
              <h2 className="text-lg font-semibold font-headline">BizTrack Pro</h2>
            </div>
          </div>
           <SidebarTrigger className="hidden md:flex" />
        </SidebarHeader>

        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.label}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href}
                  tooltip={{
                    children: item.label,
                  }}
                >
                  <NProgressLink href={item.href} passHref>
                    <item.icon />
                    <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                  </NProgressLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>

        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip={{children: 'Settings'}}>
                  <NProgressLink href="#" passHref>
                    <Settings />
                    <span className="group-data-[collapsible=icon]:hidden">Settings</span>
                  </NProgressLink>
                </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <ThemeToggle />
            </SidebarMenuItem>
          </SidebarMenu>
          <SidebarSeparator className="my-2" />
           <div className="flex items-center gap-3 px-2 py-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-2">
              <Avatar className="h-10 w-10">
                <AvatarImage src="https://placehold.co/100x100.png" alt="@shadcn" data-ai-hint="male avatar" />
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
              <div className="flex flex-col group-data-[collapsible=icon]:hidden">
                  <span className="font-semibold text-sm">John Doe</span>
                  <span className="text-xs text-muted-foreground">john.doe@example.com</span>
              </div>
            </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <div className="p-2 md:hidden">
          <SidebarTrigger />
        </div>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
