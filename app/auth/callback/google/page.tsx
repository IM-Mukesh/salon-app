"use client";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { fetcher } from "@/lib/api";
import { useAuth } from "@/context/auth-context";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";
const FRONTEND_URL =
  process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000";

export default function GoogleCallback() {
  const router = useRouter();
  const params = useSearchParams();
  const code = params.get("code");
  const { login } = useAuth();

  useEffect(() => {
    if (code) {
      fetcher(`${BACKEND_URL}/api/aut/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          redirectUri: `${FRONTEND_URL}/auth/callback/google`,
        }),
      })
        .then(async (data: any) => {
          if (data && typeof data === "object" && "token" in data) {
            await login((data as { token: string }).token);
            router.push("/dashboard");
          } else {
            router.push("/?error=google_login_failed");
          }
        })
        .catch(() => {
          router.push("/?error=google_login_failed");
        });
    }
  }, [code, login, router]);

  return <div>Signing you in with Google...</div>;
}
