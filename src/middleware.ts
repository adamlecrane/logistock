import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { withAuth } from "next-auth/middleware";

export default withAuth(
  function middleware(req: NextRequest) {
    // Forward the pathname so server components can read it
    const res = NextResponse.next();
    res.headers.set("x-pathname", req.nextUrl.pathname);
    return res;
  },
  { pages: { signIn: "/login" } }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/orders/:path*",
    "/products/:path*",
    "/tracking/:path*",
    "/finance/:path*",
    "/converter/:path*",
    "/subscriptions/:path*",
    "/invoices/:path*",
    "/billing/:path*",
    "/locked/:path*",
    "/users/:path*",
    "/activity/:path*",
    "/settings/:path*",
    "/api/orders/:path*",
    "/api/settings/:path*",
    "/api/products/:path*",
    "/api/stats/:path*",
    "/api/tracking/:path*",
    "/api/subscriptions/:path*",
    "/api/invoices/:path*",
    "/api/billing/:path*",
    "/api/users/:path*",
    "/api/activity/:path*",
  ],
};
