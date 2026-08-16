import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import OfferPipelineBoard, { type PipelineOffer } from "./OfferPipelineBoard";
import { customObject, deriveStage, numericPrice } from "./pipeline";
import styles from "./offers.module.css";

export const metadata: Metadata = { title: "Offers | Highlander REI" };

export default async function OffersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireAdmin();
  const { q } = await searchParams;
  const query = q?.trim();
  const agreements = await prisma.agreement.findMany({
    where: {
      status: { not: "void" },
      type: { not: "listing" },
      ...(query ? { OR: [
        { address: { contains: query, mode: "insensitive" } },
        { sellers: { contains: query, mode: "insensitive" } },
      ] } : {}),
    },
    orderBy: { updatedAt: "desc" },
    include: {
      signers: {
        orderBy: { order: "asc" },
        include: { contact: { select: { phone: true, email: true } } },
      },
    },
  });

  const offers: PipelineOffer[] = agreements.map((agreement) => {
    const customFields = customObject(agreement.customFields);
    const firstSigner = agreement.signers[0];
    return {
      id: agreement.id,
      address: agreement.address,
      seller: agreement.sellers || firstSigner?.name || "Seller",
      email: firstSigner?.contact?.email || firstSigner?.email || agreement.signerEmail || "",
      phone: firstSigner?.contact?.phone || "",
      type: agreement.type,
      status: agreement.status,
      offerPrice: agreement.offerPrice || "",
      offerValue: numericPrice(agreement.offerPrice),
      closingDate: agreement.closingDate || "",
      updatedAt: agreement.updatedAt.toISOString(),
      stage: deriveStage(agreement.status, agreement.closingDate, customFields, agreement.signers.some((signer) => !!signer.signedAt)),
      followUpAt: typeof customFields.offerFollowUpAt === "string" ? customFields.offerFollowUpAt : "",
      followUpNote: typeof customFields.offerFollowUpNote === "string" ? customFields.offerFollowUpNote : "",
    };
  });

  return (
    <main className={styles.shell}>
      <header className={styles.header}>
        <div>
          <h1>Offers</h1>
          <p>Offer pipeline &amp; seller follow-up</p>
        </div>
        <Link className={styles.newOffer} href="/admin/agreements/new"><span>+</span> New offer</Link>
      </header>

      <nav className={styles.tabs} aria-label="Offers sections">
        <span className={styles.activeTab}>Pipeline</span>
        <Link href="/admin/agreements">Agreements</Link>
        <Link href="/admin/offers/inventory">Inventory &amp; Imports</Link>
      </nav>

      <section className={styles.toolbar}>
        <div className={styles.pipelineSelect}>
          <span className={styles.pipelineDot} />
          Seller Offers
          <svg viewBox="0 0 20 20" aria-hidden="true"><path d="m6 8 4 4 4-4" /></svg>
        </div>
        <span className={styles.countBadge}>{offers.length} {offers.length === 1 ? "opportunity" : "opportunities"}</span>
        <form className={styles.search} action="/admin/offers">
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>
          <input name="q" defaultValue={query} placeholder="Search offers, sellers, addresses" aria-label="Search offers" />
        </form>
      </section>

      <OfferPipelineBoard offers={offers} />
    </main>
  );
}
