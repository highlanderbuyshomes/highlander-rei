import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { redirect } from "next/navigation";
import Link from "next/link";

async function changePassword(formData: FormData) {
  "use server";
  await requireAdmin();

  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (!current || !next || next !== confirm) redirect("/admin/password?error=mismatch");
  if (next.length < 8) redirect("/admin/password?error=short");

  // verify current password
  const config = await prisma.adminConfig.findUnique({ where: { id: "singleton" } });
  const currentHash = config?.passwordHash;

  const validCurrent = currentHash
    ? hashPassword(current) === currentHash
    : current === (process.env.ADMIN_PASSWORD ?? "highlander2024");

  if (!validCurrent) redirect("/admin/password?error=wrong");

  await prisma.adminConfig.upsert({
    where: { id: "singleton" },
    update: { passwordHash: hashPassword(next) },
    create: { id: "singleton", passwordHash: hashPassword(next) },
  });

  redirect("/admin/password?success=1");
}

type Props = { searchParams: Promise<{ error?: string; success?: string }> };

export default async function PasswordPage({ searchParams }: Props) {
  await requireAdmin();
  const params = await searchParams;

  const errorMsg: Record<string, string> = {
    mismatch: "Passwords do not match.",
    short: "New password must be at least 8 characters.",
    wrong: "Current password is incorrect.",
  };

  return (
    <div style={{ maxWidth: "440px", padding: "32px" }}>
      <div style={{ marginBottom: "20px" }}>
        <Link href="/admin/agreements" style={{ fontSize: "12px", color: "#8a8a84", textDecoration: "none" }}>← Back</Link>
      </div>
      <div style={{ fontFamily: "var(--font-display), serif", fontSize: "30px", color: "#111110", letterSpacing: "2px", marginBottom: "28px" }}>CHANGE PASSWORD</div>

      {params.success && (
        <div style={{ background: "#eaf6f0", border: "1px solid #b8dfc8", borderRadius: "8px", padding: "12px 16px", fontSize: "13px", color: "#3a7a50", marginBottom: "20px" }}>
          Password updated successfully.
        </div>
      )}

      {params.error && (
        <div style={{ background: "rgba(192,57,43,0.07)", border: "1px solid rgba(192,57,43,0.25)", borderRadius: "8px", padding: "12px 16px", fontSize: "13px", color: "#c0392b", marginBottom: "20px" }}>
          {errorMsg[params.error] ?? "Something went wrong."}
        </div>
      )}

      <form action={changePassword}>
        <div style={{ background: "#ffffff", border: "1px solid #e8e7e2", borderRadius: "14px", padding: "28px", display: "flex", flexDirection: "column", gap: "16px" }}>
          {[
            { name: "current", label: "Current Password" },
            { name: "next", label: "New Password" },
            { name: "confirm", label: "Confirm New Password" },
          ].map(({ name, label }) => (
            <div key={name}>
              <label style={{ fontSize: "11px", color: "#5a5a54", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "5px", display: "block", fontWeight: 500 }}>{label}</label>
              <input name={name} type="password" required style={{ width: "100%", padding: "10px 12px", fontSize: "13px", color: "#111110", background: "#ffffff", border: "1px solid #d0cfc8", borderRadius: "6px", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
            </div>
          ))}
          <button type="submit" style={{ marginTop: "4px", padding: "11px", background: "#111110", color: "#ffffff", border: "none", borderRadius: "6px", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
            Update Password
          </button>
        </div>
      </form>
    </div>
  );
}
