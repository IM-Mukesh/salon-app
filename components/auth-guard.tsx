"use client"

import type React from "react"

import { useAuth } from "@/context/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { motion } from "framer-motion"
import { Loader2 } from "lucide-react"

interface AuthGuardProps {
  children: React.ReactNode
  allowedRoles?: ("customer" | "salon")[]
}

export function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const { isAuthenticated, user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.push("/?redirected=true") // Redirect to home if not authenticated
      } else if (allowedRoles && user && !allowedRoles.includes(user.role)) {
        // If authenticated but role not allowed, redirect to dashboard or home
        router.push("/dashboard") // Or a specific unauthorized page
        // Optionally show a toast: toast.error("You don't have permission to access this page.");
      }
    }
  }, [isAuthenticated, loading, router, user, allowedRoles])

  if (loading || !isAuthenticated || (allowedRoles && user && !allowedRoles.includes(user.role))) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-center min-h-[calc(100vh-10rem)]"
      >
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="sr-only">Loading...</span>
      </motion.div>
    )
  }

  return <>{children}</>
}
