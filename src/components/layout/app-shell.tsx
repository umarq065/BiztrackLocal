"use client";

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
  useSidebar,
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
  HelpCircle,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "../ui/button";

const navItems = [
  { href: "#", icon: LayoutDashboard, label: "Dashboard" },
  { href: "#", icon: DollarSign, label: "Incomes" },
  { href: "#", icon: Users, label: "Clients" },
  { href: "#", icon: ShoppingCart, label: "Orders" },
  { href: "#", icon: CreditCard, label: "Expenses" },
  { href: "#", icon: BookText, label: "Daily Summary" },
  { href: "#", icon: Notebook, label: "Business Notes" },
  { href: "#", icon: Swords, label: "Competitors" },
  { href: "#", icon: UserCircle, label: "Business Profile" },
  { href: "#", icon: Calendar, label: "Yearly Stats" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="p-4">
          <div className="flex items-center gap-3">
            <LayoutDashboard className="size-8 text-primary" />
            <div className="flex flex-col">
              <h2 className="text-lg font-semibold font-headline">BizTrack Pro</h2>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.label}>
                <SidebarMenuButton
                  href={item.href}
                  isActive={item.label === "Dashboard"}
                  tooltip={{
                    children: item.label,
                  }}
                >
                  <item.icon />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>

        <SidebarFooter>
          <SidebarMenu>
             <SidebarMenuItem>
                <SidebarMenuButton href="#">
                    <HelpCircle />
                    <span>Help & Support</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
                <SidebarMenuButton href="#">
                    <Settings />
                    <span>Settings</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <div className="flex items-center gap-3 px-2 py-4">
                 <Avatar className="h-10 w-10">
                    <AvatarImage src="https://placehold.co/100x100.png" alt="@shadcn" data-ai-hint="male avatar" />
                    <AvatarFallback>JD</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                    <span className="font-semibold text-sm">John Doe</span>
                    <span className="text-xs text-muted-foreground">john.doe@example.com</span>
                </div>
              </div>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
