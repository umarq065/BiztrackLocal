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
                  isActive={pathname === item.href}
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
