"use client";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useTheme } from "next-themes";
import React from "react";

export function GoogleSignInButton({
  onClick,
  loading,
}: {
  onClick?: () => void;
  loading?: boolean;
}) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <Button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={`flex items-center justify-center gap-2 w-full max-w-xs mx-auto font-medium rounded-full border
        ${
          isDark
            ? "bg-black text-white border-black hover:bg-neutral-900"
            : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
        } shadow-sm h-12 px-6`}
      variant="outline"
    >
      <Image
        src="/google-icon.svg"
        alt="Google"
        width={24}
        height={24}
        className="mr-2"
      />
      Sign in with Google
    </Button>
  );
}
