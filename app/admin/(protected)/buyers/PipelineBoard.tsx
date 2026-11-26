"use client";

import { useEffect, useMemo, useRef, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { PipelineCard, PipelineStage } from "@/lib/integrations/ghl-api";
import { moveBuyer, noteBuyer, openBuyer, saveBuyerBox, saveBuyerContact, tagBuyer, type CardData } from "./pipeline-actions";
import styles from "./pipeline.module.css";

type Field = { id: string; label: string };

function prettyPhone(value: string | null) {
  const d = value?.replace(/\D/g, "") ?? "";
  const ten = d.length === 11 && d.startsWith("1") ? d.slice(1) : d;
  return ten.length === 10 ? `(${ten.slice(0, 3)}) ${ten.slice(3, 6)}-${ten.slice(6)}` : value;
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "?") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

function when(iso: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

const I = {
  ext: <><path d="M14 4h6v6" /><path d="M20 4 10 14" /><path d="M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5" /></>,
  phone: <path d="M21 16.4v2.9a1.9 1.9 0 0 1-2.1 1.9 18.8 18.8 0 0 1-8.2-2.9 18.5 18.5 0 0 1-5.7-5.7A18.8 18.8 0 0 1 2.1 4.4 1.9 1.9 0 0 1 4 2.3h2.9a1.9 1.9 0 0 1 1.9 1.6c.1.9.4 1.8.7 2.7a1.9 1.9 0 0 1-.4 2L7.8 9.8a15.2 15.2 0 0 0 5.7 5.7l1.2-1.2a1.9 1.9 0 0 1 2-.4c.9.3 1.8.6 2.7.7a1.9 1.9 0 0 1 1.6 1.8Z" />,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3.5 6.5 8.5 6.5 8.5-6.5" /></>,
  sms: <><path d="M21 12a8.5 8.5 0 0 1-12.4 7.6L3 21l1.4-5.1A8.5 8.5 0 1 1 21 12Z" /></>,
  x: <path d="M18 6 6 18M6 6l12 12" />,
  plus: <path d="M12 5v14M5 12h14" />,
  refresh: <><path d="M21 12a9 9 0 1 1-2.64-6.36" /><path d="M21 3v6h-6" /></>,
};

function Svg({ children, size = 16 }: { children: ReactNode; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>;
}

export default function PipelineBoard({
  tabs, stages, cards: initialCards, fields, contactUrl, error,
}: {
  tabs: ReactNode;
  stages: PipelineStage[];
  cards: PipelineCard[];
  fields: readonly Field[];
  contactUrl: string;
  error: string | null;
}) {
  const router = useRouter();
  const [cards, setCards] = useState(initialCards);
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overStage, setOverStage] = useState<string | null>(null);
  const [moveError, setMoveError] = useState<string | null>(null);
  const [refreshing, startRefresh] = useTransition();


  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return cards;
    return cards.filter((c) => [c.name, c.company, c.phone, c.email, ...c.tags].some((v) => v?.toLowerCase().includes(q)));
  }, [cards, query]);

  async function move(card: PipelineCard, stageId: string) {
    if (card.stageId === stageId) return;
    const prev = card.stageId;
    setMoveError(null);
    setCards((cs) => cs.map((c) => (c.id === card.id ? { ...c, stageId } : c)));
    const r = await moveBuyer(card.id, stageId);
    if (!r.ok) {
      setCards((cs) => cs.map((c) => (c.id === card.id ? { ...c, stageId: prev } : c)));
      setMoveError(r.error);
    }
  }

  const open = cards.find((c) => c.id === openId) ?? null;

  return <main className={styles.shell}>
    <header className={styles.pageHeader}>
      <div><h1>Buyers</h1></div>
    </header>
    {tabs}

    <div className={styles.toolbar}>
      <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, phone, email, tag" />
      <button type="button" className={styles.iconBtn} onClick={() => startRefresh(() => router.refresh())} disabled={refreshing} aria-label="Reload from GHL" title="Reload from GHL">
        <span className={refreshing ? styles.spin : undefined}><Svg>{I.refresh}</Svg></span>
      </button>
    </div>
    {(error || moveError) && <div className={styles.error}>{error ?? moveError}</div>}

    <div className={styles.board}>
      {stages.map((stage) => {
        const col = shown.filter((c) => c.stageId === stage.id);
        return <section
          key={stage.id}
          className={`${styles.column} ${overStage === stage.id ? styles.columnOver : ""}`}
          onDragOver={(e) => { e.preventDefault(); setOverStage(stage.id); }}
          onDragLeave={() => setOverStage((s) => (s === stage.id ? null : s))}
          onDrop={(e) => {
            e.preventDefault();
            setOverStage(null);
            const card = cards.find((c) => c.id === dragId);
            if (card) void move(card, stage.id);
            setDragId(null);
          }}
        >
          <header className={styles.columnHead}><strong>{stage.name}</strong><span>{col.length}</span></header>
          <div className={styles.cards}>
            {col.map((c) => <button
              type="button"
              key={c.id}
              draggable
              onDragStart={() => setDragId(c.id)}
              onDragEnd={() => { setDragId(null); setOverStage(null); }}
              onClick={() => setOpenId(c.id)}
              className={`${styles.card} ${dragId === c.id ? styles.dragging : ""}`}
            >
              <span className={styles.cardTop}><span className={styles.avatar}>{initials(c.name)}</span><span className={styles.cardWho}><strong>{c.name}</strong>{c.company && <small>{c.company}</small>}</span></span>
              {c.phone && <span className={styles.cardLine}><Svg size={13}>{I.phone}</Svg>{prettyPhone(c.phone)}</span>}
              {c.email && <span className={styles.cardLine}><Svg size={13}>{I.mail}</Svg><span className={styles.ellipsis}>{c.email}</span></span>}
              {c.tags.length > 0 && <span className={styles.cardTags}>{c.tags.slice(0, 3).map((t) => <span key={t}>{t}</span>)}{c.tags.length > 3 && <span>+{c.tags.length - 3}</span>}</span>}
            </button>)}
            {!col.length && <div className={styles.dropHint}>Drop a buyer here</div>}
          </div>
        </section>;
      })}
    </div>

    {open && <BuyerCard
      key={open.id}
      card={open}
      stages={stages}
      fields={fields}
      ghlUrl={`${contactUrl}/${open.contactId}`}
      onClose={() => setOpenId(null)}
      onMove={(stageId) => move(open, stageId)}
      onContact={(patch) => setCards((cs) => cs.map((c) => (c.id === open.id ? { ...c, ...patch } : c)))}
    />}
  </main>;
}

