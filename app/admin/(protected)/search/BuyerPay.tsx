"use client";

import { useEffect, useRef, useState } from "react";
import type { IbInvestorBuy } from "@/lib/integrations/investorbase";
import type { BuyerPayResponse } from "@/lib/search/buyer-pay-load";
import { loadGoogleMaps } from "./load-google-maps";
import styles from "./search.module.css";

const COLORS = { subject: "#d63b3b", flipper: "#2f8bd8", landlord: "#2e9a5a", ranked: "#e0a21b" } as const;
const k = (v: number | null | undefined) => (v == null ? "—" : `$${Math.round(v / 1000)}k`);
const money = (v: number | null | undefined) => (v == null ? "—" : v.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }));
const month = (d: string | null) => (d ? new Date(d).toLocaleDateString("en-US", { month: "short", year: "2-digit" }) : "");
const paid = (b: IbInvestorBuy) => b.flip_purchase_transaction_price ?? b.rental_purchase_transaction_price;

/** What investors would pay here (InvestorBase), with a map of where they're buying. */
export default function BuyerPay({ listingId, onUnavailable }: { listingId: string; onUnavailable: () => void }) {
  const [data, setData] = useState<BuyerPayResponse | null>(null);
  const [failed, setFailed] = useState(false);

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

    <BuyerMap subject={data.subject} map={map} ranked={ranked} />

    {ranked.length > 0 && <div className={styles.resultsTable}><table>
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

function BuyerMap({ subject, map, ranked }: { subject: { latitude: number; longitude: number }; map: IbInvestorBuy[]; ranked: IbInvestorBuy[] }) {
  const node = useRef<HTMLDivElement>(null);
  const [error, setError] = useState("");

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
      const pin = (lat: number, lng: number, color: string, scale: number, z: number, html: string | null) => {
        const m = new google.maps.Marker({
          map: gmap, position: { lat, lng }, zIndex: z,
          icon: { path: google.maps.SymbolPath.CIRCLE, scale, fillColor: color, fillOpacity: 0.95, strokeColor: "#ffffff", strokeWeight: 1.5 },
        });
        if (html) m.addListener("click", () => { info.setContent(html); info.open({ map: gmap, anchor: m }); });
        markers.push(m);
        bounds.extend({ lat, lng });
      };
      const detail = (b: IbInvestorBuy) => {
        const p = paid(b), sale = b.flip_sale_transaction_price;
        const lines = [
          `<strong>${b.buyer_type === "flipper" ? "Flipper" : "Landlord"}</strong> · ${b.address ?? ""}`,
          `${b.bedrooms ?? "—"} bd / ${b.bathrooms ?? "—"} ba · ${b.livingsquarefeet?.toLocaleString() ?? "—"} sqft`,
          `Paid ${money(p)} ${month(b.flip_purchase_transaction_date ?? b.rental_purchase_transaction_date)}`,
          sale ? `Resold ${money(sale)} ${month(b.flip_sale_transaction_date)}${p ? ` · +${money(sale - p)} · ${Math.round((p / sale) * 100)}% of resale` : ""}` : "",
        ];
        return `<div style="font:12px/1.5 system-ui;max-width:240px">${lines.filter(Boolean).join("<br>")}</div>`;
      };
      for (const b of map) if (b.latitude != null && b.longitude != null) pin(b.latitude, b.longitude, b.buyer_type === "flipper" ? COLORS.flipper : COLORS.landlord, 5, 1, detail(b));
      for (const b of ranked) if (b.latitude != null && b.longitude != null) pin(b.latitude, b.longitude, COLORS.ranked, 7, 2, detail(b));
      pin(subject.latitude, subject.longitude, COLORS.subject, 9, 3, null);
      if (markers.length > 1) gmap.fitBounds(bounds, 40);
    }).catch((err: Error) => setError(err.message));
    return () => { cancelled = true; markers.forEach((m) => m.setMap(null)); };
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
