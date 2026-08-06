import { requireAdmin } from "@/lib/session";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "CRM | Highlander REI" };

export default async function CrmPage() {
  await requireAdmin();

  return (
    <div style={{ maxWidth: "1100px", padding: "32px" }}>
      <div style={{ fontFamily: "var(--font-display), serif", fontSize: "36px", color: "#111110", letterSpacing: "2px", lineHeight: 1, marginBottom: "24px" }}>CRM</div>
      <div style={{ background: "#ffffff", border: "1px solid #e8e7e2", borderRadius: "14px", padding: "48px 40px", textAlign: "center" }}>
        <div style={{ fontFamily: "var(--font-display), serif", fontSize: "20px", color: "#111110", letterSpacing: "1.5px", marginBottom: "8px" }}>COMING SOON</div>
        <div style={{ fontSize: "13px", color: "#8a8a84", maxWidth: "360px", margin: "0 auto", lineHeight: 1.7 }}>
          On-market prospecting and offer follow-up will live here — deals you&apos;re hunting, and deals with offers out that need a follow-up.
        </div>
      </div>
    </div>
  );
}
