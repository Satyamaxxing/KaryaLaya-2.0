import React, { Suspense } from "react";
import type { Metadata } from "next";
import UnifiedAuthView from "@/components/auth/UnifiedAuthView";

export const metadata: Metadata = {
  title: "Join Now | KaryaLaya",
  description: "Create your KaryaLaya account to start your workspace.",
};

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#000000] text-sm text-[#71717a]">
          Loading KaryaLaya workspace...
        </div>
      }
    >
      <UnifiedAuthView initialMode="signup" />
    </Suspense>
  );
}
