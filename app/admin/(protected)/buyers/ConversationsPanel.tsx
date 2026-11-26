"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { addToPipeline, changeTags, createNote, loadThread, pipelinesFor, saveContact, sendReply, allTags, type ThreadData } from "./inbox-actions";
import type { ContactDeal, Pipeline } from "@/lib/integrations/ghl-api";
import styles from "./inbox.module.css";

type Conversation = {
  id: string;
  contactId: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  tags: string[];
  channel: string;
  body: string;
  at: string;
  lastInbound: string | null;
  unread: number;
  ghlUrl: string;
};

// Pull new replies on open when the last sync is older than this.
const STALE_MS = 3 * 60_000;

function ago(iso: string) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.round(hours / 24);
  return days < 7 ? `${days}d` : new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function clock(iso: string) {
  const d = new Date(iso);
  const today = new Date().toDateString() === d.toDateString();
  return today
    ? d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
    : d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function prettyPhone(value: string | null) {
  const d = value?.replace(/\D/g, "") ?? "";
  const ten = d.length === 11 && d.startsWith("1") ? d.slice(1) : d;
  return ten.length === 10 ? `(${ten.slice(0, 3)}) ${ten.slice(3, 6)}-${ten.slice(6)}` : value;
}

function initials(name: string | null) {
  const parts = (name ?? "?").trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "?") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

const I = {
  back: <path d="m15 18-6-6 6-6" />,
  send: <><path d="M22 2 11 13" /><path d="M22 2 15 22l-4-9-9-4Z" /></>,
  ext: <><path d="M14 4h6v6" /><path d="M20 4 10 14" /><path d="M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5" /></>,
  phone: <path d="M21 16.4v2.9a1.9 1.9 0 0 1-2.1 1.9 18.8 18.8 0 0 1-8.2-2.9 18.5 18.5 0 0 1-5.7-5.7A18.8 18.8 0 0 1 2.1 4.4 1.9 1.9 0 0 1 4 2.3h2.9a1.9 1.9 0 0 1 1.9 1.6c.1.9.4 1.8.7 2.7a1.9 1.9 0 0 1-.4 2L7.8 9.8a15.2 15.2 0 0 0 5.7 5.7l1.2-1.2a1.9 1.9 0 0 1 2-.4c.9.3 1.8.6 2.7.7a1.9 1.9 0 0 1 1.6 1.8Z" />,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3.5 6.5 8.5 6.5 8.5-6.5" /></>,
  x: <path d="M18 6 6 18M6 6l12 12" />,
  plus: <path d="M12 5v14M5 12h14" />,
  refresh: <><path d="M21 12a9 9 0 1 1-2.64-6.36" /><path d="M21 3v6h-6" /></>,
  inbox: <><path d="M3 13h5l1.5 3h5L16 13h5" /><path d="M5.5 5h13L21 13v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-6Z" /></>,
  unread: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3.5 6.5 8.5 6.5 8.5-6.5" /></>,
};

function Svg({ children, size = 16 }: { children: ReactNode; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>;
}

export default function ConversationsPanel({
  tabs,
  conversations,
  configured,
  lastRunAt,
  lastError,
  initialId,
}: {
  tabs: ReactNode;
  conversations: Conversation[];
  configured: boolean;
  lastRunAt: string | null;
  lastError: string | null;
  initialId: string | null;
}) {
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"unread" | "all">("all");
  const [selectedId, setSelectedId] = useState<string | null>(initialId);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const autoSynced = useRef(false);

  const refresh = useCallback(async () => {
    setSyncing(true);
    setSyncError(null);
    try {
      const res = await fetch("/api/admin/conversations/sync", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setSyncError(data.error ?? "Sync failed");
      router.refresh();
    } catch {
      setSyncError("Sync failed");
    } finally {
      setSyncing(false);
    }
  }, [router]);

  useEffect(() => {
    if (!configured || autoSynced.current) return;
    if (lastRunAt && Date.now() - new Date(lastRunAt).getTime() < STALE_MS) return;
    const timer = setTimeout(() => {
      autoSynced.current = true;
      void refresh();
    }, 0);
    return () => clearTimeout(timer);
  }, [configured, lastRunAt, refresh]);

  const unreadOf = useCallback((c: Conversation) => (readIds.has(c.id) ? 0 : c.unread), [readIds]);
  const unreadCount = conversations.filter((c) => unreadOf(c) > 0).length;

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return conversations.filter((c) => {
      if (filter === "unread" && unreadOf(c) === 0) return false;
      if (!q) return true;
      return [c.name, c.phone, c.email, c.body, ...c.tags].some((v) => v?.toLowerCase().includes(q));
    });
  }, [conversations, query, filter, unreadOf]);

  const selected = conversations.find((c) => c.id === selectedId) ?? null;

  function select(c: Conversation) {
    setSelectedId(c.id);
    const url = new URL(window.location.href);
    url.searchParams.set("c", c.id);
    window.history.replaceState(null, "", url);
  }

  return <main className={styles.shell}>
    <header className={styles.pageHeader}>
      <div><h1>Buyers</h1></div>
    </header>
    {tabs}

    <div className={`${styles.inbox} ${selected ? styles.hasSelection : ""}`}>
      <aside className={styles.listPane} aria-label="Conversations">
        <div className={styles.listHead}>
          <strong>Positive replies</strong>
          <button type="button" className={styles.iconBtn} onClick={refresh} disabled={syncing || !configured} title={lastError ?? (lastRunAt ? `Synced ${ago(lastRunAt)} ago` : "Sync")} aria-label="Sync from GHL">
            <span className={syncing ? styles.spin : undefined}><Svg>{I.refresh}</Svg></span>
          </button>
        </div>
        <div className={styles.filters} role="tablist">
          <button type="button" role="tab" aria-selected={filter === "unread"} className={filter === "unread" ? styles.filterOn : undefined} onClick={() => setFilter("unread")}>
            <span className={styles.filterIcon}><Svg size={18}>{I.unread}</Svg>{unreadCount > 0 && <b>{unreadCount}</b>}</span>Unread
          </button>
          <button type="button" role="tab" aria-selected={filter === "all"} className={filter === "all" ? styles.filterOn : undefined} onClick={() => setFilter("all")}>
            <span className={styles.filterIcon}><Svg size={18}>{I.inbox}</Svg></span>All
          </button>
        </div>
        <input className={styles.search} type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, phone, tag, reply" />
        {(syncError || !configured) && <div className={styles.error}>{syncError ?? "GHL_API_TOKEN / GHL_LOCATION_ID not set"}</div>}
        <div className={styles.list}>
          {shown.map((c) => {
            const unread = unreadOf(c) > 0;
            return <button type="button" key={c.id} onClick={() => select(c)} className={`${styles.row} ${c.id === selectedId ? styles.rowOn : ""}`}>
              <span className={styles.avatar}>{initials(c.name)}</span>
              <span className={styles.rowMain}>
                <span className={styles.rowTop}><strong className={unread ? styles.bold : undefined}>{c.name ?? prettyPhone(c.phone) ?? "Unknown"}</strong><small>{ago(c.at)}</small></span>
                <span className={styles.rowBody}>{c.body}</span>
              </span>
              {unread && <span className={styles.badge}>{unreadOf(c)}</span>}
            </button>;
          })}
          {!shown.length && <div className={styles.empty}>{syncing ? "Pulling replies from GHL…" : filter === "unread" ? "No unread replies." : "No positive replies yet."}</div>}
        </div>
      </aside>

      {selected
        ? <Thread key={selected.id} conversation={selected} onBack={() => setSelectedId(null)} onRead={() => setReadIds((s) => new Set(s).add(selected.id))} />
        : <section className={styles.placeholder}><Svg size={28}>{I.inbox}</Svg><span>Select a conversation</span></section>}
    </div>
  </main>;
}

function Thread({ conversation, onBack, onRead }: { conversation: Conversation; onBack: () => void; onRead: () => void }) {
  const [data, setData] = useState<ThreadData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, startSend] = useTransition();
  const [sendError, setSendError] = useState<string | null>(null);
  const bottom = useRef<HTMLDivElement>(null);
  const readRef = useRef(onRead);

  useEffect(() => {
    let live = true;
    loadThread(conversation.id, conversation.contactId, conversation.unread).then((r) => {
      if (!live) return;
      if (r.ok) {
        setData(r.data);
        readRef.current();
      } else setError(r.error);
    });
    return () => { live = false; };
  }, [conversation.id, conversation.contactId, conversation.unread]);

  useEffect(() => { bottom.current?.scrollIntoView({ block: "end" }); }, [data?.messages.length]);

  function send() {
    const text = draft.trim();
    if (!text || !data) return;
    setSendError(null);
    startSend(async () => {
      const r = await sendReply(conversation.contactId, text);
      if (!r.ok) {
        setSendError(r.error);
        return;
      }
      setDraft("");
      setData((d) => d && { ...d, messages: [...d.messages, { id: `local-${Date.now()}`, direction: "outbound", channel: "SMS", body: text, at: new Date().toISOString(), status: "sent" }] });
    });
  }

  const name = data ? [data.contact.firstName, data.contact.lastName].filter(Boolean).join(" ") || conversation.name : conversation.name;
  const canText = Boolean(data?.contact.phone) && !data?.contact.dnd;

  return <>
    <section className={styles.threadPane} aria-label="Conversation">
      <header className={styles.threadHead}>
        <button type="button" className={`${styles.iconBtn} ${styles.backBtn}`} onClick={onBack} aria-label="Back to list"><Svg size={18}>{I.back}</Svg></button>
        <span className={styles.avatar}>{initials(name)}</span>
        <div className={styles.threadWho}><strong>{name ?? "Unknown"}</strong><small>{prettyPhone(data?.contact.phone ?? conversation.phone) ?? data?.contact.email ?? ""}</small></div>
        <a className={styles.ghlLink} href={conversation.ghlUrl} target="_blank" rel="noreferrer">Open in GHL <Svg size={14}>{I.ext}</Svg></a>
      </header>

      <div className={styles.messages}>
        {!data && !error && <div className={styles.loading}>{[0, 1, 2].map((i) => <span key={i} className={i % 2 ? styles.skelOut : styles.skelIn} />)}</div>}
        {error && <div className={styles.error}>{error}</div>}
        {data?.messages.map((m) => <div key={m.id} className={m.direction === "inbound" ? styles.msgIn : styles.msgOut}>
          <div className={styles.bubble}>{m.body}</div>
          <small>{clock(m.at)}{m.channel !== "SMS" ? ` · ${m.channel.toLowerCase()}` : ""}</small>
        </div>)}
        {data && !data.messages.length && <div className={styles.empty}>No SMS or email messages in this conversation.</div>}
        <div ref={bottom} />
      </div>

      <form className={styles.composer} onSubmit={(e) => { e.preventDefault(); send(); }}>
        {sendError && <div className={styles.error}>{sendError}</div>}
        <div className={styles.composeRow}>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder={!data ? "Loading…" : data.contact.dnd ? "Contact is on Do Not Disturb" : canText ? "Text a reply (Enter to send)" : "No phone number on this contact"}
            disabled={!canText || sending}
            rows={2}
          />
          <button type="submit" className={styles.sendBtn} disabled={!canText || sending || !draft.trim()} aria-label="Send SMS"><Svg size={17}>{I.send}</Svg></button>
        </div>
      </form>
    </section>

    {data && <ContactPanel conversationId={conversation.id} data={data} onChange={(contact) => setData((d) => d && { ...d, contact })} onNotes={(notes) => setData((d) => d && { ...d, notes })} ghlUrl={conversation.ghlUrl} />}
  </>;
}

