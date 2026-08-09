"use client";

import { useMemo, useState } from "react";
import { createArea, deleteArea, toggleArea, updateArea } from "../search/actions";
import { createBuyBox, toggleBuyBox, deleteBuyBox, updateBuyBox } from "../offers/actions";
import styles from "./buyers.module.css";

type BuyBox = {
  id: string;
  name: string;
  active: boolean;
  zips: unknown;
  propertyTypes: unknown;
  mlsStatuses: unknown;
  priceMin: number | null;
  priceMax: number | null;
  bedsMin: number | null;
  bathsMin: number | null;
  sqftMin: number | null;
  sqftMax: number | null;
  lotSqftMin: number | null;
  lotSqftMax: number | null;
  maxDom: number | null;
  dispositionStrategy: string | null;
};

type Buyer = {
  id: string;
  name: string;
  buyerContact: string | null;
  description: string | null;
  active: boolean;
  buyBoxes: BuyBox[];
};

function strings(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function money(value: number | null) {
  if (value == null) return "Any";
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${Math.round(value / 1_000)}K`;
  return `$${Math.round(value).toLocaleString()}`;
}

function buyBoxCriteria(buyBox: BuyBox) {
  const criteria: string[] = [];
  const zips = strings(buyBox.zips).filter((zip) => /^\d{5}$/.test(zip));
  const types = strings(buyBox.propertyTypes);
  const statuses = strings(buyBox.mlsStatuses);
  if (zips.length) criteria.push(`ZIP ${zips.slice(0, 4).join(", ")}${zips.length > 4 ? " +" : ""}`);
  if (types.length) criteria.push(types.slice(0, 3).join(" / "));
  if (buyBox.priceMin != null || buyBox.priceMax != null) criteria.push(`${money(buyBox.priceMin)}–${money(buyBox.priceMax)}`);
  if (buyBox.bedsMin != null) criteria.push(`${buyBox.bedsMin}+ beds`);
  if (buyBox.bathsMin != null) criteria.push(`${buyBox.bathsMin}+ baths`);
  if (buyBox.sqftMin != null || buyBox.sqftMax != null) criteria.push(`${buyBox.sqftMin?.toLocaleString() ?? "Any"}–${buyBox.sqftMax?.toLocaleString() ?? "Any"} sqft`);
  if (buyBox.lotSqftMin != null || buyBox.lotSqftMax != null) criteria.push(`${buyBox.lotSqftMin?.toLocaleString() ?? "Any"}–${buyBox.lotSqftMax?.toLocaleString() ?? "Any"} lot sqft`);
  if (statuses.length) criteria.push(statuses.join(" / "));
  if (buyBox.maxDom != null) criteria.push(`≤ ${buyBox.maxDom} DOM`);
  if (buyBox.dispositionStrategy) criteria.push(buyBox.dispositionStrategy);
  return criteria.length ? criteria : ["Criteria not configured"];
}

function num(value: number | null) {
  return value == null ? "" : String(value);
}

export default function BuyersWorkspace({ buyers }: { buyers: Buyer[] }) {
  const [selectedId, setSelectedId] = useState(buyers[0]?.id ?? "");
  const [editingBuyer, setEditingBuyer] = useState(false);
  const [editingBuyBoxId, setEditingBuyBoxId] = useState<string | null>(null);
  const selected = useMemo(() => buyers.find((buyer) => buyer.id === selectedId) ?? buyers[0] ?? null, [buyers, selectedId]);

  const activeBuyers = buyers.filter((buyer) => buyer.active).length;
  const activeBuyBoxes = buyers.reduce((count, buyer) => count + buyer.buyBoxes.filter((box) => box.active).length, 0);

  function selectBuyer(id: string) {
    setSelectedId(id);
    setEditingBuyer(false);
    setEditingBuyBoxId(null);
  }

  async function handleUpdateArea(id: string, formData: FormData) {
    await updateArea(id, formData);
    setEditingBuyer(false);
  }

  async function handleUpdateBuyBox(id: string, formData: FormData) {
    await updateBuyBox(id, formData);
    setEditingBuyBoxId(null);
  }

  return <main className={styles.shell}>
    <header className={styles.pageHeader}>
      <div><span>Disposition Network</span><h1>Our Buyers</h1><p>Committed buyers and the exact buy boxes acquisitions should hunt for.</p></div>
      <div className={styles.metrics}><div><strong>{activeBuyers}</strong><span>Active buyers</span></div><div><strong>{activeBuyBoxes}</strong><span>Active buy boxes</span></div><div><strong>{buyers.length}</strong><span>Total relationships</span></div></div>
    </header>

    <div className={styles.workspace}>
      <aside className={styles.addPanel}>
        <span>Add relationship</span><h2>Add a buyer</h2><p>Start with the buyer or market name. Buy-box criteria linked to this buyer will appear here automatically.</p>
        <form action={createArea}>
          <label>Buyer or market name<input name="name" required placeholder="Smith Family — Arcadia" /></label>
          <label>Primary contact<input name="buyerContact" placeholder="Name, phone, or email" /></label>
          <label>Acquisition notes<textarea name="description" rows={4} placeholder="What they buy, how quickly they close, proof of funds…" /></label>
          <button type="submit">Add buyer</button>
        </form>
      </aside>

      <section className={styles.listPanel} aria-label="Buyer relationships">
        <div className={styles.listPanelHeader}><span>Buyer network</span><strong>{buyers.length} relationships</strong></div>
        <div className={styles.buyerListCompact}>
          {buyers.map((buyer) => <button key={buyer.id} type="button" className={`${styles.buyerRow} ${buyer.id === selected?.id ? styles.buyerRowActive : ""} ${buyer.active ? "" : styles.buyerRowPaused}`} onClick={() => selectBuyer(buyer.id)}>
            <span className={styles.avatarSm}>{buyer.name.trim().charAt(0).toUpperCase()}</span>
            <span className={styles.rowText}><strong>{buyer.name}</strong><small>{buyer.buyerContact ?? "No primary contact"}</small></span>
            <span className={styles.rowMeta}><span className={styles.boxCount}>{buyer.buyBoxes.length}</span><span className={buyer.active ? styles.activeBadge : styles.pausedBadge}>{buyer.active ? "Active" : "Paused"}</span></span>
          </button>)}
          {!buyers.length && <div className={styles.emptyBox}>No buyers added yet.</div>}
        </div>
      </section>

      <section className={styles.detailPanel} aria-label="Buyer detail">
        {selected ? <article className={styles.buyerCard}>
          {editingBuyer ? (
            <form className={styles.editBuyerForm} action={handleUpdateArea.bind(null, selected.id)}>
              <label>Buyer or market name<input name="name" required defaultValue={selected.name} /></label>
              <label>Primary contact<input name="buyerContact" defaultValue={selected.buyerContact ?? ""} placeholder="Name, phone, or email" /></label>
              <label>Acquisition notes<textarea name="description" rows={3} defaultValue={selected.description ?? ""} placeholder="What they buy, how quickly they close, proof of funds…" /></label>
              <div className={styles.editFormActions}>
                <button type="submit">Save</button>
                <button type="button" onClick={() => setEditingBuyer(false)}>Cancel</button>
              </div>
            </form>
          ) : <>
            <header><div className={styles.avatar}>{selected.name.trim().charAt(0).toUpperCase()}</div><div><h2>{selected.name}</h2><p>{selected.buyerContact ?? "No primary contact added"}</p></div><span className={selected.active ? styles.activeBadge : styles.pausedBadge}>{selected.active ? "Active" : "Paused"}</span><button type="button" className={styles.editLink} onClick={() => setEditingBuyer(true)}>Edit</button></header>
            {selected.description && <p className={styles.notes}>{selected.description}</p>}
          </>}
          <div className={styles.buyBoxes}>
            <div className={styles.buyBoxHeading}><strong>Buy boxes</strong><span>{selected.buyBoxes.length}</span></div>
            {selected.buyBoxes.length ? selected.buyBoxes.map((buyBox) => editingBuyBoxId === buyBox.id ? (
              <form key={buyBox.id} className={styles.editBuyBoxForm} action={handleUpdateBuyBox.bind(null, buyBox.id)}>
                <input name="name" required defaultValue={buyBox.name} placeholder="Buy box name" className={styles.fullWidth} />
                <input name="zips" defaultValue={strings(buyBox.zips).join(", ")} placeholder="ZIP codes or cities" />
                <input name="propertyTypes" defaultValue={strings(buyBox.propertyTypes).join(", ")} placeholder="Property types — SFR, Condo" />
                <input name="priceMin" type="number" defaultValue={num(buyBox.priceMin)} placeholder="Price min" />
                <input name="priceMax" type="number" defaultValue={num(buyBox.priceMax)} placeholder="Price max" />
                <div className={styles.editFormActions}>
                  <button type="submit">Save</button>
                  <button type="button" onClick={() => setEditingBuyBoxId(null)}>Cancel</button>
                </div>
              </form>
            ) : <section key={buyBox.id} className={styles.buyBox}>
              <div><strong>{buyBox.name}</strong><span className={buyBox.active ? styles.boxActive : styles.boxPaused}>{buyBox.active ? "Active" : "Paused"}</span>
                <div className={styles.buyBoxActions}>
                  <button type="button" onClick={() => setEditingBuyBoxId(buyBox.id)}>Edit</button>
                  <form action={toggleBuyBox.bind(null, buyBox.id)}><button type="submit">{buyBox.active ? "Pause" : "Activate"}</button></form>
                  <form action={deleteBuyBox.bind(null, buyBox.id)}><button type="submit" className={styles.deleteButton}>Delete</button></form>
                </div>
              </div>
              <div className={styles.criteria}>{buyBoxCriteria(buyBox).map((criterion) => <span key={criterion}>{criterion}</span>)}</div>
            </section>) : <div className={styles.emptyBox}>No buy boxes linked yet.</div>}
            <form className={styles.addBuyBoxForm} action={createBuyBox}>
              <input type="hidden" name="areaId" value={selected.id} />
              <input name="name" required placeholder="Buy box name — e.g. Arcadia SFR under 800K" className={styles.fullWidth} />
              <input name="zips" placeholder="ZIP codes or cities" />
              <input name="propertyTypes" placeholder="Property types — SFR, Condo" />
              <input name="priceMin" type="number" placeholder="Price min" />
              <input name="priceMax" type="number" placeholder="Price max" />
              <button type="submit">+ Add buy box</button>
            </form>
          </div>
          <footer><form action={toggleArea.bind(null, selected.id)}><button type="submit">{selected.active ? "Pause buyer" : "Activate buyer"}</button></form><form action={deleteArea.bind(null, selected.id)}><button type="submit" className={styles.deleteButton}>Delete</button></form></footer>
        </article> : <div className={styles.emptyState}><strong>No buyers added yet</strong><span>Add the first committed buyer to start building the acquisition target list.</span></div>}
      </section>
    </div>
  </main>;
}
