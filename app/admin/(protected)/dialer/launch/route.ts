import { NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // matches My Dialer's own session TTL

// Bridges the current Highlander session into a My Dialer session so callers
// never see a second, separate login. My Dialer runs on the coldcalldogs-io
// codebase behind the "/admin/dialer/app" rewrite in next.config.ts, so a
// cookie set here with path "/admin/dialer/app" rides along on the redirect
// below and every request after it, all on the highlanderrei.com origin.
// (proxy.ts has explicit bypasses so Telnyx's webhooks and this app's own
// login/logout still work without an hlr_admin_session cookie.)
export async function GET(request: Request) {
  const session = await requireUser();
  const dialerUrl = process.env.COLD_CALL_DOGS_URL;
  const sharedSecret = process.env.INTEGRATION_SHARED_SECRET;

  if (!dialerUrl || !sharedSecret) {
    return NextResponse.json({ error: "Dialer integration is not configured." }, { status: 503 });
  }

  const user = await prisma.adminUser.findUnique({ where: { id: session.userId } });
  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  const response = await fetch(`${dialerUrl.replace(/\/$/, "")}/api/auth/sso`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${sharedSecret}`,
    },
    body: JSON.stringify({
      email: user.email,
      name: user.name,
      role: user.role,
      forwardingPhone: user.forwardingPhone,
    }),
  });

  if (!response.ok) {
    return NextResponse.json({ error: "Could not start a dialer session." }, { status: 502 });
  }

  const { token } = (await response.json()) as { token: string };

  const redirectResponse = NextResponse.redirect(new URL("/admin/dialer/app/dialer", request.url));
  redirectResponse.cookies.set("ccd_session", token, {
    path: "/admin/dialer/app",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_TTL_SECONDS,
  });
  return redirectResponse;
}
