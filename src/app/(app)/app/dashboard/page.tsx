import { redirect } from "next/navigation";
import { getCurrentSession } from "@/server/auth";
import { DashboardService, OwnerDashboardData, MemberDashboardData } from "@/server/services";
import { OwnerDashboardView } from "@/components/dashboard/OwnerDashboardView";
import { ManagerDashboardView } from "@/components/dashboard/ManagerDashboardView";
import { MemberDashboardView } from "@/components/dashboard/MemberDashboardView";

export default async function DashboardPage() {
  const user = await getCurrentSession();

  if (!user) {
    redirect("/login?next=/app/dashboard");
  }

  // Client role must NEVER enter the internal agency shell
  if (user.role === "CLIENT") {
    redirect("/client");
  }

  // Server-side permission check & scoped data query
  const dashboardData = await DashboardService.getDashboardData(user);

  // The dashboard component is chosen STRICTLY server-side from session user role.
  // URL or query parameters can NEVER override or expose another role's dashboard.
  if (user.role === "OWNER") {
    return <OwnerDashboardView data={dashboardData as OwnerDashboardData} user={user} />;
  }

  if (user.role === "MANAGER") {
    return <ManagerDashboardView data={dashboardData as OwnerDashboardData} user={user} />;
  }

  return <MemberDashboardView data={dashboardData as MemberDashboardData} user={user} />;
}
