import type React from "react";

import { AuthGuard } from "@/components/auth-guard";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard allowedRoles={["salon"]}>
      <div className="flex flex-col flex-1 p-4 md:p-6 lg:p-8">{children}</div>
    </AuthGuard>
  );
}
