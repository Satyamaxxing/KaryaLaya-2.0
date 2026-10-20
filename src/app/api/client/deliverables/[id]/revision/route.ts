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

    const body = await request.json();
    const { comment } = body;

    if (!comment || typeof comment !== "string" || !comment.trim()) {
      return NextResponse.json(
        { error: "A comment detailing the requested revisions is strictly required." },
        { status: 400 }
      );
    }

    const result = await ClientPortalService.requestDeliverableRevisionAsClient(user, id, comment);

    return NextResponse.json({ ...result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to request revision.";
    const status = message.includes("Unauthorized") || message.includes("Access denied") ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
