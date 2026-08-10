import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const COOKIE = "hlr_admin_session";

// My Dialer (coldcalldogs-io) is proxied in under /admin/dialer/app — most of
// it should still require our own session, but these specific paths are hit
// by parties that will never have an hlr_admin_session cookie: Telnyx calls
// its webhooks server-to-server (verifies its own request signature instead),
// and the app's own login/logout need to be reachable before any session
// exists at all.
const DIALER_APP_PREFIX = "/admin/dialer/app";
const DIALER_APP_BYPASS_PATHS = [
  `${DIALER_APP_PREFIX}/login`,
  `${DIALER_APP_PREFIX}/api/auth/login`,
  `${DIALER_APP_PREFIX}/api/auth/logout`,
  `${DIALER_APP_PREFIX}/api/telnyx/webhook`,
  `${DIALER_APP_PREFIX}/api/telnyx/sms-webhook`,
];

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET must be configured in production.");
  }
  return new TextEncoder().encode(secret ?? "local-development-session-secret");
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (!pathname.startsWith("/admin")) return NextResponse.next();
  if (pathname === "/admin/login") return NextResponse.next();
  if (DIALER_APP_BYPASS_PATHS.includes(pathname)) return NextResponse.next();

  const token = req.cookies.get(COOKIE)?.value;
  if (!token) return NextResponse.redirect(new URL("/admin/login", req.url));

  try {
    await jwtVerify(token, getSecret());
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }
}

export const config = {
  matcher: ["/admin/:path*"],
};
