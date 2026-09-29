import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicPaths = ["/", "/login", "/signup"];
const studentPaths = ["/dashboard/student"];
const professionalPaths = ["/dashboard/professional"];
const validRoles = new Set(["student", "professional"]);

function isPublic(pathname: string) {
  return publicPaths.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

function isStudentPath(pathname: string) {
  return studentPaths.some((p) => pathname.startsWith(p));
}

function isProfessionalPath(pathname: string) {
  return professionalPaths.some((p) => pathname.startsWith(p));
}

function isSharedPath(pathname: string) {
  return pathname.startsWith("/chat");
}

function isValidRole(role: unknown): role is "student" | "professional" {
  return typeof role === "string" && validRoles.has(role);
}

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  if (isPublic(pathname)) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (
      token &&
      (pathname === "/login" || pathname.startsWith("/signup")) &&
      isValidRole(token.role)
    ) {
      const role = token.role as string;
      const url = req.nextUrl.clone();
      url.pathname = role === "student" ? "/dashboard/student" : "/dashboard/professional";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  if (!isValidRole(token.role)) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  const role = token.role;
  if (pathname === "/dashboard" || pathname === "/dashboard/") {
    const url = req.nextUrl.clone();
    url.pathname = role === "student" ? "/dashboard/student" : "/dashboard/professional";
    return NextResponse.redirect(url);
  }
  if (isSharedPath(pathname)) {
    return NextResponse.next();
  }
  if (isStudentPath(pathname) && role !== "student") {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard/professional";
    return NextResponse.redirect(url);
  }
  if (isProfessionalPath(pathname) && role !== "professional") {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard/student";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next|favicon.ico|sitemap.xml|robots.txt|.*\\..*).*)"],
};
