import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/session";
import { loadMlsOfferPrefill } from "@/lib/offers/load-mls-offer";
import { defaultOfferTerms, TD_TEMPLATE } from "@/lib/offers/transaction-desk";
import { saveMlsOffer } from "./actions";
import styles from "../offers.module.css";

export const metadata: Metadata = { title: "Submit an Offer | Highlander REI" };

const money = (v: number | null) => (v == null ? "—" : v.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }));

function Field({ label, name, defaultValue, type = "text", required, placeholder, hint }: { label: string; name: string; defaultValue?: string | number | null; type?: string; required?: boolean; placeholder?: string; hint?: string }) {
  return <label className={styles.offerField}>
    <span>{label}{required ? " *" : ""}</span>
    <input name={name} type={type} defaultValue={defaultValue ?? ""} required={required} placeholder={placeholder} inputMode={type === "text" && /price|money|cost/i.test(name) ? "decimal" : undefined} />
    {hint && <small>{hint}</small>}
  </label>;
}

export default async function NewMlsOfferPage({ searchParams }: { searchParams: Promise<{ mls?: string; saved?: string; error?: string }> }) {
  await requireAdmin();
  const { mls, saved, error } = await searchParams;
  const mlsNumber = mls?.trim() ?? "";
  const listing = mlsNumber ? await loadMlsOfferPrefill(mlsNumber) : null;
  const d = defaultOfferTerms();

  return (
    <main className={styles.shell}>
      <header className={styles.header}>
        <div>
          <h1>Submit an Offer</h1>
          <p>{TD_TEMPLATE} · Transaction Desk</p>
        </div>
        <Link className={styles.newOffer} href="/admin/offers">Pipeline</Link>
      </header>

      <div className={styles.offerPage}>
        <form action="/admin/offers/new" className={styles.offerLookup}>
          <label className={styles.offerField}><span>MLS #</span><input name="mls" defaultValue={mlsNumber} placeholder="7050463" inputMode="numeric" /></label>
          <button type="submit" className={styles.offerSecondary}>Load listing</button>
        </form>

        {saved && <div className={styles.offerSaved}>
          Offer saved for {listing?.streetAddress ?? `MLS ${mlsNumber}`}. Ask Claude: <strong>“Enter the offer for MLS {mlsNumber} in Transaction Desk.”</strong> It fills the contract and stops before signing or sending.
        </div>}
        {error === "price" && <div className={styles.offerError}>Enter an offer price.</div>}
        {mlsNumber && !listing && <div className={styles.offerError}>MLS {mlsNumber} isn&apos;t in the synced ARMLS data.</div>}

        {listing && <form action={saveMlsOffer} className={styles.offerForm}>
          <input type="hidden" name="mlsNumber" value={listing.mlsNumber} />
          <section className={styles.offerCard}>
            <h2>{listing.streetAddress}</h2>
            <p className={styles.offerMeta}>MLS {listing.mlsNumber} · {listing.status ?? "—"} · List {money(listing.listPrice)} · ARV {money(listing.arv)}{listing.arvRangePct ? ` ±${listing.arvRangePct}%` : ""} · Clean as-is {money(listing.asIs)}{listing.conservativeArv ? ` · 70–75%: ${money(listing.conservativeArv * 0.7)}–${money(listing.conservativeArv * 0.75)}` : ""}</p>
            <div className={styles.offerGrid}>
              <Field label="Street address" name="streetAddress" defaultValue={listing.streetAddress} required />
              <Field label="City" name="city" defaultValue={listing.city} required />
              <Field label="County" name="county" defaultValue={listing.county} />
              <Field label="ZIP" name="zip" defaultValue={listing.zip} required />
              <Field label="Seller name(s)" name="sellers" placeholder="Leave blank if unknown" />
              <Field label="APN" name="apn" placeholder="Leave blank if unknown" />
            </div>
          </section>

          <section className={styles.offerCard}>
            <h2>Terms</h2>
            <div className={styles.offerGrid}>
              <Field label="Offer price" name="price" required placeholder="310,000" />
              <Field label="Earnest money" name="earnestMoney" defaultValue={d.earnestMoney} />
              <Field label="Close of escrow" name="closeOfEscrow" type="date" defaultValue={d.closeOfEscrow} required />
              <Field label="Inspection period (days)" name="inspectionDays" type="number" defaultValue={d.inspectionDays} />
              <Field label="Offer expires" name="offerExpiresDate" type="date" defaultValue={d.offerExpiresDate} required />
              <Field label="Expiration time" name="offerExpiresTime" defaultValue={d.offerExpiresTime} />
              <label className={styles.offerField}><span>Possession</span>
                <select name="possession" defaultValue={d.possession}><option value="close_of_escrow">At close of escrow</option><option value="other">Other (see notes)</option></select>
              </label>
              <fieldset className={styles.offerChecks}><legend>Personal property included</legend>
                {(["refrigerator", "washer", "dryer"] as const).map((p) => <label key={p}><input type="checkbox" name={`pp_${p}`} />{p[0].toUpperCase() + p.slice(1)}</label>)}
              </fieldset>
            </div>
          </section>

          <section className={styles.offerCard}>
            <h2>Title / escrow</h2>
            <div className={styles.offerGrid}>
              <Field label="Title company" name="titleCompany" />
              <Field label="Escrow officer" name="titleOfficer" />
              <Field label="Phone" name="titlePhone" />
              <Field label="Email" name="titleEmail" type="email" />
            </div>
          </section>

          <section className={styles.offerCard}>
            <h2>Home warranty &amp; compensation</h2>
            <div className={styles.offerGrid}>
              <Field label="Home warranty cost" name="warrantyCost" placeholder="Blank = none" />
              <label className={styles.offerField}><span>Warranty paid by</span>
                <select name="warrantyPaidBy" defaultValue="seller"><option value="seller">Seller</option><option value="buyer">Buyer</option></select>
              </label>
              <Field label="Seller compensation" name="sellerComp" placeholder="e.g. 2.5% or $7,500" hint="Seller Compensation Addendum" />
            </div>
          </section>

          <section className={styles.offerCard}>
            <h2>Listing agent</h2>
            <div className={styles.offerGrid}>
              <Field label="Agent" name="listAgent" defaultValue={listing.listAgent} />
              <Field label="Brokerage" name="listOffice" defaultValue={listing.listOffice} />
              <Field label="Phone" name="listAgentPhone" defaultValue={listing.listAgentPhone} />
              <Field label="Email" name="listAgentEmail" type="email" defaultValue={listing.listAgentEmail} />
            </div>
            <label className={`${styles.offerField} ${styles.offerNotes}`}><span>Notes for this offer</span><textarea name="notes" rows={3} /></label>
          </section>

          <button type="submit" className={styles.newOffer}>Save offer</button>
        </form>}
      </div>
    </main>
  );
}
