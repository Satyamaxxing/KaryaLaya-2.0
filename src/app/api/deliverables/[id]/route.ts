import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/server/auth";
import { AgencyWorkService } from "@/server/services";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    const body = await req.json();

    if (body.status !== undefined) {
      // Status transition path: state machine enforced
      const deliverable = await AgencyWorkService.updateDeliverableStatus(
        user,
        id,
        body.status
      );
      return NextResponse.json({ deliverable });
    }

    // General update path
    const deliverable = await AgencyWorkService.updateDeliverable(user, id, {
      title: body.title,
      description: body.description,
      serviceType: body.serviceType,
      ownerId: body.ownerId,
      dueDate: body.dueDate,
      weight: body.weight,
      progressPercent: body.progressPercent,
    });

    return NextResponse.json({ deliverable });
  } catch (error: any) {
    const isDenied = error.message?.includes("Access Denied");
    const isInvalidTransition = error.message?.includes("Invalid Deliverable Transition");
    const status = isDenied ? 403 : isInvalidTransition ? 422 : 400;
    return NextResponse.json({ error: error.message || "Failed to update deliverable" }, { status });
  }
}
