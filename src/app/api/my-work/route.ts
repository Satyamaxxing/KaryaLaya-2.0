import { NextResponse } from "next/server";
import { getCurrentSession } from "@/server/auth";
import { AgencyWorkService } from "@/server/services";

export async function GET() {
  const user = await getCurrentSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await AgencyWorkService.listMyWork(user);
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to load My Work" }, { status: 500 });
  }
}
