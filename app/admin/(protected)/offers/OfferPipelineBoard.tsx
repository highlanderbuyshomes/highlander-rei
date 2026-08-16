"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import type { CSSProperties } from "react";
import { moveOfferStage, scheduleOfferFollowUp } from "./actions";
import { STAGE_LABELS, type PipelineStage } from "./pipeline";
import styles from "./offers.module.css";

export type { PipelineStage };

export type PipelineOffer = {
  id: string;
  address: string;
  seller: string;
  email: string;
  phone: string;
  type: string;
  status: string;
  offerPrice: string;
  offerValue: number;
  closingDate: string;
  updatedAt: string;
  stage: PipelineStage;
  followUpAt: string;
  followUpNote: string;
};

const STAGES: { key: PipelineStage; label: string; nextAction: string; color: string }[] = [
  { key: "offer_made", label: STAGE_LABELS.offer_made, nextAction: "Confirm seller acceptance", color: "#111110" },
  { key: "accepted", label: STAGE_LABELS.accepted, nextAction: "Collect all signatures", color: "#111110" },
  { key: "signed", label: STAGE_LABELS.signed, nextAction: "Coordinate closing", color: "#111110" },
  { key: "closed", label: STAGE_LABELS.closed, nextAction: "Ask for a referral", color: "#111110" },
  { key: "referral", label: STAGE_LABELS.referral, nextAction: "Nurture the relationship", color: "#111110" },
];

const TYPE_LABELS: Record<string, string> = {
  cash_offer: "Cash Offer",
  flex_equity: "Flex Equity",
  aif_novation: "AIF / Novation",
};

function money(value: number) {
  return value ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value) : "$0";
}

function dateLabel(value: string) {
  if (!value) return "";
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function OfferPipelineBoard({ offers }: { offers: PipelineOffer[] }) {
  const [cards, setCards] = useState(offers);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dropStage, setDropStage] = useState<PipelineStage | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => setCards(offers), [offers]);

  const grouped = useMemo(() => Object.fromEntries(STAGES.map((stage) => [stage.key, cards.filter((card) => card.stage === stage.key)])) as Record<PipelineStage, PipelineOffer[]>, [cards]);

  function changeStage(id: string, stage: PipelineStage) {
    const previous = cards;
    setCards((current) => current.map((card) => card.id === id ? { ...card, stage } : card));
    startTransition(async () => {
      try {
        await moveOfferStage(id, stage);
      } catch {
        setCards(previous);
      }
    });
  }

  return (
    <section className={styles.board} aria-label="Seller offer pipeline">
      {STAGES.map((stage, stageIndex) => {
        const stageCards = grouped[stage.key];
        const total = stageCards.reduce((sum, card) => sum + card.offerValue, 0);
        return (
          <div
            className={`${styles.column} ${dropStage === stage.key ? styles.dropTarget : ""}`}
            key={stage.key}
            onDragOver={(event) => { event.preventDefault(); setDropStage(stage.key); }}
            onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setDropStage(null); }}
            onDrop={(event) => {
              event.preventDefault();
              const id = event.dataTransfer.getData("text/plain") || draggedId;
              if (id) changeStage(id, stage.key);
              setDraggedId(null);
              setDropStage(null);
            }}
          >
            <header className={styles.columnHeader} style={{ "--stage-color": stage.color } as CSSProperties}>
              <div><span className={styles.stageDot} /><strong>{stage.label}</strong></div>
              <p>{stageCards.length} {stageCards.length === 1 ? "offer" : "offers"} <span>{money(total)}</span></p>
            </header>
            <div className={styles.cardStack}>
              {stageCards.map((offer) => (
                <article
                  className={styles.card}
                  draggable
                  key={offer.id}
                  onDragStart={(event) => { setDraggedId(offer.id); event.dataTransfer.setData("text/plain", offer.id); event.dataTransfer.effectAllowed = "move"; }}
                  onDragEnd={() => { setDraggedId(null); setDropStage(null); }}
                >
                  <div className={styles.cardTop}>
                    <Link href={`/admin/agreements/${offer.id}`}>{offer.address}</Link>
                    <span title={offer.seller}>{offer.seller.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()}</span>
                  </div>
                  <div className={styles.offerMeta}>
                    <strong>{offer.offerPrice || money(offer.offerValue)}</strong>
                    <span>{TYPE_LABELS[offer.type] ?? offer.type.replaceAll("_", " ")}</span>
                  </div>
                  <dl className={styles.contactDetails}>
                    <div><dt>Seller</dt><dd>{offer.seller}</dd></div>
                    {offer.phone && <div><dt>Phone</dt><dd><a href={`tel:${offer.phone}`}>{offer.phone}</a></dd></div>}
                    {offer.email && <div><dt>Email</dt><dd><a href={`mailto:${offer.email}`}>{offer.email}</a></dd></div>}
                  </dl>

                  <div className={styles.progress} aria-label={`Offer is in ${stage.label}`}>
                    {STAGES.slice(1).map((step, index) => <span key={step.key} className={stageIndex > index ? styles.progressDone : ""} />)}
                  </div>

                  <div className={styles.nextAction}>
                    <span>Next action</span>
                    <strong>{stage.key === "signed" && offer.closingDate ? `Close by ${dateLabel(offer.closingDate)}` : stage.nextAction}</strong>
                  </div>

                  {offer.followUpAt && (
                    <div className={styles.followUpBadge}>
                      <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></svg>
                      {dateLabel(offer.followUpAt)}{offer.followUpNote ? ` · ${offer.followUpNote}` : ""}
                    </div>
                  )}

                  <div className={styles.cardActions}>
                    <details>
                      <summary>Follow up</summary>
                      <form action={scheduleOfferFollowUp.bind(null, offer.id)}>
                        <label>Date<input type="date" name="followUpAt" defaultValue={offer.followUpAt} /></label>
                        <label>Note<textarea name="followUpNote" defaultValue={offer.followUpNote} placeholder="What needs to happen next?" /></label>
                        <button type="submit">Save follow-up</button>
                      </form>
                    </details>
                    {stageIndex < STAGES.length - 1 && <button type="button" onClick={() => changeStage(offer.id, STAGES[stageIndex + 1].key)}>Advance <span>→</span></button>}
                  </div>
                </article>
              ))}
              {stageCards.length === 0 && <div className={styles.emptyColumn}>Drop an offer here</div>}
            </div>
          </div>
        );
      })}
    </section>
  );
}
