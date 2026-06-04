"use client";

import { useState } from "react";

export default function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={copy}
      style={{
        padding: "9px 16px", background: copied ? "#3a7a50" : "#111110", color: "#ffffff",
        border: "none", borderRadius: "6px", fontSize: "12.5px", fontWeight: 600,
        cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit", transition: "background 0.2s",
      }}
    >
      {copied ? "Copied!" : "Copy Link"}
    </button>
  );
}
