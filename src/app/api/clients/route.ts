import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/server/auth";
import { AgencyWorkService } from "@/server/services";

export async function GET() {
  const user = await getCurrentSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const clients = await AgencyWorkService.listClients(user);
    return NextResponse.json({ clients });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to list clients" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = await getCurrentSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const client = await AgencyWorkService.createClient(user, {
      name: body.name,
      companyName: body.companyName,
      industry: body.industry,
      portalAccessEnabled: body.portalAccessEnabled,
    });

    return NextResponse.json({ client }, { status: 201 });
  } catch (error: any) {
    const status = error.message?.includes("Access Denied") ? 403 : 400;
    return NextResponse.json({ error: error.message || "Failed to create client" }, { status });
  }
}
