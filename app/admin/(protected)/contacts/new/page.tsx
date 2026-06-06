import Link from "next/link";
import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { createContact, updateContact } from "../actions";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Contact | Highlander REI" };

const inp: React.CSSProperties = { width: "100%", padding: "10px 12px", fontSize: "13px", color: "#111110", background: "#ffffff", border: "1px solid #d0cfc8", borderRadius: "6px", outline: "none", fontFamily: "inherit", boxSizing: "border-box" };
const lbl: React.CSSProperties = { fontSize: "11px", color: "#5a5a54", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "5px", display: "block", fontWeight: 500 };

export default async function NewContactPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  await requireAdmin();
  const { edit: editId } = await searchParams;

  const existing = editId
    ? await prisma.contact.findUnique({ where: { id: editId } })
    : null;

  const action = existing ? updateContact.bind(null, existing.id) : createContact;
  const isEdit = !!existing;

  return (
    <div style={{ maxWidth: "600px", padding: "32px" }}>
      <div style={{ marginBottom: "20px" }}>
        <Link href="/admin/contacts" style={{ fontSize: "12px", color: "#8a8a84", textDecoration: "none" }}>← Contacts</Link>
      </div>
      <div style={{ fontFamily: "var(--font-display), serif", fontSize: "32px", color: "#111110", letterSpacing: "2px", marginBottom: "28px" }}>
        {isEdit ? "EDIT CONTACT" : "NEW CONTACT"}
      </div>

      <form action={action}>
        <div style={{ background: "#ffffff", border: "1px solid #e8e7e2", borderRadius: "14px", padding: "28px", display: "flex", flexDirection: "column", gap: "18px" }}>

          {/* Name row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            <div>
              <label style={lbl}>First Name *</label>
              <input name="firstName" required defaultValue={existing?.firstName ?? ""} placeholder="John" style={inp} />
            </div>
            <div>
              <label style={lbl}>Last Name *</label>
              <input name="lastName" required defaultValue={existing?.lastName ?? ""} placeholder="Smith" style={inp} />
            </div>
          </div>

          {/* Email */}
          <div>
            <label style={lbl}>Email *</label>
            <input
              name="email"
              type="email"
              required
              defaultValue={existing?.email ?? ""}
              placeholder="john@example.com"
              readOnly={isEdit}
              style={{ ...inp, ...(isEdit ? { background: "#f5f4f0", color: "#8a8a84" } : {}) }}
            />
          </div>

          {/* Phone + Company */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            <div>
              <label style={lbl}>Phone</label>
              <input name="phone" type="tel" defaultValue={existing?.phone ?? ""} placeholder="(480) 555-0100" style={inp} />
            </div>
            <div>
              <label style={lbl}>Company / LLC</label>
              <input name="company" defaultValue={existing?.company ?? ""} placeholder="ABC Holdings LLC" style={inp} />
            </div>
          </div>

          {/* Contact Type */}
          <div>
            <label style={lbl}>Contact Type *</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              {[
                { value: "seller", label: "Seller", desc: "Property owner selling to Highlander", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
                { value: "buyer",  label: "Buyer",  desc: "Purchasing from Highlander REI",       icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 001.99 1.61h9.72a2 2 0 001.99-1.61L23 6H6"/></svg> },
              ].map(({ value, label, desc, icon }) => {
                const selected = (existing?.contactType ?? "") === value;
                return (
                  <label key={value} style={{ display: "flex", alignItems: "flex-start", gap: "12px", padding: "14px 16px", border: `1px solid ${selected ? "#B8962E" : "#d0cfc8"}`, borderRadius: "8px", cursor: "pointer", background: selected ? "#FAF6EC" : "#ffffff" }}>
                    <input type="radio" name="contactType" value={value} defaultChecked={selected} style={{ marginTop: "2px", accentColor: "#B8962E" }} />
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px" }}>
                        <span style={{ color: selected ? "#B8962E" : "#5a5a54" }}>{icon}</span>
                        <span style={{ fontSize: "13px", fontWeight: 600, color: "#111110" }}>{label}</span>
                      </div>
                      <div style={{ fontSize: "11px", color: "#8a8a84", lineHeight: 1.4 }}>{desc}</div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label style={lbl}>Notes (internal)</label>
            <textarea name="notes" rows={2} defaultValue={existing?.notes ?? ""} placeholder="Any notes…" style={{ ...inp, resize: "vertical" }} />
          </div>

          <div style={{ display: "flex", gap: "10px", paddingTop: "4px", borderTop: "1px solid #e8e7e2" }}>
            <button type="submit" style={{ padding: "10px 24px", background: "#B8962E", color: "#fff", border: "none", borderRadius: "6px", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
              {isEdit ? "Save Changes" : "Add Contact"}
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
