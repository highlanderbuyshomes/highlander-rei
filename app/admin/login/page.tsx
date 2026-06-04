import { createSession } from "@/lib/session";
import { redirect } from "next/navigation";

async function login(formData: FormData) {
  "use server";
  const password = String(formData.get("password") ?? "");
  if (password === process.env.ADMIN_PASSWORD) {
    await createSession();
    redirect("/admin/agreements");
  }
  redirect("/admin/login?error=1");
}

type Props = { searchParams: Promise<{ error?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams;
  const hasError = !!params.error;

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0f0f0e",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "var(--font-body), system-ui, sans-serif",
    }}>
      <div style={{
        width: "100%",
        maxWidth: "380px",
        padding: "40px",
        background: "#1a1a19",
        borderRadius: "14px",
        border: "1px solid rgba(255,255,255,0.08)",
      }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{
            fontFamily: "var(--font-display), serif",
            fontSize: "24px",
            letterSpacing: "4px",
            color: "#f5f4f0",
            marginBottom: "6px",
          }}>
            HIGHLANDER REI
          </div>
          <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", letterSpacing: "1.5px", textTransform: "uppercase" }}>
            Admin Access
          </div>
        </div>

        {hasError && (
          <div style={{
            background: "rgba(220,50,50,0.12)",
            border: "1px solid rgba(220,50,50,0.3)",
            borderRadius: "8px",
            padding: "10px 14px",
            fontSize: "13px",
            color: "#f87171",
            marginBottom: "16px",
            textAlign: "center",
          }}>
            Incorrect password
          </div>
        )}

        <form action={login} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div>
            <label style={{ display: "block", fontSize: "11px", letterSpacing: "1px", color: "rgba(255,255,255,0.45)", textTransform: "uppercase", marginBottom: "6px" }}>
              Password
            </label>
            <input
              name="password"
              type="password"
              required
              autoFocus
              placeholder="Enter admin password"
              style={{
                width: "100%",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: "8px",
                padding: "11px 14px",
                color: "#f5f4f0",
                fontSize: "14px",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>
          <button type="submit" style={{
            marginTop: "4px",
            background: "#B8962E",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            padding: "12px",
            fontSize: "13px",
            fontWeight: 600,
            letterSpacing: "0.5px",
            cursor: "pointer",
          }}>
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}
