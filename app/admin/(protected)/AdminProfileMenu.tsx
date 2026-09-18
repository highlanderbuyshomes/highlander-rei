"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";

export default function AdminProfileMenu({ logoutAction }: { logoutAction: () => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          width: 34, height: 34, borderRadius: "50%",
          background: "#12161c", border: "2px solid #cdd6dd",
          color: "#fff", fontSize: "12px", fontWeight: 700, letterSpacing: "0.5px",
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "inherit", boxShadow: "0 1px 2px rgba(15,23,32,.08), 0 4px 10px -5px rgba(15,23,32,.35)",
        }}
        aria-label="Admin menu"
      >
        HLR
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 8px)", right: 0,
          background: "#ffffff", border: "1px solid #e1e7ec",
          borderRadius: "10px", padding: "6px", minWidth: "180px",
          boxShadow: "0 1px 2px rgba(15,23,32,.04), 0 16px 36px -12px rgba(15,23,32,.28)", zIndex: 100,
        }}>
          <div style={{ padding: "8px 12px 10px", borderBottom: "1px solid #e1e7ec", marginBottom: "4px" }}>
            <div style={{ fontSize: "11px", color: "#64748b", letterSpacing: "0.5px" }}>Signed in as</div>
            <div style={{ fontSize: "12.5px", color: "#12161c", fontWeight: 500, marginTop: "2px" }}>Admin</div>
          </div>

          <Link
            href="/admin/contacts"
            onClick={() => setOpen(false)}
            style={{ display: "block", padding: "8px 12px", fontSize: "13px", color: "#475569", textDecoration: "none", borderRadius: "6px" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#eef2f6")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            Contacts
          </Link>

          <Link
            href="/admin/leads"
            onClick={() => setOpen(false)}
            style={{ display: "block", padding: "8px 12px", fontSize: "13px", color: "#475569", textDecoration: "none", borderRadius: "6px" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#eef2f6")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            Leads
          </Link>

          <div style={{ height: "1px", background: "#e1e7ec", margin: "4px 12px" }} />

          <form action={logoutAction}>
            <button type="submit" style={{
              display: "block", width: "100%", textAlign: "left",
              padding: "8px 12px", fontSize: "13px", color: "#475569",
              background: "transparent", border: "none", borderRadius: "6px",
              cursor: "pointer", fontFamily: "inherit",
            }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#eef2f6")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              Sign Out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
