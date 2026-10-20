import { NextResponse } from "next/server";
import { getCurrentSession } from "@/server/auth";
import { listProjectTemplates } from "@/server/services";

export async function GET() {
  const user = await getCurrentSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const templates = listProjectTemplates();
  return NextResponse.json({ templates });
}
