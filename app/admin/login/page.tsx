import { createSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { redirect } from "next/navigation";

async function login(formData: FormData) {
  "use server";
  const password = String(formData.get("password") ?? "");

  // Check DB-stored hash first (set via Change Password), fall back to env var
  const config = await prisma.adminConfig.findUnique({ where: { id: "singleton" } }).catch(() => null);
  const storedHash = config?.passwordHash;

  const valid = storedHash
    ? hashPassword(password) === storedHash
    : !!process.env.ADMIN_PASSWORD && password === process.env.ADMIN_PASSWORD;

  if (valid) {
    await createSession();
    redirect("/admin/agreements");
  }
  redirect("/admin/login?error=1");
}

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
            Incorrect password
          </div>
        )}

        <form action={login} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div>
            <label style={{ display: "block", fontSize: "11px", letterSpacing: "1px", color: "#8a8a84", textTransform: "uppercase", marginBottom: "6px" }}>Password</label>
            <input name="password" type="password" required autoFocus placeholder="Enter admin password" style={{ width: "100%", background: "#ffffff", border: "1px solid #d0cfc8", borderRadius: "8px", padding: "11px 14px", color: "#111110", fontSize: "14px", outline: "none", boxSizing: "border-box" }} />
          </div>
          <button type="submit" style={{ marginTop: "4px", background: "#111110", color: "#fff", border: "none", borderRadius: "8px", padding: "12px", fontSize: "13px", fontWeight: 600, letterSpacing: "0.5px", cursor: "pointer" }}>
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}
