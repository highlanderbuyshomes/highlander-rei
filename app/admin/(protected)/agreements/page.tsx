import type { Metadata } from "next";
import Link from "next/link";
import AgreementsView from "./AgreementsView";
import TemplatesView from "./TemplatesView";

export const metadata: Metadata = { title: "Agreements | Highlander REI" };

type Params = { tab?: string; folder?: string; q?: string; type?: string; page?: string };

export default async function AgreementsPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const params = await searchParams;
  const activeTab = params.tab === "templates" ? "templates" : "agreements";

  const TABS: { key: "agreements" | "templates"; label: string; href: string }[] = [
    { key: "agreements", label: "Agreements", href: "/admin/agreements" },
    { key: "templates", label: "Templates", href: "/admin/agreements?tab=templates" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "calc(100vh - 56px)" }}>
      <div style={{ display: "flex", gap: "2px", padding: "16px 32px 0", borderBottom: "1px solid #e8e7e2", background: "#ffffff", flexShrink: 0 }}>
        {TABS.map(({ key, label, href }) => (
          <Link key={key} href={href} style={{
            fontSize: "12.5px", fontWeight: activeTab === key ? 600 : 400,
            color: activeTab === key ? "#111110" : "#8a8a84",
            textDecoration: "none", padding: "8px 16px 12px",
            borderBottom: activeTab === key ? "2px solid #111110" : "2px solid transparent",
            marginBottom: "-1px", letterSpacing: "0.3px",
          }}>
            {label}
          </Link>
        ))}
      </div>

      {activeTab === "agreements" ? (
        <AgreementsView searchParams={params} />
      ) : (
        <TemplatesView searchParams={params} />
      )}
    </div>
  );
}
