import { NextResponse } from "next/server";
import { getCurrentSession } from "@/server/auth";
import { ClientPortalService } from "@/server/services/client-portal";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentSession();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const host = request.headers.get("host") || "localhost:3000";
    const proto = request.headers.get("x-forwarded-proto") || "http";
    const origin = `${proto}://${host}`;

    const result = await ClientPortalService.generateProjectShareLink(user, id, origin);

    return NextResponse.json({ success: true, ...result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to retrieve share link.";
    const status = message.includes("Unauthorized") ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentSession();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const host = request.headers.get("host") || "localhost:3000";
    const proto = request.headers.get("x-forwarded-proto") || "http";
    const origin = `${proto}://${host}`;

    const result = await ClientPortalService.generateProjectShareLink(user, id, origin);

    return NextResponse.json({ success: true, ...result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to generate share link.";
    const status = message.includes("Unauthorized") ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentSession();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const result = await ClientPortalService.revokeProjectShareLink(user, id);

    return NextResponse.json({ ...result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to revoke share link.";
    const status = message.includes("Unauthorized") ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
