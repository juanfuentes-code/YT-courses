// Middleware runs in Edge Runtime — only import the lightweight config (no Prisma)
import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth({
  ...authConfig,
  callbacks: {
    authorized({ auth: session, request: { nextUrl } }) {
      const isLoggedIn = !!session?.user;
      const isProtected =
        nextUrl.pathname.startsWith("/dashboard") ||
        nextUrl.pathname.startsWith("/course");

      if (isProtected && !isLoggedIn) {
        return NextResponse.redirect(new URL("/", nextUrl));
      }
      if (nextUrl.pathname === "/" && isLoggedIn) {
        return NextResponse.redirect(new URL("/dashboard", nextUrl));
      }
      return true;
    },
  },
});

export default auth;

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
