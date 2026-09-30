"use client";

import { useFormStatus } from "react-dom";

/** The run takes ~40 s; show it's working. */
export default function RunButton() {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={pending} style={{ padding: "8px 16px", background: pending ? "#94a3b8" : "#12161c", color: "#ffffff", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: 600, cursor: pending ? "wait" : "pointer", fontFamily: "inherit" }}>
    {pending ? "Running…" : "Run now"}
  </button>;
}
