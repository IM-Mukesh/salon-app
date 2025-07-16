"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import type { User, GoogleAuthResponse } from "@/lib/types";
import { fetcher } from "@/lib/api";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (googleToken: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // On mount, try to load token and user from localStorage
    const storedToken = localStorage.getItem("jwt_token");
    const storedUser = localStorage.getItem("user_data");

    if (storedToken && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
      } catch (e) {
        console.error("Failed to parse stored user data:", e);
        logout(); // Clear invalid data
      }
    }
    setLoading(false);
  }, []);

  const login = async (googleToken: string) => {
    setLoading(true);
    try {
      const data = await fetcher<GoogleAuthResponse>("/api/auth/google", {
        method: "POST",
        body: JSON.stringify({ credential: googleToken }), // ✅ FIXED HERE
      });

      setUser(data.user);
      setToken(data.token);
      localStorage.setItem("jwt_token", data.token);
      localStorage.setItem("user_data", JSON.stringify(data.user));
      toast.success("Logged in successfully!");
      router.push("/dashboard");
    } catch (error) {
      console.error("Login failed:", error);
      toast.error("Login failed. Please try again.");
      logout();
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("jwt_token");
    localStorage.removeItem("user_data");
    toast.info("Logged out.");
    router.push("/");
  };

  // Note: For production, consider using HttpOnly cookies for JWT storage
  // and server-side authentication checks to enhance security.
  // This client-side localStorage approach is for demonstration purposes.

  return (
    <AuthContext.Provider
      value={{ user, token, isAuthenticated: !!user, login, logout, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
