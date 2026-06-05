import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import type { Metadata } from "next";
import { deleteContact } from "./actions";

export const metadata: Metadata = { title: "Contacts | Highlander REI" };

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireAdmin();
  const { q } = await searchParams;

  const contacts = await prisma.contact.findMany({
    where: q ? {
      OR: [
        { name:    { contains: q, mode: "insensitive" } },
        { email:   { contains: q, mode: "insensitive" } },
        { company: { contains: q, mode: "insensitive" } },
      ],
    } : undefined,
    orderBy: { name: "asc" },
    include: { _count: { select: { signers: true } } },
  });

  const inp: React.CSSProperties = { padding: "8px 14px", fontSize: "13px", border: "1px solid #d0cfc8", borderRadius: "6px", background: "#ffffff", color: "#111110", fontFamily: "inherit", outline: "none" };

  return (
    <div style={{ maxWidth: "1100px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <div style={{ fontFamily: "var(--font-display), serif", fontSize: "36px", color: "#111110", letterSpacing: "2px", lineHeight: 1 }}>CONTACTS</div>
          <div style={{ fontSize: "12px", color: "#8a8a84", marginTop: "4px" }}>Signer contact bank — add people here to quickly attach them to agreements.</div>
        </div>
        <Link href="/admin/contacts/new" style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "#111110", color: "#fff", padding: "10px 20px", borderRadius: "6px", fontSize: "13px", fontWeight: 600, textDecoration: "none" }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          Add Contact
        </Link>
      </div>

      <form method="GET" style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
        <input name="q" defaultValue={q ?? ""} placeholder="Search name, email, company…" style={{ ...inp, width: "300px" }} />
        <button type="submit" style={{ ...inp, cursor: "pointer", background: "#111110", color: "#fff", border: "1px solid #111110" }}>Search</button>
        {q && <Link href="/admin/contacts" style={{ ...inp, color: "#8a8a84", textDecoration: "none", display: "flex", alignItems: "center" }}>✕ Clear</Link>}
      </form>

      {contacts.length === 0 ? (
        <div style={{ background: "#ffffff", border: "1px solid #e8e7e2", borderRadius: "14px", padding: "60px 40px", textAlign: "center" }}>
          <div style={{ fontSize: "40px", marginBottom: "12px" }}>👤</div>
          <div style={{ fontFamily: "var(--font-display), serif", fontSize: "20px", color: "#111110", letterSpacing: "1.5px", marginBottom: "8px" }}>NO CONTACTS YET</div>
          <div style={{ fontSize: "13px", color: "#8a8a84", marginBottom: "24px" }}>Add contacts to quickly attach signers to agreements.</div>
          <Link href="/admin/contacts/new" style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "#111110", color: "#fff", padding: "10px 20px", borderRadius: "6px", fontSize: "13px", fontWeight: 600, textDecoration: "none" }}>
            + Add Contact
          </Link>
        </div>
      ) : (
        <div style={{ background: "#ffffff", border: "1px solid #e8e7e2", borderRadius: "14px", overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.8fr 1.8fr 1.2fr 1.2fr 60px 100px 80px", padding: "10px 20px", background: "#f5f4f0", borderBottom: "1px solid #e8e7e2" }}>
            {["Name", "Email", "Phone", "Company", "Signings", "", ""].map((h) => (
              <div key={h} style={{ fontSize: "10px", color: "#8a8a84", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600 }}>{h}</div>
            ))}
          </div>
          {contacts.map((c, i) => {
            const deleteWithId = deleteContact.bind(null, c.id);
            return (
              <div key={c.id} style={{ display: "grid", gridTemplateColumns: "1.8fr 1.8fr 1.2fr 1.2fr 60px 100px 80px", padding: "13px 20px", borderBottom: i < contacts.length - 1 ? "1px solid #e8e7e2" : "none", alignItems: "center" }}>
                <div style={{ fontSize: "13px", color: "#111110", fontWeight: 500 }}>{c.name}</div>
                <div><a href={`mailto:${c.email}`} style={{ fontSize: "12.5px", color: "#1a56db", textDecoration: "none" }}>{c.email}</a></div>
                <div style={{ fontSize: "12px", color: "#5a5a54" }}>{c.phone ?? "—"}</div>
                <div style={{ fontSize: "12px", color: "#5a5a54" }}>{c.company ?? "—"}</div>
                <div style={{ fontSize: "12px", color: "#8a8a84" }}>{c._count.signers}</div>
                <div>
                  <Link href={`/admin/contacts/new?edit=${c.id}`} style={{ fontSize: "12px", color: "#111110", textDecoration: "none", padding: "4px 10px", border: "1px solid #d0cfc8", borderRadius: "5px" }}>
                    Edit
                  </Link>
                </div>
                <div>
                  <form action={deleteWithId}>
                    <button type="submit" onClick={(e) => { if (!confirm(`Delete ${c.name}?`)) e.preventDefault(); }} style={{ fontSize: "12px", color: "#c0392b", background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit", padding: "4px 0" }}>
                      Delete
                    </button>
                  </form>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
