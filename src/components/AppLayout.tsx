

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
  Settings,
  GanttChartSquare,
  Building,
  School
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
import React from "react";
import { Compass } from "lucide-react";

const studentNavItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/applications", icon: Briefcase, label: "Applications" },
  { href: "/resumes", icon: FileText, label: "Resumes" },
  { href: "/timeline", icon: GanttChartSquare, label: "Timeline" },
  { href: "/skills-extractor", icon: Lightbulb, label: "Skills Extractor" },
];

const recruiterNavItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/jobs", icon: Briefcase, label: "Job Postings" },
  { href: "/candidates", icon: Users, label: "Candidates" },
];

const tpoNavItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/students", icon: Users, label: "Students" },
  { href: "/companies", icon: Building, label: "Companies" },
  { href: "/placements", icon: School, label: "Placements" },
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
  
  const getNavItems = () => {
    switch (userProfile?.role) {
      case 'student':
        return studentNavItems;
      case 'recruiter':
        return recruiterNavItems;
      case 'tpo':
         // For now, only show dashboard, as per request
        return [tpoNavItems[0]];
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
                  isActive={pathname.startsWith(item.href)}
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
                <DropdownMenuItem onClick={() => router.push('/settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
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
              <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5" />
                <span className="sr-only">Notifications</span>
              </Button>
            </div>
          </header>
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
