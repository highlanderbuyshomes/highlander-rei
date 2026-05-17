"use client";
import Link from "next/link";
import { useLanguage } from "@/lib/LanguageContext";

const t = {
  en: {
    tagline: "Real estate solutions in Phoenix, AZ and Dallas, TX — whether you're selling, exploring options, or investing.",
    entity: "Highlander REI LLC",
    pathsLabel: "Paths",
    paths: [
      { href: "/sell", label: "Sell Your Home" },
      { href: "/sell/cash", label: "Cash Offer" },
      { href: "/sell/flex", label: "Flex Equity Program" },
      { href: "/buy", label: "Buy" },
      { href: "/invest", label: "Invest With Us" },
    ],
    brandsLabel: "Brands",
    marketsLabel: "Markets",
    copyright: (year: number) => `© ${year} Highlander REI LLC. All rights reserved.`,
    markets: "Phoenix, AZ · Dallas, TX",
  },
  es: {
    tagline: "Soluciones inmobiliarias en Phoenix, AZ y Dallas, TX — ya sea que estés vendiendo, explorando opciones o invirtiendo.",
    entity: "Highlander REI LLC",
    pathsLabel: "Opciones",
    paths: [
      { href: "/sell", label: "Vender Tu Casa" },
      { href: "/sell/cash", label: "Oferta en Efectivo" },
      { href: "/sell/flex", label: "Programa Flex Equity" },
      { href: "/buy", label: "Comprar" },
      { href: "/invest", label: "Invertir Con Nosotros" },
    ],
    brandsLabel: "Marcas",
    marketsLabel: "Mercados",
    copyright: (year: number) => `© ${year} Highlander REI LLC. Todos los derechos reservados.`,
    markets: "Phoenix, AZ · Dallas, TX",
  },
};

export default function Footer() {
  const { lang } = useLanguage();
  const c = t[lang];

  return (
    <footer className="site-footer">
      <div style={{ maxWidth: "1160px", margin: "0 auto", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-start", gap: "40px" }}>
        <div style={{ maxWidth: "260px" }}>
          <div style={{ display: "flex", alignItems: "center", marginBottom: "14px" }}>
            <span style={{ fontFamily: "var(--font-display)", fontSize: "22px", color: "var(--white)", letterSpacing: "2.5px" }}>HIGHLANDER REI</span>
            <span style={{ fontFamily: "var(--font-display)", fontSize: "26px", color: "var(--blue)", lineHeight: "0.65", marginLeft: "2px" }}>.</span>
          </div>
          <p style={{ fontSize: "12.5px", lineHeight: 1.75 }}>{c.tagline}</p>
          <p style={{ fontSize: "11.5px", marginTop: "12px", color: "rgba(255,255,255,0.3)" }}>{c.entity}</p>
        </div>

        <div style={{ display: "flex", gap: "56px", flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "1.2px", marginBottom: "14px" }}>{c.pathsLabel}</div>
            {c.paths.map((l) => (
              <div key={l.href} style={{ marginBottom: "10px" }}>
                <Link href={l.href} style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", textDecoration: "none" }}>{l.label}</Link>
              </div>
            ))}
          </div>

          <div>
            <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "1.2px", marginBottom: "14px" }}>{c.brandsLabel}</div>
            <div style={{ marginBottom: "10px" }}>
              <a href="https://highlanderbuyshomes.com" style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", textDecoration: "none" }}>Highlander Buys Homes</a>
            </div>
            <div style={{ marginBottom: "10px" }}>
              <a href="https://flipwithhighlander.com" style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", textDecoration: "none" }}>Flip With Highlander</a>
            </div>
          </div>

          <div>
            <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "1.2px", marginBottom: "14px" }}>{c.marketsLabel}</div>
            <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", marginBottom: "10px" }}>Phoenix, AZ</div>
            <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)" }}>Dallas, TX</div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: "1160px", margin: "36px auto 0", paddingTop: "24px", borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", fontSize: "11.5px", color: "rgba(255,255,255,0.25)" }}>
        <span>{c.copyright(new Date().getFullYear())}</span>
        <span>{c.markets}</span>
      </div>
    </footer>
  );
}
