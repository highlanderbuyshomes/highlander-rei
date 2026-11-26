"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import styles from "./buyers.module.css";

type Conversation = {
  id: string;
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
  return days < 30 ? `${days}d` : new Date(iso).toLocaleDateString();
}

function phone(value: string | null) {
  const d = value?.replace(/\D/g, "") ?? "";
  const ten = d.length === 11 && d.startsWith("1") ? d.slice(1) : d;
  return ten.length === 10 ? `(${ten.slice(0, 3)}) ${ten.slice(3, 6)}-${ten.slice(6)}` : value;
}

export default function ConversationsPanel({
  tabs,
  conversations,
  configured,
  lastRunAt,
  lastError,
}: {
  tabs: ReactNode;
  conversations: Conversation[];
  configured: boolean;
  lastRunAt: string | null;
  lastError: string | null;
}) {
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const autoSynced = useRef(false);

  const refresh = useCallback(async () => {
    setSyncing(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/conversations/sync", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setError(data.error ?? "Sync failed");
      router.refresh();
    } catch {
      setError("Sync failed");
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

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((c) =>
      [c.name, c.phone, c.email, c.body, ...c.tags].some((v) => v?.toLowerCase().includes(q)),
    );
  }, [conversations, query]);

  return <main className={styles.shell}>
    <header className={styles.pageHeader}>
      <div><span>Disposition Network</span><h1>Our Buyers</h1></div>
      <div className={styles.metrics}><div><strong>{conversations.length}</strong><span>Positive replies</span></div><div><strong>{conversations.filter((c) => c.unread > 0).length}</strong><span>Unread</span></div></div>
    </header>
    {tabs}

    <section className={styles.convoPanel} aria-label="Positive conversations">
      <div className={styles.convoToolbar}>
        <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, phone, tag, reply" />
        <span className={styles.convoSynced} title={lastError ?? undefined}>
          {syncing ? "Syncing…" : lastRunAt ? (ago(lastRunAt) === "now" ? "Synced just now" : `Synced ${ago(lastRunAt)} ago`) : "Not synced"}
        </span>
        <button type="button" onClick={refresh} disabled={syncing || !configured}>{syncing ? "Syncing…" : "Refresh"}</button>
      </div>
      {(error || (!configured && "GHL_API_TOKEN / GHL_LOCATION_ID not set")) && <div className={styles.convoError}>{error ?? "GHL_API_TOKEN / GHL_LOCATION_ID not set"}</div>}

      <div className={styles.convoList}>
        {shown.map((c) => <a key={c.id} className={styles.convoRow} href={c.ghlUrl} target="_blank" rel="noreferrer" title="Open contact in GHL">
          <span className={styles.avatarSm}>{(c.name ?? "?").trim().charAt(0).toUpperCase()}</span>
          <span className={styles.convoWho}>
            <strong>{c.name ?? "Unknown"}{c.unread > 0 && <i className={styles.unreadDot} aria-label="Unread" />}</strong>
            <small>{phone(c.phone) ?? c.email ?? ""}</small>
          </span>
          <span className={styles.convoBody}>
            <span>&ldquo;{c.body}&rdquo;</span>
            {c.lastInbound && <small>Latest: {c.lastInbound}</small>}
            {c.tags.length > 0 && <span className={styles.criteria}>{c.tags.slice(0, 5).map((t) => <span key={t}>{t}</span>)}</span>}
          </span>
          <span className={styles.convoMeta}><span className={styles.boxCount}>{c.channel}</span><small>{ago(c.at)}</small><span className={styles.convoOpen}>GHL ↗</span></span>
        </a>)}
        {!shown.length && <div className={styles.emptyBox}>{syncing ? "Pulling replies from GHL…" : "No positive replies yet."}</div>}
      </div>
    </section>
  </main>;
}
