import { NextResponse } from "next/server";
import { getCurrentSession, inviteTeamMember } from "@/server/auth";

export async function POST(request: Request) {
  try {
    const user = await getCurrentSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { email, role, jobTitle } = body;

    if (!email || !role) {
      return NextResponse.json({ error: "Email and role are required." }, { status: 400 });
    }

    const result = await inviteTeamMember({
      invitedBy: user,
      email,
      role,
      jobTitle,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to send invitation";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
