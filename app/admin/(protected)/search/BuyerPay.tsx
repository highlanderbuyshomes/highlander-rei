"use client";

import { useEffect, useRef, useState } from "react";
import type { IbBuyer, IbInvestorBuy } from "@/lib/integrations/investorbase";
import type { BuyerPayResponse } from "@/lib/search/buyer-pay-load";
import type { BuyersResponse } from "@/lib/search/buyer-search-load";
import { loadGoogleMaps } from "./load-google-maps";
import styles from "./search.module.css";

const COLORS = { subject: "#d63b3b", flipper: "#2f8bd8", landlord: "#2e9a5a", ranked: "#e0a21b" } as const;
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
          <td>{b.smart_match ? <span className={styles.smartTag}>SmartMatch #{b.smart_match_rank}</span> : `#${b.smart_match_rank}`}</td>
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

function BuyerMap({ subject, map, ranked, focus }: { subject: { latitude: number; longitude: number }; map: IbInvestorBuy[]; ranked: IbInvestorBuy[]; focus: number | null }) {
  const node = useRef<HTMLDivElement>(null);
  const [error, setError] = useState("");
  const rankedMarkers = useRef<(google.maps.Marker | null)[]>([]);
  const openInfo = useRef<((i: number) => void) | null>(null);

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
      const pin = (lat: number, lng: number, color: string, scale: number, z: number, html: string | null): google.maps.Marker => {
        const m = new google.maps.Marker({
          map: gmap, position: { lat, lng }, zIndex: z,
          icon: { path: google.maps.SymbolPath.CIRCLE, scale, fillColor: color, fillOpacity: 0.95, strokeColor: "#ffffff", strokeWeight: 1.5 },
        });
        if (html) m.addListener("click", () => { info.setContent(html); info.open({ map: gmap, anchor: m }); });
        markers.push(m);
        bounds.extend({ lat, lng });
        return m;
      };
      const detail = (b: IbInvestorBuy) => {
        const p = paid(b), sale = b.flip_sale_transaction_price;
        const method = isBuyer(b) ? b.flip_purchase_method ?? b.rental_purchase_method : null;
        const lines = [
          isBuyer(b) ? `<strong>${esc(buyerName(b))}</strong>${b.smart_match ? ` · SmartMatch #${b.smart_match_rank}` : ""}` : "",
          isBuyer(b) && (b.buyer_phone_number || b.buyer_email) ? esc([b.buyer_phone_number, b.buyer_email].filter(Boolean).join(" · ")) : "",
          `<strong>${b.buyer_type === "flipper" ? "Flipper" : "Landlord"}</strong> · ${esc(b.address ?? "")}`,
          `${b.bedrooms ?? "—"} bd / ${b.bathrooms ?? "—"} ba · ${b.livingsquarefeet?.toLocaleString() ?? "—"} sqft`,
          `Paid ${money(p)} ${month(b.flip_purchase_transaction_date ?? b.rental_purchase_transaction_date)}${method ? ` · ${esc(method)}` : ""}`,
          sale ? `Resold ${money(sale)} ${month(b.flip_sale_transaction_date)}${p ? ` · +${money(sale - p)} · ${Math.round((p / sale) * 100)}% of resale` : ""}` : "",
        ];
        return `<div style="font:12px/1.5 system-ui;max-width:240px">${lines.filter(Boolean).join("<br>")}</div>`;
      };
      for (const b of map) if (b.latitude != null && b.longitude != null) pin(b.latitude, b.longitude, b.buyer_type === "flipper" ? COLORS.flipper : COLORS.landlord, 5, 1, detail(b));
      rankedMarkers.current = ranked.map((b) => b.latitude != null && b.longitude != null
        ? pin(b.latitude, b.longitude, isBuyer(b) ? (b.smart_match ? COLORS.ranked : b.buyer_type === "flipper" ? COLORS.flipper : COLORS.landlord) : COLORS.ranked, isBuyer(b) ? 8 : 7, 2, detail(b))
        : null);
      openInfo.current = (i) => {
        const m = rankedMarkers.current[i], b = ranked[i];
        if (!m || !b) return;
        info.setContent(detail(b));
        info.open({ map: gmap, anchor: m });
        gmap.panTo(m.getPosition()!);
      };
      pin(subject.latitude, subject.longitude, COLORS.subject, 9, 3, null);
      if (markers.length > 1) gmap.fitBounds(bounds, 40);
    }).catch((err: Error) => setError(err.message));
    return () => { cancelled = true; openInfo.current = null; markers.forEach((m) => m.setMap(null)); };
  }, [subject, map, ranked]);

  return <div className={styles.buyerMapShell}>
    <div ref={node} className={styles.buyerMap} aria-label="Map of investor purchases near this property" />
    {error && <p className={styles.previewNote}>Map unavailable: {error}</p>}
    <div className={styles.buyerLegend}>
      {([["Subject", COLORS.subject], ["Best matches", COLORS.ranked], ["Flippers", COLORS.flipper], ["Landlords", COLORS.landlord]] as const).map(([label, color]) => <span key={label}><i style={{ background: color }} />{label}</span>)}
      <em>Flipper/landlord pins are approximate</em>
    </div>
  </div>;
}
