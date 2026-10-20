import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/server/auth";
import { ClientPortalService } from "@/server/services/client-portal";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get("token") || undefined;

    let user = await getCurrentSession();

    if (!user && !token) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in or provide a valid share link." },
        { status: 401 }
      );
    }

    // If guest with valid share token, construct guest client session
    if (!user && token) {
      // Look up project by token to determine context
      const details = await ClientPortalService.getClientProjectDetails(
        {
          id: "guest-client",
          email: "guest@client.local",
          name: "Client Guest",
          role: "CLIENT",
          organizationId: "",
          organizationName: "",
        },
        id,
        token
      );
      return NextResponse.json({ success: true, project: details });
    }

    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const details = await ClientPortalService.getClientProjectDetails(user, id, token);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        canApprove: user.canApprove ?? true,
      },
      project: details,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load project.";
    const status = message.includes("Access denied") ? 403 : message.includes("not found") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
