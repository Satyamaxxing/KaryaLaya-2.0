import { NextResponse } from "next/server";
import { getCurrentSession } from "@/server/auth";
import { ClientPortalService } from "@/server/services/client-portal";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentSession();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
    }

    let note: string | undefined;
    try {
      const body = await request.json();
      note = body.note;
    } catch {
      // note is optional
    }

    const result = await ClientPortalService.approveDeliverableAsClient(user, id, { note });

    return NextResponse.json({ ...result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to approve deliverable.";
    const status = message.includes("Unauthorized") || message.includes("Access denied") ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