function ContactPanel({
  conversationId, data, onChange, onNotes, ghlUrl,
}: {
  conversationId: string;
  data: ThreadData;
  onChange: (c: ThreadData["contact"]) => void;
  onNotes: (n: ThreadData["notes"]) => void;
  ghlUrl: string;
}) {
  const c = data.contact;
  const blank = { firstName: c.firstName ?? "", lastName: c.lastName ?? "", email: c.email ?? "", phone: c.phone ?? "" };
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(blank);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [tagDraft, setTagDraft] = useState("");
  const [tagOptions, setTagOptions] = useState<string[]>([]);
  const [note, setNote] = useState("");

  useEffect(() => {
    allTags().then((r) => { if (r.ok) setTagOptions(r.data); });
  }, []);

  function act(fn: () => Promise<string | null>) {
    setError(null);
    start(async () => {
      const e = await fn();
      if (e) setError(e);
    });
  }

  const save = () => act(async () => {
    const r = await saveContact(conversationId, c.id, form);
    if (!r.ok) return r.error;
    onChange(r.data);
    setEditing(false);
    return null;
  });

  const tag = (add: string[], remove: string[]) => act(async () => {
    const r = await changeTags(conversationId, c.id, add, remove);
    if (!r.ok) return r.error;
    onChange({ ...c, tags: r.data });
    setTagDraft("");
    return null;
  });

  const addNoteNow = () => act(async () => {
    const r = await createNote(c.id, note);
    if (!r.ok) return r.error;
    onNotes([r.data, ...data.notes]);
    setNote("");
    return null;
  });

  const fullName = [c.firstName, c.lastName].filter(Boolean).join(" ") || "Unknown";

  return <aside className={styles.contactPane} aria-label="Contact details">
    <div className={styles.contactHead}>
      <strong>Contact details</strong>
      <a href={ghlUrl} target="_blank" rel="noreferrer" className={styles.iconBtn} title="Open in GHL" aria-label="Open in GHL"><Svg>{I.ext}</Svg></a>
    </div>
    {error && <div className={styles.error}>{error}</div>}

    <section className={styles.card}>
      <div className={styles.cardHead}><span>Contact</span>{!editing && <button type="button" onClick={() => { setForm(blank); setEditing(true); }}>Edit</button>}</div>
      {editing ? <form className={styles.editForm} onSubmit={(e) => { e.preventDefault(); save(); }}>
        <label>First name<input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} /></label>
        <label>Last name<input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} /></label>
        <label>Email<input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
        <label>Phone<input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label>
        <div className={styles.formActions}>
          <button type="submit" disabled={pending}>{pending ? "Saving…" : "Save to GHL"}</button>
          <button type="button" onClick={() => setEditing(false)}>Cancel</button>
        </div>
      </form> : <dl className={styles.fields}>
        <dt>Name</dt><dd>{fullName}</dd>
        <dt>Phone</dt><dd>{c.phone ? <a href={`tel:${c.phone}`}><Svg size={13}>{I.phone}</Svg>{prettyPhone(c.phone)}</a> : "—"}</dd>
        <dt>Email</dt><dd>{c.email ? <a href={`mailto:${c.email}`}><Svg size={13}>{I.mail}</Svg>{c.email}</a> : "—"}</dd>
        {c.source && <><dt>Source</dt><dd>{c.source}</dd></>}
        {c.dnd && <><dt>DND</dt><dd className={styles.dnd}>Do Not Disturb</dd></>}
      </dl>}
    </section>

    <PipelinePicker contactId={c.id} name={fullName} />

    <section className={styles.card}>
      <div className={styles.cardHead}><span>Tags</span><small>{c.tags.length}</small></div>
      <div className={styles.tags}>
        {c.tags.map((t) => <span key={t} className={styles.tag}>{t}<button type="button" onClick={() => tag([], [t])} disabled={pending} aria-label={`Remove tag ${t}`}><Svg size={11}>{I.x}</Svg></button></span>)}
        {!c.tags.length && <span className={styles.muted}>No tags</span>}
      </div>
      <form className={styles.tagAdd} onSubmit={(e) => { e.preventDefault(); if (tagDraft.trim()) tag([tagDraft], []); }}>
        <input list="ghl-tag-options" value={tagDraft} onChange={(e) => setTagDraft(e.target.value)} placeholder="Add a tag" />
        <datalist id="ghl-tag-options">{tagOptions.filter((t) => !c.tags.includes(t)).map((t) => <option key={t} value={t} />)}</datalist>
        <button type="submit" disabled={pending || !tagDraft.trim()} aria-label="Add tag"><Svg size={14}>{I.plus}</Svg></button>
      </form>
    </section>

    <section className={styles.card}>
      <div className={styles.cardHead}><span>Notes</span><small>{data.notes.length}</small></div>
      <form className={styles.noteAdd} onSubmit={(e) => { e.preventDefault(); addNoteNow(); }}>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note" rows={3} />
        <button type="submit" disabled={pending || !note.trim()}>{pending ? "Saving…" : "Add note"}</button>
      </form>
      <div className={styles.notes}>
        {data.notes.map((n) => <article key={n.id} className={styles.note}><p>{n.body}</p>{n.dateAdded && <small>{clock(n.dateAdded)}</small>}</article>)}
      </div>
    </section>
  </aside>;
}

