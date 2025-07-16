"use client"

import type React from "react"

import { AuthGuard } from "@/components/auth-guard"
import { motion } from "framer-motion"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const variants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.5 } },
  }

  return (
    <AuthGuard allowedRoles={["salon"]}>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={variants}
        className="flex flex-col flex-1 p-4 md:p-6 lg:p-8"
      >
        {children}
      </motion.div>
    </AuthGuard>
  )
}
