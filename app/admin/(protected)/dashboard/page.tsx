import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { customObject, deriveStage, STAGE_LABELS, VALID_STAGES, type PipelineStage } from "../offers/pipeline";
import styles from "./dashboard.module.css";

export const metadata: Metadata = { title: "Dashboard | Highlander REI" };

export default async function DashboardPage() {
  await requireAdmin();

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [agreements, newLeadsThisWeek, recentLeads] = await Promise.all([
    prisma.agreement.findMany({
      where: { status: { not: "void" }, type: { not: "listing" } },
      orderBy: { updatedAt: "desc" },
      include: { signers: { select: { signedAt: true } } },
    }),
    prisma.lead.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.lead.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
  ]);

  const stageCounts: Record<PipelineStage, number> = {
    offer_made: 0,
    accepted: 0,
    signed: 0,
    closed: 0,
    referral: 0,
  };

  for (const agreement of agreements) {
    const customFields = customObject(agreement.customFields);
    const stage = deriveStage(
      agreement.status,
      agreement.closingDate,
      customFields,
      agreement.signers.some((s) => !!s.signedAt)
    );
    stageCounts[stage] += 1;
  }

  const recentOffers = agreements.slice(0, 5);

  return (
    <main className={styles.shell}>
      <header className={styles.header}>
        <h1>Dashboard</h1>
        <p>Pipeline snapshot &amp; recent activity</p>
      </header>

      <div className={styles.content}>
        <div className={styles.statGrid}>
          {VALID_STAGES.map((stage) => (
            <div key={stage} className={styles.statCard}>
              <div className={styles.statValue}>{stageCounts[stage]}</div>
              <div className={styles.statLabel}>{STAGE_LABELS[stage]}</div>
            </div>
          ))}
        </div>

        <div className={styles.wideCard}>
          <div className={styles.statValue}>{newLeadsThisWeek}</div>
          <div className={styles.statLabel}>New Leads This Week</div>
        </div>

        <div className={styles.grid2}>
          <div className={styles.panel}>
            <h2 className={styles.panelTitle}>Recent Offers</h2>
            {recentOffers.length === 0 ? (
              <p className={styles.empty}>No offers yet.</p>
            ) : (
              <div className={styles.list}>
                {recentOffers.map((offer) => (
                  <div key={offer.id} className={styles.listRow}>
                    <Link href={`/admin/agreements/${offer.id}`}>{offer.address}</Link>
                    <span className={styles.listMeta}>
                      {STAGE_LABELS[
                        deriveStage(
                          offer.status,
                          offer.closingDate,
                          customObject(offer.customFields),
                          offer.signers.some((s) => !!s.signedAt)
                        )
                      ]}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <div style={{ marginTop: 12 }}>
              <Link href="/admin/offers" style={{ fontSize: 11, fontWeight: 700, color: "#111110" }}>
                View full pipeline →
              </Link>
            </div>
          </div>

          <div className={styles.panel}>
            <h2 className={styles.panelTitle}>Recent Leads</h2>
            {recentLeads.length === 0 ? (
              <p className={styles.empty}>No leads yet.</p>
            ) : (
              <div className={styles.list}>
                {recentLeads.map((lead) => (
                  <div key={lead.id} className={styles.listRow}>
                    <span style={{ fontWeight: 700 }}>{lead.name}</span>
                    <span className={styles.listMeta}>
                      {lead.createdAt.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
