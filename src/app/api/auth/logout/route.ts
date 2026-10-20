import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { logout, SESSION_COOKIE_NAME } from "@/server/auth";

export async function POST() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (sessionToken) {
    await logout(sessionToken);
  }

  const response = NextResponse.json({ success: true });
  response.cookies.delete(SESSION_COOKIE_NAME);
  return response;
}
