"use client";
import DashboardWelcome from "./DashboardWelcome";
import { useAuth } from "@/context/auth-context";

export default function DashboardPage() {
  const { user } = useAuth();
  // Prefer user's name from Google login, fallback to salon name
  const salonName = user?.name || "Radiant Beauty Salon";

  return <DashboardWelcome salonName={salonName} />;
}
