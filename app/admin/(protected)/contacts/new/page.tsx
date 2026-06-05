import Link from "next/link";
import { requireAdmin } from "@/lib/session";
import { createContact } from "../actions";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "New Contact | Highlander REI" };

const inp: React.CSSProperties = { width: "100%", padding: "10px 12px", fontSize: "13px", color: "#111110", background: "#ffffff", border: "1px solid #d0cfc8", borderRadius: "6px", outline: "none", fontFamily: "inherit" };
const lbl: React.CSSProperties = { fontSize: "11px", color: "#5a5a54", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "5px", display: "block", fontWeight: 500 };

export default async function NewContactPage() {
  await requireAdmin();
  return (
    <div style={{ maxWidth: "560px" }}>
      <div style={{ marginBottom: "20px" }}>
        <Link href="/admin/contacts" style={{ fontSize: "12px", color: "#8a8a84", textDecoration: "none" }}>← Contacts</Link>
      </div>
      <div style={{ fontFamily: "var(--font-display), serif", fontSize: "36px", color: "#111110", letterSpacing: "2px", marginBottom: "28px" }}>NEW CONTACT</div>

      <form action={createContact}>
        <div style={{ background: "#ffffff", border: "1px solid #e8e7e2", borderRadius: "14px", padding: "28px", display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            <div>
              <label style={lbl}>Full Name *</label>
              <input name="name" required placeholder="John Smith" style={inp} />
            </div>
            <div>
              <label style={lbl}>Email *</label>
              <input name="email" type="email" required placeholder="john@example.com" style={inp} />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            <div>
              <label style={lbl}>Phone</label>
              <input name="phone" type="tel" placeholder="(480) 555-0100" style={inp} />
            </div>
            <div>
              <label style={lbl}>Company / LLC</label>
              <input name="company" placeholder="ABC Holdings LLC" style={inp} />
            </div>
          </div>
          <div>
            <label style={lbl}>Notes (internal)</label>
            <textarea name="notes" rows={2} placeholder="Any notes…" style={{ ...inp, resize: "vertical" }} />
          </div>
          <div style={{ display: "flex", gap: "10px", paddingTop: "4px", borderTop: "1px solid #e8e7e2" }}>
            <button type="submit" style={{ padding: "10px 24px", background: "#111110", color: "#fff", border: "none", borderRadius: "6px", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
              Save Contact
            </button>
            <Link href="/admin/contacts" style={{ padding: "10px 18px", border: "1px solid #d0cfc8", borderRadius: "6px", fontSize: "13px", color: "#5a5a54", textDecoration: "none", display: "flex", alignItems: "center" }}>
              Cancel
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}
