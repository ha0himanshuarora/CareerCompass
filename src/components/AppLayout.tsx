
"use client";

import { usePathname, useRouter } from "next/navigation";
import { 
  Bell, 
  Briefcase, 
  FileText, 
  Search, 
  Users, 
  LayoutDashboard, 
  Lightbulb, 
  LogOut, 
  User,
  GanttChartSquare,
  Building,
  Handshake,
  FileQuestion,
  Trophy,
  ScrollText,
  BellRing,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Sidebar, SidebarMenu, SidebarMenuItem, SidebarHeader, SidebarFooter, SidebarContent } from "@/components/Sidebar";
import { useAuth } from "@/hooks/use-auth";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { ProtectedRoute } from "./ProtectedRoute";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";
import React, { useEffect } from "react";
import { Compass } from "lucide-react";
import { subscribeToPush } from "@/lib/pushClient";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";

const studentNavItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/find-jobs", icon: Briefcase, label: "Find Jobs" },
  { href: "/applications", icon: GanttChartSquare, label: "Applications" },
  { href: "/resumes", icon: FileText, label: "Resumes" },
  { href: "/student-tests", icon: FileQuestion, label: "Tests" },
  { href: "/timeline", icon: GanttChartSquare, label: "Timeline" },
  { href: "/skills-extractor", icon: Lightbulb, label: "Skills Extractor" },
];

const recruiterNavItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/jobs", icon: Briefcase, label: "Job Postings" },
  { href: "/candidates", icon: Users, label: "Candidates" },
  { href: "/tests", icon: FileQuestion, label: "Manage Tests" },
  { href: "/collaborations", icon: Handshake, label: "Collaborations" },
  { href: "/offer-letters", icon: ScrollText, label: "Offer Letters" },
];

const tpoNavItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/tpo/students", icon: Users, label: "Students" },
  { href: "/tpo/companies", icon: Building, label: "Companies" },
  { href: "/tpo/jobs", icon: Briefcase, label: "Job Postings" },
  { href: "/tests", icon: FileQuestion, label: "Manage Tests" },
  { href: "/tpo/collaborations", icon: Handshake, label: "Collaborations" },
];


export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, userProfile } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };
  
  const handleSubscribe = () => {
    if (userProfile) {
      subscribeToPush(userProfile.uid);
    }
  };
  
  const getNavItems = () => {
    switch (userProfile?.role) {
      case 'student':
        return studentNavItems;
      case 'recruiter':
        return recruiterNavItems;
      case 'tpo':
        return tpoNavItems;
      default:
        return [];
    }
  }

  const navItems = getNavItems();

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen w-full">
        <Sidebar>
          <SidebarContent>
            <SidebarHeader>
              <Compass className="size-7 text-primary" />
            </SidebarHeader>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}
                  href={item.href}
                  isActive={pathname.startsWith(item.href) && (item.href !== '/dashboard' || pathname === '/dashboard')}
                  tooltip={item.label}
                >
                  <item.icon className="size-5" />
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                 <Avatar className="size-9 cursor-pointer">
                  <AvatarImage src={user?.photoURL ?? "https://picsum.photos/100/100"} data-ai-hint="person" alt="User" />
                  <AvatarFallback>{user?.displayName?.charAt(0) ?? 'U'}</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" side="right">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/profile')}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>
        <div className="flex flex-col flex-1 pl-16">
          <header className="flex h-16 items-center justify-between gap-4 border-b bg-background/80 px-6 backdrop-blur-sm">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search..." className="pl-9" />
            </div>
            <div className="flex items-center gap-4">
              <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={handleSubscribe}>
                            <BellRing className="h-5 w-5" />
                            <span className="sr-only">Enable Notifications</span>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Enable Notifications</p>
                    </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </header>
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
