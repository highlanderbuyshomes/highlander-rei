import { requireAdmin } from "@/lib/session";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Acquisitions | Highlander REI" };

export default async function AcquisitionsPage() {
  await requireAdmin();

  return (
    <div style={{ maxWidth: "1100px", padding: "32px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <div style={{ fontFamily: "var(--font-display), serif", fontSize: "36px", color: "#111110", letterSpacing: "2px", lineHeight: 1 }}>ACQUISITIONS</div>
          <div style={{ fontSize: "12px", color: "#8a8a84", marginTop: "4px" }}>Property search pipeline &amp; deal matching</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px", marginBottom: "28px" }}>
        <div style={{ background: "#ffffff", border: "1px solid #e8e7e2", borderRadius: "14px", padding: "24px" }}>
          <div style={{ fontSize: "10px", color: "#8a8a84", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600, marginBottom: "8px" }}>Saved Searches</div>
          <div style={{ fontFamily: "var(--font-display), serif", fontSize: "32px", color: "#111110" }}>0</div>
          <div style={{ fontSize: "12px", color: "#8a8a84", marginTop: "4px" }}>JSON criteria files in pipeline</div>
        </div>

        <div style={{ background: "#ffffff", border: "1px solid #e8e7e2", borderRadius: "14px", padding: "24px" }}>
          <div style={{ fontSize: "10px", color: "#8a8a84", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600, marginBottom: "8px" }}>Properties Ingested</div>
          <div style={{ fontFamily: "var(--font-display), serif", fontSize: "32px", color: "#111110" }}>0</div>
          <div style={{ fontSize: "12px", color: "#8a8a84", marginTop: "4px" }}>From Apify scraping runs</div>
        </div>

        <div style={{ background: "#ffffff", border: "1px solid #e8e7e2", borderRadius: "14px", padding: "24px" }}>
          <div style={{ fontSize: "10px", color: "#8a8a84", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600, marginBottom: "8px" }}>Matches</div>
          <div style={{ fontFamily: "var(--font-display), serif", fontSize: "32px", color: "#111110" }}>0</div>
          <div style={{ fontSize: "12px", color: "#8a8a84", marginTop: "4px" }}>Properties scoring above threshold</div>
        </div>
      </div>

      <div style={{ background: "#ffffff", border: "1px solid #e8e7e2", borderRadius: "14px", padding: "48px 40px", textAlign: "center" }}>
        <div style={{ fontSize: "40px", marginBottom: "12px" }}>🏠</div>
        <div style={{ fontFamily: "var(--font-display), serif", fontSize: "20px", color: "#111110", letterSpacing: "1.5px", marginBottom: "8px" }}>PIPELINE NOT CONNECTED</div>
        <div style={{ fontSize: "13px", color: "#8a8a84", maxWidth: "460px", margin: "0 auto", lineHeight: 1.6 }}>
          The acquisition-machine CLI ingests property data via Apify, scores it against your search criteria, and surfaces top matches. Connect the pipeline to see results here.
        </div>
      </div>
    </div>
  );
}
