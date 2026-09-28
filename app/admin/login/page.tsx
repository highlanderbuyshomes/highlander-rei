import { createSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { redirect } from "next/navigation";

async function login(formData: FormData) {
  "use server";
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  let user;
  try {
    user = await prisma.adminUser.findUnique({ where: { email } });
  } catch (err) {
    // A database outage must not read as "wrong password".
    console.error("[login] database error:", err);
    redirect("/admin/login?error=server");
  }
  const valid = Boolean(user && hashPassword(password) === user.passwordHash);

  if (valid && user) {
    await createSession(user.id, user.role);
    redirect(user.role === "admin" ? "/admin/search" : "/admin/dialer");
  }
  redirect("/admin/login?error=1");
}

const ERRORS: Record<string, string> = {
  "1": "Incorrect email or password",
  server: "Can't reach the database right now. This isn't your password. Try again in a minute.",
  "google-denied": "That Google account isn't allowed. Sign in with acquisitions@highlanderrei.com.",
  "google-failed": "Google sign-in didn't complete. Try again.",
  "google-setup": "Google sign-in isn't set up yet. Use email and password below.",
};

type Props = { searchParams: Promise<{ error?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams;

  return (
    <div style={{ minHeight: "100vh", background: "#f8f7f4", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-body), system-ui, sans-serif" }}>
      <div style={{ width: "100%", maxWidth: "380px", padding: "40px", background: "#ffffff", borderRadius: "14px", border: "1px solid #e8e7e2", boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{ fontFamily: "var(--font-display), serif", fontSize: "24px", letterSpacing: "4px", color: "#111110", marginBottom: "6px" }}>
            HIGHLANDER REI
          </div>
          <div style={{ fontSize: "12px", color: "#8a8a84", letterSpacing: "1.5px", textTransform: "uppercase" }}>Admin Access</div>
        </div>

        {params.error && (
          <div style={{ background: "rgba(220,50,50,0.06)", border: "1px solid rgba(220,50,50,0.2)", borderRadius: "8px", padding: "10px 14px", fontSize: "13px", color: "#dc3232", marginBottom: "16px", textAlign: "center" }}>
            {ERRORS[params.error] ?? ERRORS["1"]}
          </div>
        )}

        <a href="/api/auth/google" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", background: "#111110", color: "#fff", borderRadius: "8px", padding: "13px", fontSize: "14px", fontWeight: 600, textDecoration: "none" }}>
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>
          Sign in with Google
        </a>

        <details style={{ marginTop: "20px" }}>
          <summary style={{ cursor: "pointer", fontSize: "12px", color: "#8a8a84", textAlign: "center", listStyle: "none" }}>Use email and password instead</summary>
          <div style={{ marginTop: "16px" }}>

        <form action={login} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div>
            <label style={{ display: "block", fontSize: "11px", letterSpacing: "1px", color: "#8a8a84", textTransform: "uppercase", marginBottom: "6px" }}>Email</label>
            <input name="email" type="email" required placeholder="you@highlanderrei.com" style={{ width: "100%", background: "#ffffff", border: "1px solid #d0cfc8", borderRadius: "8px", padding: "11px 14px", color: "#111110", fontSize: "14px", outline: "none", boxSizing: "border-box" }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "11px", letterSpacing: "1px", color: "#8a8a84", textTransform: "uppercase", marginBottom: "6px" }}>Password</label>
            <input name="password" type="password" required placeholder="Enter password" style={{ width: "100%", background: "#ffffff", border: "1px solid #d0cfc8", borderRadius: "8px", padding: "11px 14px", color: "#111110", fontSize: "14px", outline: "none", boxSizing: "border-box" }} />
          </div>
          <button type="submit" style={{ marginTop: "4px", background: "#111110", color: "#fff", border: "none", borderRadius: "8px", padding: "12px", fontSize: "13px", fontWeight: 600, letterSpacing: "0.5px", cursor: "pointer" }}>
            Sign In
          </button>
        </form>
          </div>
        </details>
      </div>
    </div>
  );
}
