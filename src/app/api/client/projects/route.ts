import { NextResponse } from "next/server";
import { getCurrentSession } from "@/server/auth";
import { ClientPortalService } from "@/server/services/client-portal";

export async function GET() {
  try {
    const user = await getCurrentSession();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized. Please sign in via magic link." }, { status: 401 });
    }

    const data = await ClientPortalService.getClientProjects(user);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        canApprove: user.canApprove ?? true,
      },
      ...data,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load client projects.";
    const status = message.includes("Access denied") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
