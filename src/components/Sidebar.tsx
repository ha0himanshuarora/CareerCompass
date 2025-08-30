
"use client"

import * as React from "react"
import Link from "next/link"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const Sidebar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <aside
    ref={ref}
    className={cn("fixed left-0 top-0 z-50 flex h-full flex-col border-r bg-sidebar text-sidebar-foreground w-16", className)}
    {...props}
  />
))
Sidebar.displayName = "Sidebar"

const SidebarContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-1 flex-col gap-4 p-2", className)}
    {...props}
  />
))
SidebarContent.displayName = "SidebarContent"

const SidebarHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center justify-center p-2 h-14", className)}
    {...props}
  />
))
SidebarHeader.displayName = "SidebarHeader"

const SidebarMenu = React.forwardRef<
  HTMLUListElement,
  React.HTMLAttributes<HTMLUListElement>
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    className={cn("flex flex-col items-center gap-2", className)}
    {...props}
  />
))
SidebarMenu.displayName = "SidebarMenu"

const menuItemVariants = cva(
    "flex size-12 items-center justify-center rounded-lg transition-colors",
    {
      variants: {
        isActive: {
          true: "bg-sidebar-accent text-sidebar-accent-foreground",
          false: "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
        },
      },
      defaultVariants: {
        isActive: false,
      },
    }
)

const SidebarMenuItem = React.forwardRef<
  HTMLLIElement,
  React.LiHTMLAttributes<HTMLLIElement> & { 
    href: string;
    isActive?: boolean;
    tooltip?: string;
  } & VariantProps<typeof menuItemVariants>
>(({ className, href, isActive, tooltip, children, ...props }, ref) => {
  
  const linkContent = (
    <Link href={href} className={cn(menuItemVariants({ isActive }), className)}>
      {children}
    </Link>
  )
  
  return (
    <li ref={ref} className="w-full" {...props}>
        <TooltipProvider delayDuration={0}>
            <Tooltip>
                <TooltipTrigger asChild>
                    {linkContent}
                </TooltipTrigger>
                {tooltip && (
                    <TooltipContent side="right" align="center">
                        <p>{tooltip}</p>
                    </TooltipContent>
                )}
            </Tooltip>
        </TooltipProvider>
    </li>
  )
})
SidebarMenuItem.displayName = "SidebarMenuItem"


const SidebarFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("mt-auto flex flex-col items-center gap-2 p-2", className)}
    {...props}
  />
))
SidebarFooter.displayName = "SidebarFooter"

export {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarFooter,
}
