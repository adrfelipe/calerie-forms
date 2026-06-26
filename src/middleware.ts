import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const adminPaths = ["/admin"];
const publicAdminPaths = ["/admin/login"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAdminPath = adminPaths.some((p) => pathname.startsWith(p));
  const isPublicAdmin = publicAdminPaths.some((p) => pathname.startsWith(p));

  if (isAdminPath && !isPublicAdmin) {
    const session = request.cookies.get("admin_session");
    if (!session || session.value !== "true") {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
