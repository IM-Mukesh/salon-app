"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Settings,
  ImageIcon,
  Star,
  User2,
  ChevronUp,
  LogOut,
  MapPin,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/context/auth-context";
import { ThemeToggle } from "./ui/theme-toggle";

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isAuthenticated } = useAuth();
  const { toggleSidebar, isMobile } = useSidebar();

  const dashboardItems = [
    {
      title: "Profile",
      url: "/dashboard/profile",
      icon: User2,
      active: pathname === "/dashboard" || pathname === "/dashboard/profile",
    },
    {
      title: "Images",
      url: "/dashboard/images",
      icon: ImageIcon,
      active: pathname === "/dashboard/images",
    },
    {
      title: "Reviews",
      url: "/dashboard/reviews",
      icon: Star,
      active: pathname === "/dashboard/reviews",
    },
    {
      title: "Settings",
      url: "/dashboard/settings",
      icon: Settings,
      active: pathname === "/dashboard/settings",
    },
  ];

  // Only render sidebar if authenticated and is a salon user
  if (!isAuthenticated || user?.role !== "salon") {
    return null;
  }

  return (
    <Sidebar collapsible="icon" side="left">
      <SidebarHeader>
        <Link href="/dashboard" className="flex items-center gap-2 p-2">
          <MapPin className="h-6 w-6 text-primary" />
          <span className="text-lg font-semibold">SalonHub</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Dashboard</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {dashboardItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    isActive={item.active}
                    tooltip={item.title}
                    onClick={() => router.push(item.url)}
                  >
                    <item.icon />
                    <span className="sidebar-label">{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton>
                  <Avatar className="h-6 w-6">
                    <AvatarImage
                      src={user?.avatarUrl || "/placeholder-avatar.svg"}
                      alt={user?.name || "User"}
                    />
                    <AvatarFallback>
                      {user?.name ? user.name.charAt(0) : "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span>{user?.name || user?.email}</span>
                  <ChevronUp className="ml-auto h-4 w-4 shrink-0 opacity-50" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                className="w-[--radix-popper-anchor-width]"
              >
                <DropdownMenuItem
                  onClick={() => router.push("/dashboard/profile")}
                >
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => router.push("/dashboard/settings")}
                >
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <ThemeToggle />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
