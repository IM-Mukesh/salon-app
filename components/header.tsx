"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MapPin, LogIn, LogOut, Menu } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { ThemeToggle } from "./ui/theme-toggle";

export function Header() {
  const { isAuthenticated, user, logout } = useAuth();
  const router = useRouter();
  const { isMobile } = useSidebar();

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-background px-4 md:px-6 lg:px-8">
      <div className="flex items-center gap-4">
        {isAuthenticated && <SidebarTrigger className="md:hidden" />}
        <Link href="/" className="flex items-center gap-2">
          <MapPin className="h-6 w-6 text-primary" />
          <span className="text-lg font-semibold">SalonHub</span>
        </Link>
      </div>
      <nav className="flex items-center gap-4">
        {isAuthenticated ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="relative h-8 w-8 rounded-full bg-transparent p-0 border-0"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={user?.avatarUrl || "/placeholder-avatar.svg"}
                    alt={user?.name || "User"}
                  />
                  <AvatarFallback>
                    {user?.name ? user.name.charAt(0) : "U"}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuItem className="flex flex-col items-start space-y-1">
                <p className="text-sm font-medium leading-none">
                  {user?.name || "User"}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email}
                </p>
              </DropdownMenuItem>
              {user?.role === "salon" && (
                <DropdownMenuItem
                  onClick={() => router.push("/dashboard/profile")}
                >
                  Dashboard
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button onClick={() => router.push("/")} variant="ghost">
            <LogIn className="mr-2 h-4 w-4" />
            Login
          </Button>
        )}
        <ThemeToggle />
      </nav>
    </header>
  );
}
