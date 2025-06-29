"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { VariantProps, cva } from "class-variance-authority"
import { PanelLeft } from "lucide-react"

import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

type SidebarContext = {
  isCollapsed: boolean
  isMobile: boolean
  setOpen: (open: boolean) => void
  toggle: () => void
}

const SidebarContext = React.createContext<SidebarContext | null>(null)

function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.")
  }
  return context
}

function SidebarProvider({
  children,
  defaultCollapsed,
}: {
  children: React.ReactNode
  defaultCollapsed?: boolean
}) {
  const isMobile = useIsMobile()
  const [isCollapsed, setIsCollapsed] = React.useState(
    (isMobile ? true : defaultCollapsed) ?? false
  )

  const setOpen = React.useCallback(
    (open: boolean) => {
      setIsCollapsed(!open)
    },
    [setIsCollapsed]
  )

  const toggle = React.useCallback(() => {
    setIsCollapsed((prev) => !prev)
  }, [setIsCollapsed])

  React.useEffect(() => {
    if (isMobile) {
      setIsCollapsed(true)
    }
  }, [isMobile])

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "b" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        toggle()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [toggle])

  return (
    <SidebarContext.Provider
      value={{
        isCollapsed,
        isMobile,
        setOpen,
        toggle,
      }}
    >
      <TooltipProvider delayDuration={0}>{children}</TooltipProvider>
    </SidebarContext.Provider>
  )
}

const Sidebar = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    side?: "left" | "right"
  }
>(({ side = "left", className, ...props }, ref) => {
  const { isCollapsed, isMobile, setOpen } = useSidebar()

  if (isMobile) {
    return (
      <Sheet open={!isCollapsed} onOpenChange={(open) => setOpen(open)}>
        <SheetContent
          side={side}
          className="w-72 bg-sidebar p-0 text-sidebar-foreground"
        >
          <div
            className={cn("flex h-full flex-col", className)}
            {...props}
            ref={ref}
          />
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <div
      ref={ref}
      className={cn(
        "z-10 hidden shrink-0 border-r bg-sidebar text-sidebar-foreground transition-[width] md:flex md:flex-col",
        isCollapsed ? "w-14" : "w-72",
        className
      )}
      data-collapsed={isCollapsed}
      {...props}
    />
  )
})
Sidebar.displayName = "Sidebar"

const SidebarTrigger = React.forwardRef<
  React.ElementRef<typeof Button>,
  React.ComponentProps<typeof Button>
>(({ className, ...props }, ref) => {
  const { toggle } = useSidebar()

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      className={cn("size-7", className)}
      onClick={toggle}
      {...props}
    >
      <PanelLeft />
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  )
})
SidebarTrigger.displayName = "SidebarTrigger"

const SidebarInset = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"main">
>(({ className, ...props }, ref) => {
  return (
    <main
      ref={ref}
      className={cn("flex flex-1 flex-col bg-background", className)}
      {...props}
    />
  )
})
SidebarInset.displayName = "SidebarInset"

const SidebarHeader = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  const { isCollapsed } = useSidebar()

  return (
    <div
      ref={ref}
      className={cn(
        "flex h-14 shrink-0 items-center border-b px-4",
        isCollapsed ? "justify-center" : "justify-between",
        className
      )}
      {...props}
    />
  )
})
SidebarHeader.displayName = "SidebarHeader"

const SidebarFooter = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("flex flex-col gap-1 border-t p-2", className)}
      {...props}
    />
  )
})
SidebarFooter.displayName = "SidebarFooter"

const SidebarSeparator = React.forwardRef<
  React.ElementRef<"hr">,
  React.ComponentProps<"hr">
>(({ className, ...props }, ref) => {
  return (
    <hr
      ref={ref}
      className={cn("mx-2 border-sidebar-border", className)}
      {...props}
    />
  )
})
SidebarSeparator.displayName = "SidebarSeparator"

const SidebarContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("flex flex-1 flex-col gap-1 overflow-auto", className)}
      {...props}
    />
  )
})
SidebarContent.displayName = "SidebarContent"

const SidebarMenu = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<"ul">
>(({ className, ...props }, ref) => {
  return (
    <ul
      ref={ref}
      className={cn("flex flex-col gap-1 p-2", className)}
      {...props}
    />
  )
})
SidebarMenu.displayName = "SidebarMenu"

const SidebarMenuItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<"li">
>(({ ...props }, ref) => {
  return <li ref={ref} {...props} />
})
SidebarMenuItem.displayName = "SidebarMenuItem"

const sidebarMenuButtonVariants = cva(
  "flex w-full items-center gap-3 overflow-hidden whitespace-nowrap rounded-md p-2 text-left text-sm outline-none ring-sidebar-ring transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50 group-data-[collapsed]:justify-center group-data-[collapsed]:p-0 group-data-[collapsed]:data-[has-children=true]:hidden [&>svg]:size-4 [&>svg]:shrink-0",
  {
    variants: {
      isActive: {
        true: "bg-sidebar-accent text-sidebar-accent-foreground",
      },
    },
  }
)

const SidebarMenuButton = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> & {
    asChild?: boolean
    isActive?: boolean
    tooltip?: React.ReactNode
  } & VariantProps<typeof sidebarMenuButtonVariants>
>(
  (
    { asChild = false, isActive = false, tooltip, className, children, ...props },
    ref
  ) => {
    const { isCollapsed } = useSidebar()
    const Comp = asChild ? Slot : "button"

    const button = (
      <Comp
        ref={ref}
        className={cn(sidebarMenuButtonVariants({ isActive }), className)}
        data-active={isActive}
        {...props}
      >
        {children}
      </Comp>
    )

    if (isCollapsed && tooltip) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent side="right" align="center">
            {tooltip}
          </TooltipContent>
        </Tooltip>
      )
    }

    return button
  }
)
SidebarMenuButton.displayName = "SidebarMenuButton"

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
}
