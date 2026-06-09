import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { Agreement } from "@prisma/client";

const styles = StyleSheet.create({
  page:       { padding: "48px 52px", fontFamily: "Helvetica", fontSize: 10, color: "#111110", backgroundColor: "#ffffff" },
  header:     { marginBottom: 28, borderBottomWidth: 2, borderBottomColor: "#111110", paddingBottom: 14 },
  logoText:   { fontSize: 22, fontWeight: 700, letterSpacing: 3, color: "#111110", marginBottom: 2 },
  subText:    { fontSize: 8, color: "#888", letterSpacing: 1, textTransform: "uppercase" },
  typeRow:    { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 24 },
  typeTitle:  { fontSize: 18, fontWeight: 700, letterSpacing: 2, color: "#111110", textTransform: "uppercase" },
  statusBadge:{ fontSize: 9, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "#3a7a50", borderWidth: 1, borderColor: "#b8dfc8", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  section:    { marginBottom: 20 },
  sectionHead:{ fontSize: 9, fontWeight: 700, letterSpacing: 1.5, color: "#888", textTransform: "uppercase", marginBottom: 10, borderBottomWidth: 1, borderBottomColor: "#e8e7e2", paddingBottom: 5 },
  row:        { flexDirection: "row", marginBottom: 7 },
  fieldLabel: { fontSize: 9, color: "#888", width: 160, flexShrink: 0, letterSpacing: 0.5 },
  fieldValue: { fontSize: 10, color: "#111110", flex: 1, fontWeight: 500 },
  notes:      { fontSize: 10, color: "#555", lineHeight: 1.6, backgroundColor: "#f5f4f0", padding: 10, borderRadius: 4 },
  footer:     { position: "absolute", bottom: 36, left: 52, right: 52, borderTopWidth: 1, borderTopColor: "#e8e7e2", paddingTop: 10, flexDirection: "row", justifyContent: "space-between" },
  footerText: { fontSize: 8, color: "#aaa" },
  sigRow:     { flexDirection: "row", gap: 24, marginTop: 32 },
  sigBox:     { flex: 1, borderTopWidth: 1, borderTopColor: "#111110", paddingTop: 6 },
  sigLabel:   { fontSize: 8, color: "#888", letterSpacing: 0.5 },
});

const TYPE_LABELS: Record<string, string> = {
  cash_offer:   "Cash Offer",
  flex_equity:  "Flex Equity Program",
  listing:      "Listing Agreement",
  aif_novation: "AIF / Novation Agreement",
};

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <View style={styles.row}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value}</Text>
    </View>
  );
}

export default function AgreementPDF({ a }: { a: Agreement }) {
  const date = new Date(a.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  return (
    <Document title={`${TYPE_LABELS[a.type] ?? a.type} — ${a.address}`}>
      <Page size="LETTER" style={styles.page}>

        <View style={styles.header}>
          <Text style={styles.logoText}>HIGHLANDER REI</Text>
          <Text style={styles.subText}>Agreement Data Sheet · Internal Use</Text>
        </View>

        <View style={styles.typeRow}>
          <Text style={styles.typeTitle}>{TYPE_LABELS[a.type] ?? a.type}</Text>
          <Text style={styles.statusBadge}>{a.status.toUpperCase()}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHead}>Property &amp; Parties</Text>
          <Field label="Property Address" value={a.address} />
          <Field label="Seller(s)" value={a.sellers} />
        </View>

        {(a.type === "cash_offer" || a.type === "flex_equity") && (
          <View style={styles.section}>
            <Text style={styles.sectionHead}>{a.type === "cash_offer" ? "Offer Details" : "Equity Terms"}</Text>
            <Field label="Company Buyer" value={a.companyBuyer} />
            <Field label="Offer Price" value={a.offerPrice} />
            {a.type === "cash_offer" && <Field label="Earnest Money" value={a.earnestMoney} />}
            <Field label="Closing Date" value={a.closingDate} />
            {a.type === "flex_equity" && (
              <>
                <Field label="Equity Percentage" value={a.equityPct} />
                <Field label="Term Length" value={a.termLength} />
              </>
            )}
          </View>
        )}

        {a.type === "listing" && (
          <View style={styles.section}>
            <Text style={styles.sectionHead}>Listing Details</Text>
            <Field label="Agent Name" value={a.agentName} />
            <Field label="Brokerage" value={a.brokerageName} />
            <Field label="Agent Email" value={a.agentEmail} />
            <Field label="Agent Phone" value={a.agentPhone} />
            <Field label="License #" value={a.agentLicense} />
            <Field label="List Price" value={a.listPrice} />
            <Field label="Agency Relationship" value={a.agencyRelationship} />
            <Field label="Broker Compensation" value={a.brokerComp} />
            <Field label="Listing Period" value={a.listingStart && a.listingEnd ? `${a.listingStart} – ${a.listingEnd}` : (a.listingStart ?? a.listingEnd)} />
          </View>
        )}

        {a.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionHead}>Notes</Text>
            <Text style={styles.notes}>{a.notes}</Text>
          </View>
        )}

        <View style={styles.sigRow}>
          <View style={styles.sigBox}><Text style={styles.sigLabel}>Seller Signature &amp; Date</Text></View>
          <View style={styles.sigBox}><Text style={styles.sigLabel}>Seller Signature &amp; Date</Text></View>
          <View style={styles.sigBox}><Text style={styles.sigLabel}>Buyer / Agent Signature &amp; Date</Text></View>
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>Highlander REI · Agreement Data Sheet</Text>
          <Text style={styles.footerText}>Prepared {date} · ID {a.id.slice(-8).toUpperCase()}</Text>
        </View>

      </Page>
    </Document>
  );
}
