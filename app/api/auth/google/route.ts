import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { googleAuthUrl, isGoogleAuthConfigured, OAUTH_STATE_COOKIE } from "@/lib/google-auth";

// Starts "Sign in with Google": a one-time state value goes in a short-lived
// cookie and to Google, and the callback checks they match.
export async function GET(req: NextRequest) {
  if (!isGoogleAuthConfigured()) return NextResponse.redirect(new URL("/admin/login?error=google-setup", req.url));

  const state = randomBytes(24).toString("base64url");
  (await cookies()).set(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/api/auth/google",
  });
  return NextResponse.redirect(googleAuthUrl(state, new URL("/api/auth/google/callback", req.url).toString()));
}
