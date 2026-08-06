import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";
import { createArea, toggleArea, deleteArea } from "./actions";

export const metadata: Metadata = { title: "Search | Highlander REI" };

function ToggleButton({ id, active, action }: { id: string; active: boolean; action: (id: string) => Promise<void> }) {
  const toggleWithId = action.bind(null, id);
  return (
    <form action={toggleWithId} style={{ display: "inline" }}>
      <button type="submit" style={{
        padding: "3px 10px", borderRadius: "20px", fontSize: "10.5px", fontWeight: 600,
        letterSpacing: "0.4px", border: "1px solid",
        background: active ? "#eaf6f0" : "#f0efeb",
        color: active ? "#3a7a50" : "#8a8a84",
        borderColor: active ? "#b8dfc8" : "#d0cfc8",
        cursor: "pointer", fontFamily: "inherit",
      }}>
        {active ? "Active" : "Inactive"}
      </button>
    </form>
  );
}

function DeleteButton({ id, action, label }: { id: string; action: (id: string) => Promise<void>; label: string }) {
  const deleteWithId = action.bind(null, id);
  return (
    <form action={deleteWithId} style={{ display: "inline" }}>
      <button type="submit" style={{
        padding: "3px 10px", borderRadius: "20px", fontSize: "10.5px", fontWeight: 600,
        background: "transparent", color: "#c0392b", border: "1px solid rgba(192,57,43,0.2)",
        cursor: "pointer", fontFamily: "inherit",
      }}>
        {label}
      </button>
    </form>
  );
}

export default async function SearchPage() {
  await requireAdmin();

  const searches = await prisma.acquisitionArea.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { buyBoxes: true } } },
  });

  return (
    <div style={{ maxWidth: "1100px", padding: "32px" }}>
      <div style={{ marginBottom: "24px" }}>
        <div style={{ fontFamily: "var(--font-display), serif", fontSize: "36px", color: "#111110", letterSpacing: "2px", lineHeight: 1 }}>SEARCH</div>
        <div style={{ fontSize: "12px", color: "#8a8a84", marginTop: "4px" }}>Buyer search criteria &amp; matching</div>
      </div>

      <div style={{ background: "#ffffff", border: "1px solid #e8e7e2", borderRadius: "14px", padding: "24px", marginBottom: "20px" }}>
        <div style={{ fontSize: "14px", fontWeight: 600, color: "#111110", marginBottom: "16px" }}>New Buyer Search</div>
        <form action={createArea}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
            <div>
              <span style={{ display: "block", fontSize: "10px", fontWeight: 700, color: "#8a8a84", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>Search Name</span>
              <input name="name" required placeholder="e.g. Smith Family — Arcadia SFR" style={{ width: "100%", padding: "9px 12px", fontSize: "13px", border: "1px solid #d0cfc8", borderRadius: "6px", background: "#ffffff", color: "#111110", fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
            </div>
            <div>
              <span style={{ display: "block", fontSize: "10px", fontWeight: 700, color: "#8a8a84", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>Buyer Contact</span>
              <input name="buyerContact" placeholder="e.g. John Smith" style={{ width: "100%", padding: "9px 12px", fontSize: "13px", border: "1px solid #d0cfc8", borderRadius: "6px", background: "#ffffff", color: "#111110", fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
            </div>
          </div>
          <div style={{ marginBottom: "12px" }}>
            <span style={{ display: "block", fontSize: "10px", fontWeight: 700, color: "#8a8a84", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>Description</span>
            <textarea name="description" rows={3} placeholder="What is this buyer looking for? e.g. First-time investor looking for a 3+ bed SFR in Arcadia under $700K, fixer-upper or tired landlord with high equity..." style={{ width: "100%", padding: "9px 12px", fontSize: "13px", border: "1px solid #d0cfc8", borderRadius: "6px", background: "#ffffff", color: "#111110", fontFamily: "inherit", outline: "none", boxSizing: "border-box", resize: "vertical" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button type="submit" style={{ padding: "10px 24px", background: "#111110", color: "#ffffff", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Create</button>
          </div>
        </form>
      </div>

      {searches.length === 0 ? (
        <div style={{ background: "#ffffff", border: "1px solid #e8e7e2", borderRadius: "14px", padding: "48px 40px", textAlign: "center" }}>
          <div style={{ fontFamily: "var(--font-display), serif", fontSize: "20px", color: "#111110", letterSpacing: "1.5px", marginBottom: "8px" }}>NO BUYER SEARCHES</div>
          <div style={{ fontSize: "13px", color: "#8a8a84" }}>Create a search above — name the search, assign the buyer, and describe what they&apos;re looking for.</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {searches.map((s) => (
            <div key={s.id} style={{ background: "#ffffff", border: "1px solid #e8e7e2", borderRadius: "14px", padding: "20px 24px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: s.description ? "8px" : "0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "14px", fontWeight: 600, color: "#111110" }}>{s.name}</span>
                  {s.buyerContact && (
                    <span style={{ fontSize: "10.5px", color: "#1a56db", background: "rgba(26,86,219,0.08)", padding: "2px 8px", borderRadius: "20px", fontWeight: 600 }}>{s.buyerContact}</span>
                  )}
                </div>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <ToggleButton id={s.id} active={s.active} action={toggleArea} />
                  <DeleteButton id={s.id} action={deleteArea} label="Delete" />
                </div>
              </div>
              {s.description && (
                <div style={{ fontSize: "12.5px", color: "#5a5a54", lineHeight: 1.6 }}>{s.description}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
