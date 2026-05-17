"use client";
import { useLanguage } from "@/lib/LanguageContext";

export default function LangToggle() {
  const { lang, setLang } = useLanguage();

  return (
    <div style={{ display: "flex", alignItems: "center", background: "var(--off-white)", border: "1px solid var(--border-light)", borderRadius: "8px", padding: "3px", gap: "2px" }}>
      {(["en", "es"] as const).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          style={{
            padding: "5px 13px",
            fontSize: "11.5px",
            fontWeight: 600,
            borderRadius: "6px",
            border: "none",
            cursor: "pointer",
            background: lang === l ? "var(--black)" : "transparent",
            color: lang === l ? "var(--white)" : "var(--mid)",
            transition: "background 0.15s, color 0.15s",
            fontFamily: "inherit",
            letterSpacing: "0.8px",
            textTransform: "uppercase",
          }}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
