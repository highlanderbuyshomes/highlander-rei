import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";
import Link from "next/link";
import { addTeamMember, changePassword } from "./actions";
import IHomeFinderSyncPanel from "./IHomeFinderSyncPanel";

export const metadata: Metadata = { title: "Settings | Highlander REI" };

type Tab = "password" | "team" | "connections" | "billing";

const TABS: { key: Tab; label: string }[] = [
  { key: "password", label: "Password" },
  { key: "team", label: "Team" },
  { key: "connections", label: "API Connections" },
  { key: "billing", label: "Billing" },
];

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; error?: string; success?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const activeTab = (["password", "team", "connections", "billing"].includes(params.tab ?? "") ? params.tab : "password") as Tab;
  const team = activeTab === "team" ? await prisma.adminUser.findMany({ orderBy: { createdAt: "asc" } }) : [];

  const errorMsg: Record<string, string> = {
    mismatch: "Passwords do not match.",
    short: "New password must be at least 8 characters.",
    wrong: "Current password is incorrect.",
    invalid: "Name, email, and an 8+ character password are required.",
    exists: "Someone with that email already has an account.",
  };

  return (
    <div style={{ maxWidth: "620px", padding: "32px" }}>
      <div style={{ fontFamily: "var(--font-display), serif", fontSize: "36px", color: "#111110", letterSpacing: "2px", lineHeight: 1, marginBottom: "24px" }}>SETTINGS</div>

      <div style={{ display: "flex", gap: "2px", marginBottom: "24px", borderBottom: "1px solid #e8e7e2" }}>
        {TABS.map(({ key, label }) => (
          <Link key={key} href={`/admin/settings?tab=${key}`} style={{
            fontSize: "12.5px", fontWeight: activeTab === key ? 600 : 400,
            color: activeTab === key ? "#111110" : "#8a8a84",
            textDecoration: "none", padding: "8px 16px 12px",
            borderBottom: activeTab === key ? "2px solid #111110" : "2px solid transparent",
            marginBottom: "-1px", letterSpacing: "0.3px",
          }}>
            {label}
          </Link>
        ))}
      </div>

      {activeTab === "password" && (
        <>
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
        </>
      )}

      {activeTab === "team" && (
        <>
          {params.success && (
            <div style={{ background: "#eaf6f0", border: "1px solid #b8dfc8", borderRadius: "8px", padding: "12px 16px", fontSize: "13px", color: "#3a7a50", marginBottom: "20px" }}>
              Account created.
            </div>
          )}
          {params.error && (
            <div style={{ background: "rgba(192,57,43,0.07)", border: "1px solid rgba(192,57,43,0.25)", borderRadius: "8px", padding: "12px 16px", fontSize: "13px", color: "#c0392b", marginBottom: "20px" }}>
              {errorMsg[params.error] ?? "Something went wrong."}
            </div>
          )}

          <form action={addTeamMember} style={{ marginBottom: "24px" }}>
            <div style={{ background: "#ffffff", border: "1px solid #e8e7e2", borderRadius: "14px", padding: "28px", display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ fontFamily: "var(--font-display), serif", fontSize: "16px", color: "#111110", letterSpacing: "1px" }}>ADD TEAM MEMBER</div>
              <div style={{ fontSize: "13px", color: "#8a8a84", marginTop: "-8px" }}>
                Callers only get access to the Dialer — everything else here stays admin-only.
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label style={{ fontSize: "11px", color: "#5a5a54", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "5px", display: "block", fontWeight: 500 }}>Name</label>
                  <input name="name" type="text" required style={{ width: "100%", padding: "10px 12px", fontSize: "13px", color: "#111110", background: "#ffffff", border: "1px solid #d0cfc8", borderRadius: "6px", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ fontSize: "11px", color: "#5a5a54", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "5px", display: "block", fontWeight: 500 }}>Email</label>
                  <input name="email" type="email" required style={{ width: "100%", padding: "10px 12px", fontSize: "13px", color: "#111110", background: "#ffffff", border: "1px solid #d0cfc8", borderRadius: "6px", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label style={{ fontSize: "11px", color: "#5a5a54", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "5px", display: "block", fontWeight: 500 }}>Temporary Password</label>
                  <input name="password" type="text" required style={{ width: "100%", padding: "10px 12px", fontSize: "13px", color: "#111110", background: "#ffffff", border: "1px solid #d0cfc8", borderRadius: "6px", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ fontSize: "11px", color: "#5a5a54", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "5px", display: "block", fontWeight: 500 }}>Role</label>
                  <select name="role" defaultValue="caller" style={{ width: "100%", padding: "10px 12px", fontSize: "13px", color: "#111110", background: "#ffffff", border: "1px solid #d0cfc8", borderRadius: "6px", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}>
                    <option value="caller">Caller (Dialer only)</option>
                    <option value="admin">Admin (full access)</option>
                  </select>
                </div>
              </div>
              <button type="submit" style={{ marginTop: "4px", padding: "11px", background: "#111110", color: "#ffffff", border: "none", borderRadius: "6px", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                Create Account
              </button>
            </div>
          </form>

          <div style={{ background: "#ffffff", border: "1px solid #e8e7e2", borderRadius: "14px", overflow: "hidden" }}>
            {team.map((member, i) => (
              <div key={member.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderTop: i === 0 ? "none" : "1px solid #eeede8" }}>
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "#111110" }}>{member.name}</div>
                  <div style={{ fontSize: "12px", color: "#8a8a84" }}>{member.email}</div>
                </div>
                <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase", color: member.role === "admin" ? "#111110" : "#8a8a84", background: member.role === "admin" ? "#f0efe9" : "#f7f7f4", padding: "4px 10px", borderRadius: "999px" }}>
                  {member.role}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {activeTab === "connections" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <IHomeFinderSyncPanel />
          <div style={{ background: "#ffffff", border: "1px solid #e8e7e2", borderRadius: "14px", padding: "48px 40px", textAlign: "center" }}>
            <div style={{ fontFamily: "var(--font-display), serif", fontSize: "20px", color: "#111110", letterSpacing: "1.5px", marginBottom: "8px" }}>MORE CONNECTIONS</div>
            <div style={{ fontSize: "13px", color: "#8a8a84" }}>Coming soon — manage GHL and Apify connections here.</div>
          </div>
        </div>
      )}

      {activeTab === "billing" && (
        <div style={{ background: "#ffffff", border: "1px solid #e8e7e2", borderRadius: "14px", padding: "48px 40px", textAlign: "center" }}>
          <div style={{ fontFamily: "var(--font-display), serif", fontSize: "20px", color: "#111110", letterSpacing: "1.5px", marginBottom: "8px" }}>BILLING</div>
          <div style={{ fontSize: "13px", color: "#8a8a84" }}>Coming soon.</div>
        </div>
      )}
    </div>
  );
}