const DEFAULT_PIPELINE = "Investors";

/** Shows which GHL pipelines the lead is in and adds/moves them to a stage. */
function PipelinePicker({ contactId, name }: { contactId: string; name: string }) {
  const [pipelines, setPipelines] = useState<Pipeline[] | null>(null);
  const [deals, setDeals] = useState<ContactDeal[]>([]);
  const [pipelineId, setPipelineId] = useState("");
  const [stageId, setStageId] = useState("");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let live = true;
    pipelinesFor(contactId).then((r) => {
      if (!live) return;
      if (!r.ok) return setError(r.error);
      setPipelines(r.data.pipelines);
      setDeals(r.data.deals);
      const first = r.data.pipelines.find((p) => p.name === DEFAULT_PIPELINE) ?? r.data.pipelines[0];
      if (first) {
        setPipelineId(first.id);
        const current = r.data.deals.find((d) => d.pipelineId === first.id);
        setStageId(current?.stageId ?? first.stages[0]?.id ?? "");
      }
    });
    return () => { live = false; };
  }, [contactId]);

  const pipeline = pipelines?.find((p) => p.id === pipelineId);
  const existing = deals.find((d) => d.pipelineId === pipelineId);
  const label = (d: ContactDeal) => {
    const p = pipelines?.find((x) => x.id === d.pipelineId);
    return `${p?.name ?? "Pipeline"} · ${p?.stages.find((s) => s.id === d.stageId)?.name ?? "—"}`;
  };

  function choosePipeline(id: string) {
    setPipelineId(id);
    setSaved(false);
    const p = pipelines?.find((x) => x.id === id);
    setStageId(deals.find((d) => d.pipelineId === id)?.stageId ?? p?.stages[0]?.id ?? "");
  }

  function submit() {
    setError(null);
    setSaved(false);
    start(async () => {
      const r = await addToPipeline(contactId, name, pipelineId, stageId);
      if (!r.ok) return setError(r.error);
      setDeals(r.data);
      setSaved(true);
    });
  }

  return <section className={styles.card}>
    <div className={styles.cardHead}><span>Pipeline</span></div>
    {error && <div className={styles.error}>{error}</div>}
    {!pipelines && !error && <span className={styles.muted}>Loading…</span>}
    {pipelines && <>
      <div className={styles.tags}>
        {deals.length ? deals.map((d) => <span key={d.id} className={styles.tag} style={{ paddingRight: 9 }}>{label(d)}</span>) : <span className={styles.muted}>Not in a pipeline yet</span>}
      </div>
      <div className={styles.pipeRow}>
        <select value={pipelineId} onChange={(e) => choosePipeline(e.target.value)} aria-label="Pipeline">
          {pipelines.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select value={stageId} onChange={(e) => { setStageId(e.target.value); setSaved(false); }} aria-label="Stage">
          {pipeline?.stages.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>
      <div className={styles.formActions}>
        <button type="button" onClick={submit} disabled={pending || !stageId || (existing?.stageId === stageId && existing.status === "open")}>
          {pending ? "Saving…" : existing ? "Move to stage" : `Add to ${pipeline?.name ?? "pipeline"}`}
        </button>
        {saved && <span className={styles.muted}>Saved in GHL</span>}
      </div>
    </>}
  </section>;
}
