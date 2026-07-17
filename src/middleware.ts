import { NextResponse, type NextRequest } from "next/server";

const publicPaths = ["/login", "/verify-otp", "/terms", "/privacy-policy"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = publicPaths.some(path => pathname === path);
  const hasSession = request.cookies.get("turfzy_session")?.value === "1";
  if (!isPublic && !hasSession) return NextResponse.redirect(new URL("/login", request.url));
  if ((pathname === "/login" || pathname === "/verify-otp") && hasSession) return NextResponse.redirect(new URL("/home", request.url));
  return NextResponse.next();
}

export const config = { matcher: ["/((?!api|_next|favicon.ico).*)"] };
