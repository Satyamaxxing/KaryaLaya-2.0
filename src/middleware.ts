import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const sessionCookie = request.cookies.get("karyalaya_session")?.value;
  const fullPath = pathname + search;

  // Pass current pathname to downstream server components via header
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);
  requestHeaders.set("x-url", request.url);

  // 1. Guard /app routes: require valid session cookie (in all environments)
  if (pathname.startsWith("/app")) {
    if (!sessionCookie) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", fullPath);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 2. Guard /client routes: require client session cookie (excluding /client/login)
  if (pathname.startsWith("/client") && !pathname.startsWith("/client/login")) {
    if (!sessionCookie) {
      const clientLoginUrl = new URL("/client/login", request.url);
      clientLoginUrl.searchParams.set("next", fullPath);
      return NextResponse.redirect(clientLoginUrl);
    }
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ["/app/:path*", "/client/:path*"],
};
