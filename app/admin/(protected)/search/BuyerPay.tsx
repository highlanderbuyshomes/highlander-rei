"use client";

import { useEffect, useRef, useState } from "react";
import type { IbBuyer, IbInvestorBuy } from "@/lib/integrations/investorbase";
import type { BuyerPayResponse } from "@/lib/search/buyer-pay-load";
import type { BuyersResponse } from "@/lib/search/buyer-search-load";
import { loadGoogleMaps } from "./load-google-maps";
import { pinIcon, pinSvg, type PinKind } from "./buyer-pins";
import styles from "./search.module.css";

const k = (v: number | null | undefined) => (v == null ? "—" : `$${Math.round(v / 1000)}k`);
const money = (v: number | null | undefined) => (v == null ? "—" : v.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }));
const month = (d: string | null) => (d ? new Date(d).toLocaleDateString("en-US", { month: "short", year: "2-digit" }) : "");
const paid = (b: IbInvestorBuy) => b.flip_purchase_transaction_price ?? b.rental_purchase_transaction_price;
const isBuyer = (b: IbInvestorBuy): b is IbBuyer => "smart_match_rank" in b;
const buyerName = (b: IbBuyer) => b.buyer_entity_name || [b.buyer_first_name, b.buyer_last_name].filter(Boolean).join(" ") || "Unknown buyer";
const esc = (v: string) => v.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
type BuyerFilter = "all" | "smart" | "flipper" | "landlord";

