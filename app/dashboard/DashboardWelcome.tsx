"use client";

import React from "react";
import { motion } from "framer-motion";

interface DashboardWelcomeProps {
  salonName: string;
}

const DashboardWelcome: React.FC<DashboardWelcomeProps> = ({ salonName }) => {
  return (
    <div className="relative flex min-h-[60vh] items-center justify-center overflow-hidden bg-gray-50 dark:bg-gray-900">
      {/* Glowing gradient background */}
      <div
        className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center"
        aria-hidden="true"
      >
        <div className="h-[400px] w-[600px] rounded-full bg-gradient-to-tr from-pink-300 via-purple-300 to-blue-300 opacity-40 blur-3xl dark:from-pink-700 dark:via-purple-800 dark:to-blue-900 animate-pulse" />
      </div>
      <div className="relative z-10 flex flex-col items-center text-center px-4 py-16">
        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-4 drop-shadow-lg"
        >
          {`Welcome back, ${salonName}!`}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.7, ease: "easeOut" }}
          className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-xl"
        >
          Manage your services, view reviews, and grow your salon business.
        </motion.p>
      </div>
    </div>
  );
};

export default DashboardWelcome;