function BuyerCard({
  card, stages, fields, ghlUrl, onClose, onMove, onContact,
}: {
  card: PipelineCard;
  stages: PipelineStage[];
  fields: readonly Field[];
  ghlUrl: string;
  onClose: () => void;
  onMove: (stageId: string) => void;
  onContact: (patch: Partial<PipelineCard>) => void;
}) {
  const [data, setData] = useState<CardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [editContact, setEditContact] = useState(false);
  const [contactForm, setContactForm] = useState({ firstName: "", lastName: "", email: "", phone: "" });
  const [editBox, setEditBox] = useState(false);
  const [boxForm, setBoxForm] = useState<Record<string, string>>({});
  const [tagDraft, setTagDraft] = useState("");
  const [note, setNote] = useState("");
  const closeRef = useRef(onClose);

  useEffect(() => {
    closeRef.current = onClose;
  });

  useEffect(() => {
    let live = true;
    openBuyer(card.contactId).then((r) => {
      if (!live) return;
      if (r.ok) setData(r.data);
      else setError(r.error);
    });
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") closeRef.current(); };
    document.addEventListener("keydown", esc);
    return () => { live = false; document.removeEventListener("keydown", esc); };
  }, [card.contactId]);

  function act(fn: () => Promise<string | null>) {
    setError(null);
    start(async () => {
      const e = await fn();
      if (e) setError(e);
    });
  }

  const c = data?.contact;
  const name = c ? [c.firstName, c.lastName].filter(Boolean).join(" ") || card.name : card.name;
  const filled = fields.filter((f) => data?.buyBox[f.id]);

  return <div className={styles.overlay} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
    <aside className={styles.drawer} role="dialog" aria-label={`${name} contact card`}>
      <header className={styles.drawerHead}>
        <span className={styles.avatarLg}>{initials(name)}</span>
        <div className={styles.drawerWho}><strong>{name}</strong>{card.company && <small>{card.company}</small>}</div>
        <a href={ghlUrl} target="_blank" rel="noreferrer" className={styles.iconBtn} title="Open in GHL" aria-label="Open in GHL"><Svg>{I.ext}</Svg></a>
        <button type="button" className={styles.iconBtn} onClick={onClose} aria-label="Close"><Svg>{I.x}</Svg></button>
      </header>

      <div className={styles.quick}>
        {(c?.phone ?? card.phone) && <a href={`tel:${c?.phone ?? card.phone}`}><Svg size={15}>{I.phone}</Svg>Call</a>}
        {(c?.phone ?? card.phone) && <a href={`sms:${c?.phone ?? card.phone}`}><Svg size={15}>{I.sms}</Svg>Text</a>}
        {(c?.email ?? card.email) && <a href={`mailto:${c?.email ?? card.email}`}><Svg size={15}>{I.mail}</Svg>Email</a>}
      </div>

      <label className={styles.stageSelect}>Stage
        <select value={card.stageId} onChange={(e) => onMove(e.target.value)}>
          {stages.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </label>

      {error && <div className={styles.error}>{error}</div>}
      {!data && !error && <div className={styles.loading}><span /><span /><span /></div>}

      {data && c && <>
        <section className={styles.section}>
          <div className={styles.sectionHead}><span>Contact</span>{!editContact && <button type="button" onClick={() => { setContactForm({ firstName: c.firstName ?? "", lastName: c.lastName ?? "", email: c.email ?? "", phone: c.phone ?? "" }); setEditContact(true); }}>Edit</button>}</div>
          {editContact ? <form className={styles.form} onSubmit={(e) => {
            e.preventDefault();
            act(async () => {
              const r = await saveBuyerContact(c.id, contactForm);
              if (!r.ok) return r.error;
              setData({ ...data, contact: r.data });
              onContact({ name: [r.data.firstName, r.data.lastName].filter(Boolean).join(" ") || card.name, phone: r.data.phone, email: r.data.email });
              setEditContact(false);
              return null;
            });
          }}>
            <div className={styles.two}>
              <label>First name<input value={contactForm.firstName} onChange={(e) => setContactForm({ ...contactForm, firstName: e.target.value })} /></label>
              <label>Last name<input value={contactForm.lastName} onChange={(e) => setContactForm({ ...contactForm, lastName: e.target.value })} /></label>
            </div>
            <label>Phone<input value={contactForm.phone} onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })} /></label>
            <label>Email<input type="email" value={contactForm.email} onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })} /></label>
            <div className={styles.actions}><button type="submit" disabled={pending}>{pending ? "Saving…" : "Save to GHL"}</button><button type="button" onClick={() => setEditContact(false)}>Cancel</button></div>
          </form> : <dl className={styles.fields}>
            <dt>Phone</dt><dd>{c.phone ? <a href={`tel:${c.phone}`}>{prettyPhone(c.phone)}</a> : "—"}</dd>
            <dt>Email</dt><dd>{c.email ? <a href={`mailto:${c.email}`}>{c.email}</a> : "—"}</dd>
            {c.source && <><dt>Source</dt><dd>{c.source}</dd></>}
            {c.dnd && <><dt>DND</dt><dd className={styles.dnd}>Do Not Disturb</dd></>}
          </dl>}
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHead}><span>Buy box</span>{!editBox && <button type="button" onClick={() => { setBoxForm({ ...data.buyBox }); setEditBox(true); }}>Edit</button>}</div>
          {editBox ? <form className={styles.form} onSubmit={(e) => {
            e.preventDefault();
            act(async () => {
              const r = await saveBuyerBox(c.id, boxForm);
              if (!r.ok) return r.error;
              setData({ ...data, buyBox: r.data });
              setEditBox(false);
              return null;
            });
          }}>
            {fields.map((f) => <label key={f.id}>{f.label}<input value={boxForm[f.id] ?? ""} onChange={(e) => setBoxForm({ ...boxForm, [f.id]: e.target.value })} /></label>)}
            <div className={styles.actions}><button type="submit" disabled={pending}>{pending ? "Saving…" : "Save to GHL"}</button><button type="button" onClick={() => setEditBox(false)}>Cancel</button></div>
          </form> : filled.length ? <dl className={styles.fields}>
            {filled.map((f) => <div key={f.id} className={styles.fieldRow}><dt>{f.label}</dt><dd>{data.buyBox[f.id]}</dd></div>)}
          </dl> : <p className={styles.muted}>No buy box saved in GHL yet.</p>}
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHead}><span>Tags</span><small>{c.tags.length}</small></div>
          <div className={styles.tags}>
            {c.tags.map((t) => <span key={t} className={styles.tag}>{t}<button type="button" disabled={pending} aria-label={`Remove tag ${t}`} onClick={() => act(async () => {
              const r = await tagBuyer(c.id, [], [t]);
              if (!r.ok) return r.error;
              setData({ ...data, contact: { ...c, tags: r.data } });
              onContact({ tags: r.data });
              return null;
            })}><Svg size={11}>{I.x}</Svg></button></span>)}
            {!c.tags.length && <span className={styles.muted}>No tags</span>}
          </div>
          <form className={styles.inline} onSubmit={(e) => {
            e.preventDefault();
            if (!tagDraft.trim()) return;
            act(async () => {
              const r = await tagBuyer(c.id, [tagDraft], []);
              if (!r.ok) return r.error;
              setData({ ...data, contact: { ...c, tags: r.data } });
              onContact({ tags: r.data });
              setTagDraft("");
              return null;
            });
          }}>
            <input value={tagDraft} onChange={(e) => setTagDraft(e.target.value)} placeholder="Add a tag" />
            <button type="submit" disabled={pending || !tagDraft.trim()} aria-label="Add tag"><Svg size={14}>{I.plus}</Svg></button>
          </form>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHead}><span>Notes</span><small>{data.notes.length}</small></div>
          <form className={styles.noteForm} onSubmit={(e) => {
            e.preventDefault();
            act(async () => {
              const r = await noteBuyer(c.id, note);
              if (!r.ok) return r.error;
              setData({ ...data, notes: [r.data, ...data.notes] });
              setNote("");
              return null;
            });
          }}>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="Add a note" />
            <button type="submit" disabled={pending || !note.trim()}>{pending ? "Saving…" : "Add note"}</button>
          </form>
          {data.notes.map((n) => <article key={n.id} className={styles.note}><p>{n.body}</p>{n.dateAdded && <small>{when(n.dateAdded)}</small>}</article>)}
        </section>
      </>}
    </aside>
  </div>;
}
