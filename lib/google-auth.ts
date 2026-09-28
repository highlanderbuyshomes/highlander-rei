import { createRemoteJWKSet, jwtVerify } from "jose";

// "Sign in with Google" for the admin app: plain OpenID Connect code flow
// against Google, no auth library. Only emails on the allowlist get in.

const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_JWKS = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));

export const OAUTH_STATE_COOKIE = "hlr_oauth_state";
export const PRIMARY_ADMIN_EMAIL = "acquisitions@highlanderrei.com";

/** Emails allowed to sign in with Google (ADMIN_GOOGLE_EMAILS, comma-separated),
 *  always including the primary login. */
export function allowedGoogleEmails(raw = process.env.ADMIN_GOOGLE_EMAILS): Set<string> {
  const emails = (raw ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
  return new Set([PRIMARY_ADMIN_EMAIL, ...emails]);
}

export function isGoogleAuthConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function googleAuthUrl(state: string, redirectUri: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email",
    state,
    prompt: "select_account",
  });
  return `${AUTH_URL}?${params}`;
}

/** Exchanges the authorization code and returns the verified Google email. */
export async function verifiedEmailFromCode(code: string, redirectUri: string): Promise<string> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Google token exchange failed: ${res.status}`);
  const { id_token } = (await res.json()) as { id_token?: string };
  if (!id_token) throw new Error("Google returned no id_token");

  const { payload } = await jwtVerify(id_token, GOOGLE_JWKS, {
    issuer: ["https://accounts.google.com", "accounts.google.com"],
    audience: process.env.GOOGLE_CLIENT_ID!,
  });
  if (payload.email_verified !== true || typeof payload.email !== "string") {
    throw new Error("Google account email is not verified");
  }
  return payload.email.toLowerCase();
}
