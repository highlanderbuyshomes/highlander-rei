import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const COOKIE = "hlr_admin_session";
const MAX_AGE = 60 * 60 * 8; // 8 hours

type SessionPayload = { userId: string; role: string };

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET must be configured in production.");
  }
  return new TextEncoder().encode(secret ?? "local-development-session-secret");
}

export async function createSession(userId: string, role: string) {
  const token = await new SignJWT({ userId, role } satisfies SessionPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(getSecret());

  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MAX_AGE,
    path: "/",
  });
}

export async function deleteSession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function getSessionUser(): Promise<SessionPayload | null> {
  try {
    const jar = await cookies();
    const token = jar.get(COOKIE)?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, getSecret());
    if (typeof payload.userId !== "string" || typeof payload.role !== "string") return null;
    return { userId: payload.userId, role: payload.role };
  } catch {
    return null;
  }
}

export async function verifySession(): Promise<boolean> {
  return (await getSessionUser()) !== null;
}

// Admin-only pages (everything except the dialer) — unchanged behavior for
// the ~30 existing call sites: must be logged in as role "admin".
export async function requireAdmin(): Promise<SessionPayload> {
  const session = await getSessionUser();
  if (!session || session.role !== "admin") redirect("/admin/login");
  return session;
}

// Any logged-in caller or admin — used by the dialer, which VAs need access
// to without seeing the rest of the admin app.
export async function requireUser(): Promise<SessionPayload> {
  const session = await getSessionUser();
  if (!session) redirect("/admin/login");
  return session;
}
