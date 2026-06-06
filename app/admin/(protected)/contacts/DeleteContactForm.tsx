"use client";

export default function DeleteContactForm({
  action,
  contactName,
}: {
  action: () => Promise<void>;
  contactName: string;
}) {
  return (
    <form action={action} style={{ display: "inline" }}>
      <button
        type="submit"
        onClick={(event) => {
          if (!confirm(`Delete ${contactName}?`)) event.preventDefault();
        }}
        style={{ fontSize: "12px", color: "#c0392b", background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit", padding: "5px 0" }}
      >
        Delete
      </button>
    </form>
  );
}
