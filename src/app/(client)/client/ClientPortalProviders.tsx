"use client";

import React from "react";
import { WorkStateProvider } from "@/lib/state/work-state-context";
import { AuthenticatedUser } from "@/server/auth";

export function ClientPortalProviders({
  children,
  initialUser,
}: {
  children: React.ReactNode;
  initialUser?: AuthenticatedUser;
}) {
  return <WorkStateProvider initialUser={initialUser}>{children}</WorkStateProvider>;
}
