import { requireAdmin } from "@/lib/session";
import type { Metadata } from "next";
import Link from "next/link";
import { changePassword } from "./actions";
import IHomeFinderSyncPanel from "./IHomeFinderSyncPanel";

export const metadata: Metadata = { title: "Settings | Highlander REI" };

type Tab = "password" | "connections" | "billing";

const TABS: { key: Tab; label: string }[] = [
  { key: "password", label: "Password" },
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
  const activeTab = (["password", "connections", "billing"].includes(params.tab ?? "") ? params.tab : "password") as Tab;

  const errorMsg: Record<string, string> = {
    mismatch: "Passwords do not match.",
    short: "New password must be at least 8 characters.",
    wrong: "Current password is incorrect.",
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
