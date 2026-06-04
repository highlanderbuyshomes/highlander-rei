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
          background: "#B8962E", border: "2px solid rgba(184,150,46,0.4)",
          color: "#fff", fontSize: "12px", fontWeight: 700, letterSpacing: "0.5px",
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "inherit",
        }}
        aria-label="Admin menu"
      >
        HLR
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 8px)", right: 0,
          background: "#1a1a19", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "10px", padding: "6px", minWidth: "180px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.5)", zIndex: 100,
        }}>
          <div style={{ padding: "8px 12px 10px", borderBottom: "1px solid rgba(255,255,255,0.08)", marginBottom: "4px" }}>
            <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)", letterSpacing: "0.5px" }}>Signed in as</div>
            <div style={{ fontSize: "12.5px", color: "rgba(255,255,255,0.8)", fontWeight: 500, marginTop: "2px" }}>Admin</div>
          </div>

          <Link
            href="/admin/password"
            onClick={() => setOpen(false)}
            style={{ display: "block", padding: "8px 12px", fontSize: "13px", color: "rgba(255,255,255,0.7)", textDecoration: "none", borderRadius: "6px" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.07)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            Change Password
          </Link>

          <form action={logoutAction}>
            <button type="submit" style={{
              display: "block", width: "100%", textAlign: "left",
              padding: "8px 12px", fontSize: "13px", color: "rgba(255,255,255,0.7)",
              background: "transparent", border: "none", borderRadius: "6px",
              cursor: "pointer", fontFamily: "inherit",
            }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.07)")}
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
