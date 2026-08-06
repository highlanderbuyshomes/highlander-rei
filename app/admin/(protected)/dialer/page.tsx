import { requireAdmin } from "@/lib/session";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Dialer | Highlander REI" };

export default async function DialerPage() {
  await requireAdmin();

  return (
    <div style={{ maxWidth: "1100px", padding: "32px" }}>
      <div style={{ fontFamily: "var(--font-display), serif", fontSize: "36px", color: "#111110", letterSpacing: "2px", lineHeight: 1, marginBottom: "24px" }}>DIALER</div>
      <div style={{ background: "#ffffff", border: "1px solid #e8e7e2", borderRadius: "14px", padding: "48px 40px", textAlign: "center" }}>
        <div style={{ fontFamily: "var(--font-display), serif", fontSize: "20px", color: "#111110", letterSpacing: "1.5px", marginBottom: "8px" }}>COMING SOON</div>
        <div style={{ fontSize: "13px", color: "#8a8a84", maxWidth: "360px", margin: "0 auto", lineHeight: 1.7 }}>
          ColdCallDogs.io integration is paused pending a merger decision. This tab is a placeholder until that&apos;s revisited.
        </div>
      </div>
    </div>
  );
}
