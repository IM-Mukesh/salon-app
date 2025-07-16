"use client";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { fetcher } from "@/lib/api";
import { useAuth } from "@/context/auth-context";

export default function GoogleCallback() {
  const router = useRouter();
  const params = useSearchParams();
  const code = params.get("code");
  const { login } = useAuth();

  useEffect(() => {
    if (code) {
      fetcher("http://localhost:5000/api/aut/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          redirectUri: process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI,
        }),
      })
        .then(async (data) => {
          await login(data.token);
          router.push("/dashboard");
        })
        .catch(() => {
          router.push("/?error=google_login_failed");
        });
    }
  }, [code, login, router]);

  return <div>Signing you in with Google...</div>;
}
