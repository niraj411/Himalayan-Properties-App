import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // Admin routes protection
    if (pathname.startsWith("/admin")) {
      if (token?.role !== "ADMIN") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }

    // Tenant routes protection
    if (pathname.startsWith("/dashboard") && !pathname.startsWith("/admin")) {
      if (token?.role === "ADMIN") {
        return NextResponse.redirect(new URL("/admin", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        // Allow public routes
        if (
          pathname.startsWith("/login") ||
          pathname.startsWith("/register") ||
          pathname.startsWith("/apply") ||
          pathname.startsWith("/listings") ||
          pathname === "/" ||
          pathname.startsWith("/api/auth") ||
          pathname.startsWith("/api/register") ||
          pathname.startsWith("/api/listings") ||
          pathname === "/api/applications" || // public application submission (POST); collection GET is admin-gated in the route, [id] routes stay protected
          pathname === "/api/apply-context" || // public read-only data for the /apply form (property list + zillow url)
          pathname.startsWith("/api/cron") || // guarded by its own CRON_SECRET bearer token
          pathname.startsWith("/api/agent") || // guarded by its own AGENT_API_TOKEN bearer token
          pathname.startsWith("/uploads")
        ) {
          return true;
        }

        // Require authentication for all other routes
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico)).*)",
  ],
};
