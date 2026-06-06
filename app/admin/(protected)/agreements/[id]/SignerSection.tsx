"use client";

import { useState, useRef } from "react";

type Signer = {
  id: string;
  name: string;
  email: string;
  order: number;
  emailedAt: Date | null;
  signedAt: Date | null;
  token: string;
};

type Contact = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
};

type Props = {
  agreementId: string;
  signers: Signer[];
  contacts: Contact[];
  addSignerAction:  (formData: FormData) => Promise<void>;
  removeSignerAction: (id: string) => Promise<void>;
  sendLinksAction: () => Promise<{ ok: boolean; error?: string; sent?: number }>;
  baseUrl: string;
  emailEnabled: boolean;
  readyToSend?: boolean;
};

const SIGNER_COLORS = ["#1a56db", "#c0392b", "#6b46c1", "#3a7a50", "#B8962E"];

export default function SignerSection({
  signers, contacts, addSignerAction, removeSignerAction, sendLinksAction, baseUrl, emailEnabled, readyToSend = false,
}: Props) {
  const [adding, setAdding] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Contact | null>(null);
  const [customName, setCustomName] = useState("");
  const [customEmail, setCustomEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sendMessage, setSendMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const filtered = search.length > 0
    ? contacts.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.email.toLowerCase().includes(search.toLowerCase())
      ).slice(0, 6)
    : [];

  function selectContact(c: Contact) {
    setSelected(c);
    setCustomName(c.name);
    setCustomEmail(c.email);
    setSearch("");
  }

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    if (selected) fd.set("contactId", selected.id);
    setAdding(false);
    setSelected(null);
    setCustomName("");
    setCustomEmail("");
    await addSignerAction(fd);
  }

  async function handleSend() {
    if (!confirm("Email signing links to all unsent signers and mark agreement as Pending?")) return;
    setSending(true);
    setSendMessage(null);
    try {
      const result = await sendLinksAction();
      setSendMessage(result.ok
        ? { type: "success", text: `${result.sent ?? 0} signing link${result.sent === 1 ? "" : "s"} sent.` }
        : { type: "error", text: result.error ?? "Signing links could not be sent." });
    } catch {
      setSendMessage({ type: "error", text: "Signing links could not be sent. Please try again." });
    } finally {
      setSending(false);
    }
  }

  async function copy(text: string, id: string) {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  const allSigned = signers.length > 0 && signers.every(s => s.signedAt);
  const anyUnsent = signers.some(s => !s.emailedAt);

  return (
    <div style={{ background: "#ffffff", border: "1px solid #e8e7e2", borderRadius: "14px", padding: "20px 24px", marginBottom: "16px" }}>
      {readyToSend && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", flexWrap: "wrap", background: "#faf6ec", border: "1px solid #e8d9a0", borderRadius: "8px", padding: "14px 16px", marginBottom: "18px" }}>
          <div>
            <div style={{ fontSize: "12.5px", fontWeight: 700, color: "#111110", marginBottom: "3px" }}>Ready for your review</div>
            <div style={{ fontSize: "11.5px", color: "#5a5a54", lineHeight: 1.5 }}>
              {emailEnabled
                ? "Review the PDF and signer emails, then send the signing links."
                : "Review the PDF and signer emails. Email delivery must be configured before sending."}
            </div>
          </div>
          <button onClick={handleSend} disabled={sending || !emailEnabled || signers.length === 0} title={!emailEnabled ? "Configure RESEND_API_KEY to enable email delivery" : undefined} style={{ padding: "9px 18px", background: sending || !emailEnabled || signers.length === 0 ? "#d0cfc8" : "#B8962E", color: "#fff", border: "none", borderRadius: "6px", fontSize: "12.5px", fontWeight: 700, cursor: sending || !emailEnabled || signers.length === 0 ? "default" : "pointer", fontFamily: "inherit" }}>
            {sending ? "Sending…" : "Send for Signature"}
          </button>
        </div>
      )}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
        <div style={{ fontSize: "10px", color: "#8a8a84", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600 }}>
          Signers {signers.length > 0 && `(${signers.length})`}
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          {signers.length > 0 && anyUnsent && !allSigned && (
            <button onClick={handleSend} disabled={sending || !emailEnabled} title={!emailEnabled ? "Configure RESEND_API_KEY to enable email delivery" : undefined} style={{ padding: "6px 14px", background: sending || !emailEnabled ? "#d0cfc8" : "#111110", color: "#fff", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: 600, cursor: sending || !emailEnabled ? "default" : "pointer", fontFamily: "inherit" }}>
              {sending ? "Sending…" : "Send Links"}
            </button>
          )}
          {!adding && (
            <button onClick={() => setAdding(true)} style={{ padding: "6px 14px", background: "transparent", color: "#111110", border: "1px solid #d0cfc8", borderRadius: "6px", fontSize: "12px", cursor: "pointer", fontFamily: "inherit" }}>
              + Add Signer
            </button>
          )}
        </div>
      </div>

      {/* Signer list */}
      {signers.length === 0 && !adding && (
        <div style={{ fontSize: "13px", color: "#8a8a84", textAlign: "center", padding: "16px 0" }}>
          No signers added yet. Add signers from your contact bank.
        </div>
      )}

      {signers.map((s, i) => {
        const color = SIGNER_COLORS[i % SIGNER_COLORS.length];
        const signingUrl = `${baseUrl}/sign/${s.token}`;
        const removeWithId = removeSignerAction.bind(null, s.id);
        return (
          <div key={s.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 0", borderBottom: "1px solid #f0efeb" }}>
            <div style={{ width: 30, height: 30, borderRadius: "50%", background: `${color}18`, border: `2px solid ${color}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ fontSize: "11px", fontWeight: 700, color }}>{i + 1}</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "13px", color: "#111110", fontWeight: 500 }}>{s.name}</div>
              <div style={{ fontSize: "11.5px", color: "#8a8a84" }}>{s.email}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
              {s.signedAt ? (
                <span style={{ fontSize: "11px", background: "#eaf6f0", color: "#3a7a50", border: "1px solid #b8dfc8", borderRadius: "20px", padding: "2px 8px", fontWeight: 600 }}>
                  Signed
                </span>
              ) : s.emailedAt ? (
                <span style={{ fontSize: "11px", background: "rgba(26,86,219,0.08)", color: "#1a56db", border: "1px solid rgba(26,86,219,0.25)", borderRadius: "20px", padding: "2px 8px", fontWeight: 600 }}>
                  Sent
                </span>
              ) : (
                <span style={{ fontSize: "11px", background: "#f0efeb", color: "#5a5a54", border: "1px solid #d0cfc8", borderRadius: "20px", padding: "2px 8px", fontWeight: 600 }}>
                  Draft
                </span>
              )}
              <button
                onClick={() => copy(signingUrl, s.id)}
                title="Copy signing link"
                style={{ fontSize: "11px", padding: "4px 10px", background: copied === s.id ? "#eaf6f0" : "transparent", color: copied === s.id ? "#3a7a50" : "#5a5a54", border: "1px solid #d0cfc8", borderRadius: "5px", cursor: "pointer", fontFamily: "inherit" }}
              >
                {copied === s.id ? "Copied!" : "Copy Link"}
              </button>
              {!s.signedAt && (
                <form action={removeWithId}>
                  <button type="submit" style={{ fontSize: "11px", color: "#c0392b", background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
                    Remove
                  </button>
                </form>
              )}
            </div>
          </div>
        );
      })}

      {/* Add signer form */}
      {adding && (
        <div style={{ marginTop: "12px", padding: "16px", background: "#fafaf8", borderRadius: "8px", border: "1px solid #e8e7e2" }}>
          <div style={{ fontSize: "11px", color: "#5a5a54", fontWeight: 600, letterSpacing: "0.5px", marginBottom: "12px", textTransform: "uppercase" }}>Add Signer</div>

          {/* Contact search */}
          <div style={{ position: "relative", marginBottom: "10px" }}>
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setSelected(null); }}
              placeholder="Search contacts by name or email…"
              style={{ width: "100%", padding: "9px 12px", fontSize: "13px", border: "1px solid #d0cfc8", borderRadius: "6px", background: "#fff", color: "#111110", fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
            />
            {filtered.length > 0 && (
              <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: "1px solid #d0cfc8", borderTop: "none", borderRadius: "0 0 6px 6px", zIndex: 20, maxHeight: "180px", overflowY: "auto" }}>
                {filtered.map(c => (
                  <button key={c.id} type="button" onClick={() => selectContact(c)} style={{ display: "block", width: "100%", textAlign: "left", padding: "10px 12px", background: "transparent", border: "none", borderBottom: "1px solid #f0efeb", cursor: "pointer", fontFamily: "inherit" }}>
                    <div style={{ fontSize: "13px", color: "#111110", fontWeight: 500 }}>{c.name}</div>
                    <div style={{ fontSize: "11px", color: "#8a8a84" }}>{c.email}{c.company ? ` · ${c.company}` : ""}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <form ref={formRef} onSubmit={handleAdd} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {selected && (
              <div style={{ fontSize: "12px", color: "#3a7a50", background: "#eaf6f0", border: "1px solid #b8dfc8", borderRadius: "5px", padding: "6px 10px" }}>
                Contact: {selected.name} — {selected.email}
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              <input name="name" required value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder="Full name *" style={{ padding: "9px 12px", fontSize: "13px", border: "1px solid #d0cfc8", borderRadius: "6px", background: "#fff", color: "#111110", fontFamily: "inherit", outline: "none" }} />
              <input name="email" type="email" required value={customEmail} onChange={(e) => setCustomEmail(e.target.value)} placeholder="Email *" style={{ padding: "9px 12px", fontSize: "13px", border: "1px solid #d0cfc8", borderRadius: "6px", background: "#fff", color: "#111110", fontFamily: "inherit", outline: "none" }} />
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button type="submit" style={{ padding: "8px 18px", background: "#111110", color: "#fff", border: "none", borderRadius: "6px", fontSize: "12.5px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                Add
              </button>
              <button type="button" onClick={() => { setAdding(false); setSelected(null); setCustomName(""); setCustomEmail(""); setSearch(""); }} style={{ padding: "8px 14px", background: "transparent", color: "#5a5a54", border: "1px solid #d0cfc8", borderRadius: "6px", fontSize: "12.5px", cursor: "pointer", fontFamily: "inherit" }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {allSigned && (
        <div style={{ marginTop: "12px", display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#3a7a50", background: "#eaf6f0", border: "1px solid #b8dfc8", borderRadius: "6px", padding: "10px 14px" }}>
          <span>✓</span> All signers have completed. Agreement is fully executed.
        </div>
      )}

      {sendMessage && (
        <div style={{ marginTop: "10px", fontSize: "11.5px", color: sendMessage.type === "success" ? "#3a7a50" : "#c0392b", background: sendMessage.type === "success" ? "#eaf6f0" : "rgba(192,57,43,0.06)", border: `1px solid ${sendMessage.type === "success" ? "#b8dfc8" : "rgba(192,57,43,0.2)"}`, borderRadius: "6px", padding: "8px 12px" }}>
          {sendMessage.text}
        </div>
      )}

      {signers.length > 0 && !emailEnabled && (
        <div style={{ marginTop: "10px", fontSize: "11.5px", color: "#8a6a10", background: "rgba(184,150,46,0.08)", border: "1px solid rgba(184,150,46,0.25)", borderRadius: "6px", padding: "8px 12px" }}>
          Note: Set RESEND_API_KEY in Vercel env vars to enable automatic email delivery.
        </div>
      )}
    </div>
  );
}
