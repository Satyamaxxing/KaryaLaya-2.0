"use client";

import React from "react";
import { WorkStateProvider } from "@/lib/state/work-state-context";
import { AppShell } from "@/components/app-shell/AppShell";
import { AuthenticatedUser } from "@/server/auth";

export function AppShellProviders({
  children,
  initialUser,
}: {
  children: React.ReactNode;
  initialUser: AuthenticatedUser;
}) {
  return (
    <WorkStateProvider initialUser={initialUser}>
      <AppShell>{children}</AppShell>
    </WorkStateProvider>
  );
}