/** What investors would pay here (InvestorBase), with a map of where they're buying. */
export default function BuyerPay({ listingId, onUnavailable }: { listingId: string; onUnavailable: () => void }) {
  const [data, setData] = useState<BuyerPayResponse | null>(null);
  const [failed, setFailed] = useState(false);
  const [buyers, setBuyers] = useState<BuyersResponse | null>(null);
  const [searching, setSearching] = useState(false);
  const [filter, setFilter] = useState<BuyerFilter>("all");
  const [focus, setFocus] = useState<number | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    fetch(`/api/admin/search/buyers?id=${encodeURIComponent(listingId)}`, { signal: ctrl.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((json: BuyersResponse | null) => setBuyers(json ?? { ok: true, buyers: null, remaining: null, fetchedAt: null }))
      .catch(() => { if (!ctrl.signal.aborted) setBuyers({ ok: true, buyers: null, remaining: null, fetchedAt: null }); });
    return () => ctrl.abort();
  }, [listingId]);

  async function searchBuyers() {
    setSearching(true);
    try {
      const res = await fetch(`/api/admin/search/buyers?id=${encodeURIComponent(listingId)}`, { method: "POST" });
      setBuyers(res.ok ? await res.json() : { ok: false, reason: "error", message: "InvestorBase didn't respond" });
    } finally { setSearching(false); }
  }

  useEffect(() => {
    const ctrl = new AbortController();
    fetch(`/api/admin/search/buyer-pay?id=${encodeURIComponent(listingId)}`, { signal: ctrl.signal })
      .then((res) => { if (!res.ok) throw new Error(String(res.status)); return res.json(); })
      .then((json: BuyerPayResponse) => { setData(json); if (!json.ok) onUnavailable(); })
      .catch(() => { if (!ctrl.signal.aborted) { setFailed(true); onUnavailable(); } });
    return () => ctrl.abort();
  }, [listingId, onUnavailable]);

  if (failed) return <p className={styles.previewNote}>InvestorBase didn&apos;t respond</p>;
  if (!data) return <p className={styles.previewNote}>Loading what buyers can pay…</p>;
  if (!data.ok) return <p className={styles.previewNote}>{data.message}</p>;

  const { pay, ranked, map, remaining } = data;
  const found = buyers?.ok ? buyers.buyers : null;
  const shown = (found ?? []).filter((b) => filter === "all" || (filter === "smart" ? b.smart_match : b.buyer_type === filter));
  return <div className={styles.buyerPay}>
    <div className={`${styles.detailGrid} ${styles.compsSummary}`}>
      <div>
        <small>Flippers pay</small>
        <strong>{pay.flipper ? `${k(pay.flipper.low)}–${k(pay.flipper.high)}` : "—"}</strong>
        <small>{pay.flipper ? `${pay.flipper.pctLow}–${pay.flipper.pctHigh}% of ARV · $${pay.flipper.ppsfLow}–${pay.flipper.ppsfHigh}/ft · ${pay.flipper.count} flips` : "No flips nearby"}</small>
      </div>
      <div>
        <small>Landlords pay</small>
        <strong>{pay.landlord ? `${k(pay.landlord.low)}–${k(pay.landlord.high)}` : "—"}</strong>
        <small>{pay.landlord ? `$${pay.landlord.ppsfLow}–${pay.landlord.ppsfHigh}/ft · ${pay.landlord.count} buys · ${pay.landlord.aggressive} aggressive / ${pay.landlord.moderate} moderate / ${pay.landlord.conservative} conservative` : "No landlord buys nearby"}</small>
      </div>
    </div>
    <p className={styles.supportingFact}>Flips / rentals · {pay.activity.map((a) => `${a.miles} mi ${a.flips}/${a.rentals}`).join(" · ")}</p>

    <div className={styles.buyersBar}>
      {found
        ? <>
          <strong>{found.length} buyers</strong>
          {([["all", "All"], ["smart", `SmartMatch ${found.filter((b) => b.smart_match).length}`], ["flipper", `Flippers ${found.filter((b) => b.buyer_type === "flipper").length}`], ["landlord", `Landlords ${found.filter((b) => b.buyer_type === "landlord").length}`]] as const).map(([key, label]) =>
            <button key={key} type="button" className={filter === key ? styles.buyersFilterOn : ""} onClick={() => { setFilter(key); setFocus(null); }}>{label}</button>)}
        </>
        : <button type="button" className={styles.loadBuyers} disabled={searching || buyers === null} onClick={searchBuyers}>
          {searching ? "Searching buyers…" : `Load buyers${buyers?.ok && buyers.remaining != null ? ` · ${buyers.remaining} left` : ""}`}
        </button>}
      {buyers && !buyers.ok && <span className={styles.previewNote}>{buyers.message}</span>}
    </div>

    <BuyerMap subject={data.subject} map={map} ranked={found ? shown : ranked} focus={focus} />

    {found && <div className={styles.resultsTable}><table>
      <thead><tr><th>Match</th><th>Buyer</th><th>Type</th><th>Bought</th><th>Bd/Ba · Sq Ft</th><th>Paid</th><th>Resold</th><th>% of resale</th><th>Distance</th></tr></thead>
      <tbody>{shown.map((b, i) => {
        const p = paid(b), sale = b.flip_sale_transaction_price;
        const method = b.flip_purchase_method ?? b.rental_purchase_method;
        return <tr key={`${b.smart_match_rank}-${i}`} className={focus === i ? styles.buyerRowOn : ""} onClick={() => setFocus(i)}>
          <td>{b.smart_match ? <span className={styles.smartTag}>✦ SmartMatch #{b.smart_match_rank}</span> : `#${b.smart_match_rank}`}</td>
          <td><strong>{buyerName(b)}</strong><small>{[b.buyer_phone_number, b.buyer_email].filter(Boolean).join(" · ") || "No contact"}</small></td>
          <td><span className={b.buyer_type === "flipper" ? styles.flipperTag : styles.landlordTag}>{b.buyer_type === "flipper" ? "Flipper" : "Landlord"}</span></td>
          <td><strong>{b.address ?? "—"}</strong></td>
          <td>{b.bedrooms ?? "—"}/{b.bathrooms ?? "—"} · {b.livingsquarefeet?.toLocaleString() ?? "—"}</td>
          <td>{money(p)}<small>{[month(b.flip_purchase_transaction_date ?? b.rental_purchase_transaction_date), method].filter(Boolean).join(" · ")}</small></td>
          <td>{sale ? <>{money(sale)}<small>{month(b.flip_sale_transaction_date)}</small></> : "—"}</td>
          <td>{p && sale ? `${Math.round((p / sale) * 100)}%` : "—"}</td>
          <td>{b.miles_from_subject} mi</td>
        </tr>;
      })}</tbody>
    </table></div>}

    {!found && ranked.length > 0 && <div className={styles.resultsTable}><table>
      <thead><tr><th>#</th><th>Buyer</th><th>Address</th><th>Bd/Ba</th><th>Sq Ft</th><th>Paid</th><th>Resold</th><th>% of resale</th><th>Distance</th></tr></thead>
      <tbody>{ranked.map((b, i) => {
        const p = paid(b), sale = b.flip_sale_transaction_price;
        return <tr key={`${b.address}-${i}`}>
          <td>{b.rank ?? i + 1}</td>
          <td><span className={b.buyer_type === "flipper" ? styles.flipperTag : styles.landlordTag}>{b.buyer_type === "flipper" ? "Flipper" : "Landlord"}</span></td>
          <td><strong>{b.address ?? "—"}</strong></td>
          <td>{b.bedrooms ?? "—"} / {b.bathrooms ?? "—"}</td>
          <td>{b.livingsquarefeet?.toLocaleString() ?? "—"}</td>
          <td>{money(p)}<small>{month(b.flip_purchase_transaction_date ?? b.rental_purchase_transaction_date)}</small></td>
          <td>{sale ? <>{money(sale)}<small>{month(b.flip_sale_transaction_date)}</small></> : "—"}</td>
          <td>{p && sale ? `${Math.round((p / sale) * 100)}%` : "—"}</td>
          <td>{b.miles_from_subject} mi</td>
        </tr>;
      })}</tbody>
    </table></div>}

    <p className={styles.supportingFact}>InvestorBase calls left this month · comps {remaining.investorComps ?? "—"} · summary {remaining.summary ?? "—"} · map {remaining.search ?? "—"} · cached 30 days per property</p>
  </div>;
}

const monthYear = (d: string | null) => (d ? new Date(d).toLocaleDateString("en-US", { month: "short", year: "2-digit" }).replace(" ", " '") : "");
const monthsBetween = (a: string | null, b: string | null) => (a && b ? Math.max(0, Math.round((new Date(b).getTime() - new Date(a).getTime()) / (30.44 * 864e5))) : null);
const shortMoney = (v: number) => `${v < 0 ? "−" : "+"}$${Math.round(Math.abs(v) / 1000)}k`;

/** InvestorBase-style popup: tags, then Property / Purchased / Sold / Duration rows. */
function popupHtml(b: IbInvestorBuy): string {
  const flip = b.buyer_type === "flipper";
  const p = paid(b), sale = b.flip_sale_transaction_price;
  const buyer = isBuyer(b) ? b : null;
  const method = buyer ? buyer.flip_purchase_method ?? buyer.rental_purchase_method : null;
  const pct = p && sale ? Math.round((p / sale) * 100) : null;
  const tag = (text: string, bg: string, color: string) => `<span style="display:inline-block;padding:2px 8px;border-radius:10px;background:${bg};color:${color};font-weight:600;font-size:11px;margin-right:4px">${text}</span>`;
  const row = (label: string, value: string, sub: string, right: string) =>
    `<tr><td style="padding:4px 10px 4px 0;color:#4b5563;vertical-align:top;white-space:nowrap">${label}</td><td style="padding:4px 10px 4px 0;vertical-align:top">${value}${sub ? `<div style="color:#9ca3af;font-size:10px">${sub}</div>` : ""}</td><td style="padding:4px 0;text-align:right;vertical-align:top;white-space:nowrap">${right}</td></tr>`;
  const ring = pct == null ? "" : `<span style="display:inline-flex;align-items:center;gap:5px">ARV ${pct}% <svg width="14" height="14" viewBox="0 0 36 36"><circle cx="18" cy="18" r="14" fill="none" stroke="#e5e7eb" stroke-width="5"/><circle cx="18" cy="18" r="14" fill="none" stroke="#22a35a" stroke-width="5" stroke-dasharray="${(Math.min(100, pct) / 100) * 88} 88" transform="rotate(-90 18 18)"/></svg></span>`;
  const months = monthsBetween(b.flip_purchase_transaction_date, b.flip_sale_transaction_date);
  return `<div style="font:12px/1.4 system-ui,sans-serif;color:#1f2937;min-width:290px;max-width:340px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px"><div>${buyer?.smart_match ? tag("✦ SmartMatch", "#fcefcf", "#9a5b13") : ""}${flip ? tag("Flip", "#dff0fc", "#1a6fb0") : tag("Rental", "#e2f5ea", "#1f7a48")}</div>${b.propertytype ? `<span style="padding:2px 8px;border:1px solid #d1d5db;border-radius:10px;font-size:11px">${esc(b.propertytype)}</span>` : ""}</div>
    ${buyer ? `<div style="margin-bottom:4px"><strong>${esc(buyerName(buyer))}</strong>${buyer.smart_match_rank ? ` <span style="color:#9ca3af">#${buyer.smart_match_rank}</span>` : ""}${buyer.buyer_phone_number || buyer.buyer_email ? `<div style="color:#4b5563">${esc([buyer.buyer_phone_number, buyer.buyer_email].filter(Boolean).join(" · "))}</div>` : ""}</div>` : ""}
    <table style="width:100%;border-collapse:collapse">
      ${row("Property", esc(b.address ?? "—"), "", `${b.bedrooms ?? "—"} bd | ${b.bathrooms ?? "—"} ba | ${b.livingsquarefeet?.toLocaleString() ?? "—"} sqft`)}
      ${row("Purchased", `${money(p)} (${monthYear(b.flip_purchase_transaction_date ?? b.rental_purchase_transaction_date)})`, method ? esc(method) : "", ring)}
      ${sale ? row("Sold", `${money(sale)} (${monthYear(b.flip_sale_transaction_date)})`, "", p ? `Profit <strong style="color:${sale - p >= 0 ? "#16803c" : "#c23a2b"}">${shortMoney(sale - p)}</strong>` : "") : ""}
      ${months != null ? row("Duration", `${months} month${months === 1 ? "" : "s"}`, "", "") : ""}
    </table></div>`;
}

function BuyerMap({ subject, map, ranked, focus }: { subject: { latitude: number; longitude: number }; map: IbInvestorBuy[]; ranked: IbInvestorBuy[]; focus: number | null }) {
  const node = useRef<HTMLDivElement>(null);
  const [error, setError] = useState("");
  const rankedMarkers = useRef<(google.maps.Marker | null)[]>([]);
  const openInfo = useRef<((i: number) => void) | null>(null);
  // Loaded buyers carry exact locations and replace the approximate activity pins.
  const showingBuyers = ranked.length > 0 && isBuyer(ranked[0]);

  useEffect(() => { if (focus != null) openInfo.current?.(focus); }, [focus]);

  useEffect(() => {
    let cancelled = false;
    const markers: google.maps.Marker[] = [];
    loadGoogleMaps().then(() => {
      if (cancelled || !node.current) return;
      const gmap = new google.maps.Map(node.current, {
        center: { lat: subject.latitude, lng: subject.longitude }, zoom: 13, mapTypeControl: false, fullscreenControl: false, streetViewControl: false,
        styles: [{ featureType: "poi", stylers: [{ visibility: "off" }] }, { featureType: "transit", stylers: [{ visibility: "off" }] }],
      });
      const info = new google.maps.InfoWindow();
      const bounds = new google.maps.LatLngBounds();
      const pin = (lat: number, lng: number, icon: google.maps.Icon, z: number, b: IbInvestorBuy | null): google.maps.Marker => {
        const m = new google.maps.Marker({ map: gmap, position: { lat, lng }, zIndex: z, icon });
        if (b) m.addListener("click", () => { info.setContent(popupHtml(b)); info.open({ map: gmap, anchor: m }); });
        markers.push(m);
        bounds.extend({ lat, lng });
        return m;
      };
      const kind = (b: IbInvestorBuy) => (b.buyer_type === "flipper" ? "flipper" : "landlord") as PinKind;
      if (!showingBuyers) for (const b of map) if (b.latitude != null && b.longitude != null) pin(b.latitude, b.longitude, pinIcon(kind(b), false, 30), 1, b);
      rankedMarkers.current = ranked.map((b, i) => b.latitude != null && b.longitude != null
        ? pin(b.latitude, b.longitude, pinIcon(kind(b), isBuyer(b) ? b.smart_match : true, 40), (isBuyer(b) && b.smart_match ? 300 : 100) - i, b)
        : null);
      openInfo.current = (i) => {
        const m = rankedMarkers.current[i], b = ranked[i];
        if (!m || !b) return;
        info.setContent(popupHtml(b));
        info.open({ map: gmap, anchor: m });
        gmap.panTo(m.getPosition()!);
      };
      pin(subject.latitude, subject.longitude, pinIcon("subject", false, 44), 1000, null);
      if (markers.length > 1) gmap.fitBounds(bounds, 40);
    }).catch((err: Error) => setError(err.message));
    return () => { cancelled = true; openInfo.current = null; markers.forEach((m) => m.setMap(null)); };
  }, [subject, map, ranked, showingBuyers]);

  const legend: [string, string][] = [["Subject", pinSvg("subject")], [showingBuyers ? "SmartMatch" : "Best matches", pinSvg("flipper", true)], ["Flipper", pinSvg("flipper")], ["Landlord", pinSvg("landlord")]];
  return <div className={styles.buyerMapShell}>
    <div ref={node} className={styles.buyerMap} aria-label="Map of investor purchases near this property" />
    {error && <p className={styles.previewNote}>Map unavailable: {error}</p>}
    <div className={styles.buyerLegend}>
      {legend.map(([label, svg]) => <span key={label}><i className={styles.legendPin} style={{ backgroundImage: `url("data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}")` }} />{label}</span>)}
      {!showingBuyers && <em>Flipper/landlord pins are approximate</em>}
    </div>
  </div>;
}
