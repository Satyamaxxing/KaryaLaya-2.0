import React from "react";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getCurrentSession } from "@/server/auth";
import { canAccessRoute } from "@/lib/permissions/route-permissions";
import { AppShellProviders } from "./AppShellProviders";
import { AccessDeniedView } from "@/components/work-os/AccessDeniedView";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getCurrentSession();

  if (!session) {
    const headersList = await headers();
    const pathname = headersList.get("x-pathname") || "/app/dashboard";
    redirect(`/login?next=${encodeURIComponent(pathname)}`);
  }

  // If an external client user attempts to access internal app shell, redirect to client portal
  if (session.role === "CLIENT") {
    redirect("/client");
  }

  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "/app/dashboard";

  // Server-side route permission guard: returns proper 403 page if role cannot access
  if (!canAccessRoute(session.role, pathname)) {
    return (
      <AppShellProviders initialUser={session}>
        <AccessDeniedView role={session.role} pathname={pathname} />
      </AppShellProviders>
    );
  }

  return <AppShellProviders initialUser={session}>{children}</AppShellProviders>;
}

