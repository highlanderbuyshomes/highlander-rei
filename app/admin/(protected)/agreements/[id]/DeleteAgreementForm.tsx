"use client";

export default function DeleteAgreementForm({ action }: { action: () => Promise<void> }) {
  return (
    <form action={action}>
      <button
        type="submit"
        onClick={(event) => {
          if (!window.confirm("Permanently delete this agreement? This cannot be undone.")) {
            event.preventDefault();
          }
        }}
        style={{
          padding: "8px 16px",
          background: "rgba(192,57,43,0.08)",
          color: "#c0392b",
          border: "1px solid rgba(192,57,43,0.25)",
          borderRadius: "6px",
          fontSize: "12px",
          cursor: "pointer",
          fontFamily: "inherit",
        }}
      >
        Delete Permanently
      </button>
    </form>
  );
}
