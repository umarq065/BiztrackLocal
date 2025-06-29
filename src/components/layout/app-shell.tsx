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
  { href: "/yearly-stats", icon: Calendar, label: "Yearly Stats" },
];

const settingsItems = [
    { href: "/business-profile", icon: UserCircle, label: "Business Profile" },
    { href: "#", icon: Settings, label: "Settings" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  return (
    <SidebarProvider>
      <div className="relative flex h-screen w-full">
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center gap-3">
              <LayoutDashboard className="size-7 text-primary" />
              <div className="flex flex-col group-data-[collapsed=true]:hidden">
                <h2 className="text-lg font-semibold font-headline">BizTrack Pro</h2>
              </div>
            </div>
            <SidebarTrigger className="hidden md:block" />
          </SidebarHeader>

          <SidebarContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
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
            <SidebarSeparator />
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
              <SidebarSeparator />
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
