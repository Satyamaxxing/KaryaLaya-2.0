import React from "react";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getCurrentSession } from "@/server/auth";
import { ClientPortalProviders } from "./ClientPortalProviders";

export default async function ClientPortalLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";

  // The client login page is public and must not redirect to itself
  if (pathname.startsWith("/client/login")) {
    return <>{children}</>;
  }

  const session = await getCurrentSession();

  if (!session) {
    redirect(`/client/login?next=${encodeURIComponent(pathname || "/client")}`);
  }

  return <ClientPortalProviders initialUser={session}>{children}</ClientPortalProviders>;
}
