import React, { Suspense } from "react";
import type { Metadata } from "next";
import UnifiedAuthView from "@/components/auth/UnifiedAuthView";

export const metadata: Metadata = {
  title: "Sign In or Join Now | KaryaLaya",
  description: "Sign in or create your KaryaLaya account to access your workspace.",
};

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#000000] text-sm text-[#71717a]">
          Loading KaryaLaya workspace...
        </div>
      }
    >
      <UnifiedAuthView initialMode="login" />
    </Suspense>
  );
}
