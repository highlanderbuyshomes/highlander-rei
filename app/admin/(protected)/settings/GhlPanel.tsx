export default function GhlPanel({ configured }: { configured: boolean }) {
  return (
    <div style={{ background: "#ffffff", border: "1px solid #e1e7ec", borderRadius: "14px", padding: "28px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
        <div style={{ fontSize: "14px", fontWeight: 600, color: "#12161c" }}>GoHighLevel</div>
        <span style={{
          fontSize: "11px", fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase", padding: "4px 10px", borderRadius: "999px",
          color: configured ? "#3a7a50" : "#946200", background: configured ? "#eaf6f0" : "#fff7e6",
        }}>
          {configured ? "Connected" : "Not connected"}
        </span>
      </div>
      <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "16px" }}>
        Powers the &ldquo;Push to GHL&rdquo; button on Offers — sends each property and its owner to GHL as a contact tagged <code>acquisition-lead</code>.
      </div>
      {configured ? (
        <div style={{ fontSize: "11px", color: "#64748b", lineHeight: 1.6 }}>
          Uses <code>GHL_WEBHOOK_URL</code> set as an environment variable — not entered here.
        </div>
      ) : (
        <div style={{ fontSize: "11px", color: "#946200", lineHeight: 1.6, background: "#fff7e6", border: "1px solid #ead18a", borderRadius: "8px", padding: "12px 14px" }}>
          Not configured yet. In GHL, create a workflow with an <strong>Inbound Webhook</strong> trigger, copy its URL, and add it as <code>GHL_WEBHOOK_URL</code> in Vercel environment variables, then redeploy. Until then, Push to GHL will fail.
        </div>
      )}
    </div>
  );
}
