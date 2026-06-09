/* eslint-disable react/no-unescaped-entities */
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

export type ListingAgreementPDFProps = {
  agreementDate: string;
  seller1Name: string;
  seller2Name?: string;
  address: string;
  listPrice: string;
  listingStart: string;
  listingEnd: string;
  agentName?: string;
  brokerageName?: string;
  brokerComp?: string;
  agencyRelationship?: string;
};

const GOLD = "#B8962E";
const DARK = "#111110";

const s = StyleSheet.create({
  page: {
    paddingTop: 76, paddingBottom: 54, paddingHorizontal: 58,
    fontFamily: "Helvetica", fontSize: 9.5, color: "#111", lineHeight: 1.58,
  },
  fixedHeader: { position: "absolute", top: 22, left: 58, right: 58 },
  brandRow: { flexDirection: "row", alignItems: "flex-end", marginBottom: 1 },
  brandMain: { fontFamily: "Helvetica-Bold", fontSize: 13, letterSpacing: 3.5, color: DARK },
  brandDot: { fontFamily: "Helvetica-Bold", fontSize: 13, color: GOLD },
  brandSub: { fontSize: 7, letterSpacing: 2, color: "#666", textTransform: "uppercase", marginBottom: 4 },
  brandLine: { borderBottomWidth: 1.5, borderBottomColor: GOLD },
  fixedFooter: {
    position: "absolute", bottom: 18, left: 58, right: 58,
    borderTopWidth: 0.5, borderTopColor: "#ddd", paddingTop: 5,
    flexDirection: "row", justifyContent: "space-between",
  },
  footerText: { fontSize: 7.5, color: "#888" },
  docTitle: {
    fontFamily: "Helvetica-Bold", fontSize: 14, letterSpacing: 4,
    textAlign: "center", marginBottom: 4,
  },
  docSubtitle: {
    fontSize: 9, textAlign: "center", color: "#555", marginBottom: 16, letterSpacing: 1,
  },
  introLine: { marginBottom: 10, fontSize: 9.5 },
  ptWrap: { marginBottom: 8 },
  ptHeader: { backgroundColor: DARK, paddingVertical: 4, paddingHorizontal: 8 },
  ptHeaderText: { color: "#fff", fontSize: 7.5, letterSpacing: 2, fontFamily: "Helvetica-Bold" },
  ptBody: { flexDirection: "row", borderWidth: 1, borderTopWidth: 0, borderColor: "#bbb" },
  ptLabel: { width: 80, borderRightWidth: 1, borderRightColor: "#bbb", paddingVertical: 7, paddingHorizontal: 8 },
  ptLabelText: { fontSize: 7, fontFamily: "Helvetica-Bold", letterSpacing: 0.5, textTransform: "uppercase", lineHeight: 1.4 },
  ptValue: { flex: 1, paddingVertical: 7, paddingHorizontal: 8 },
  secHead: {
    fontFamily: "Helvetica-Bold", fontSize: 8.5, letterSpacing: 2.5, textTransform: "uppercase",
    marginTop: 13, marginBottom: 7, paddingBottom: 4, borderBottomWidth: 1, borderBottomColor: GOLD,
  },
  pdTable: { borderWidth: 1, borderColor: "#bbb", marginTop: 2 },
  pdRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#bbb" },
  pdRowLast: { flexDirection: "row" },
  pdLabel: { width: 100, borderRightWidth: 1, borderRightColor: "#bbb", paddingVertical: 6, paddingHorizontal: 8 },
  pdLabelText: { fontSize: 7, fontFamily: "Helvetica-Bold", letterSpacing: 0.5, textTransform: "uppercase", lineHeight: 1.4 },
  pdValue: { flex: 1, paddingVertical: 6, paddingHorizontal: 8, fontSize: 9.5 },
  para: { marginBottom: 8, fontSize: 9.5 },
  bold: { fontFamily: "Helvetica-Bold" },
  sigPairRow: { flexDirection: "row", marginBottom: 38 },
  sigBoxL: { flex: 1, marginRight: 36 },
  sigBoxR: { flex: 1 },
  sigLine: { borderBottomWidth: 1, borderBottomColor: "#111", marginBottom: 5 },
  sigLabel: { fontSize: 7.5, fontFamily: "Helvetica-Bold", letterSpacing: 1.5, textTransform: "uppercase", color: "#333" },
  sigDate: { fontSize: 7.5, color: "#888", marginTop: 3 },
});

function Header() {
  return (
    <View style={s.fixedHeader} fixed>
      <View style={s.brandRow}>
        <Text style={s.brandMain}>HIGHLANDER REI</Text>
        <Text style={s.brandDot}>.</Text>
      </View>
      <Text style={s.brandSub}>Real Estate Investment · Phoenix, AZ · Dallas, TX</Text>
      <View style={s.brandLine} />
    </View>
  );
}

function Footer() {
  return (
    <View style={s.fixedFooter} fixed>
      <Text style={s.footerText}>Highlander REI LLC · highlanderrei.com · Phoenix, AZ · Dallas, TX</Text>
      <Text style={s.footerText} render={({ pageNumber }) => `Page ${pageNumber}`} />
    </View>
  );
}

function PartyBox({ title, value }: { title: string; value: string }) {
  return (
    <View style={s.ptWrap}>
      <View style={s.ptHeader}><Text style={s.ptHeaderText}>{title}</Text></View>
      <View style={s.ptBody}>
        <View style={s.ptLabel}><Text style={s.ptLabelText}>{"Full Legal\nName"}</Text></View>
        <View style={s.ptValue}><Text>{value}</Text></View>
      </View>
    </View>
  );
}

function PRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={last ? s.pdRowLast : s.pdRow}>
      <View style={s.pdLabel}><Text style={s.pdLabelText}>{label}</Text></View>
      <View style={s.pdValue}><Text>{value}</Text></View>
    </View>
  );
}

function Sec({ children }: { children: string }) {
  return <Text style={s.secHead}>{children}</Text>;
}

function P({ bold, children }: { bold?: string; children: string }) {
  return (
    <Text style={s.para}>
      {bold ? <Text style={s.bold}>{bold} </Text> : null}
      {children}
    </Text>
  );
}

export default function ListingAgreementPDF(props: ListingAgreementPDFProps) {
  const {
    agreementDate, seller1Name, seller2Name, address,
    listPrice, listingStart, listingEnd,
    agentName, brokerageName, brokerComp, agencyRelationship,
  } = props;

  return (
    <Document title={`Listing Agreement — ${address}`}>
      <Page size="LETTER" style={s.page}>
        <Header />
        <Footer />

        <Text style={s.docTitle}>EXCLUSIVE RIGHT TO SELL LISTING AGREEMENT</Text>
        <Text style={s.docSubtitle}>Real Estate Listing Agreement</Text>

        <Text style={s.introLine}>
          <Text style={s.bold}>THIS AGREEMENT</Text> is entered into on {agreementDate}, by and between the Seller(s) identified below (hereinafter "Seller") and Highlander REI LLC (hereinafter "Broker/Agent").
        </Text>

        <PartyBox title="SELLER 1" value={seller1Name} />
        {seller2Name ? <PartyBox title="SELLER 2" value={seller2Name} /> : null}
        <PartyBox title="BROKER / AGENT — HIGHLANDER REI LLC" value={agentName ? `${agentName} — ${brokerageName ?? "Highlander REI LLC"}` : "Highlander REI LLC"} />

        <Sec>PROPERTY</Sec>
        <View style={s.pdTable}>
          <PRow label="ADDRESS" value={address} />
          <PRow label="LISTING\nPRICE" value={listPrice} />
          <PRow label="LISTING\nSTART" value={listingStart} />
          <PRow label="LISTING\nEND" value={listingEnd} last />
        </View>

        <Sec>LISTING TERMS</Sec>

        <P bold="EXCLUSIVE RIGHT TO SELL |">
          Seller hereby grants Broker the exclusive and irrevocable right to sell the above-described property during the listing period at the price and terms stated herein or at any other price or terms acceptable to Seller.
        </P>

        <P bold="COMPENSATION |">
          {`Seller agrees to pay Broker a commission of ${brokerComp ?? "to be agreed upon"} of the gross sales price upon the sale of the property, or any portion thereof, during the listing period or within 90 days after the expiration of this Agreement if the property is sold to a buyer introduced by Broker during the listing period.`}
        </P>

        <P bold="AGENCY RELATIONSHIP |">
          {`Broker represents Seller as ${agencyRelationship ?? "Seller's Agent"} in this transaction. Broker's duties include reasonable efforts to achieve the price and terms specified in this Agreement.`}
        </P>

        <P bold="SELLER'S OBLIGATIONS |">
          Seller agrees to: (a) refer to Broker all inquiries regarding the sale of the property; (b) cooperate with Broker in all reasonable respects; (c) provide accurate information about the property; (d) maintain the property in good condition during the listing period.
        </P>

        <P bold="MARKETING |">
          Broker is authorized to place the property on the Multiple Listing Service (MLS), advertise the property through various media, place a "For Sale" sign on the property, and otherwise market the property at Broker's discretion.
        </P>

        <P bold="INDEMNIFICATION |">
          Seller agrees to indemnify and hold harmless Broker, its agents, and employees from any claims, losses, damages, or expenses arising from inaccurate information provided by Seller or from Seller's failure to disclose material facts about the property.
        </P>
      </Page>

      {/* Signature Page */}
      <Page size="LETTER" style={s.page}>
        <Header />
        <Footer />

        <Sec>ADDITIONAL TERMS</Sec>
        <P bold="DISCLOSURE |">
          Seller acknowledges that Broker may represent other buyers or sellers in other transactions. Seller has been advised of and understands Broker's agency relationship in this transaction.
        </P>
        <P bold="ENTIRE AGREEMENT |">
          This Agreement constitutes the entire agreement between the parties and supersedes all prior negotiations, representations, warranties, and understandings. This Agreement may not be modified except in writing signed by both parties.
        </P>
        <P bold="GOVERNING LAW |">
          This Agreement shall be governed by and construed in accordance with the laws of the state in which the property is located.
        </P>

        <Sec>SIGNATURES</Sec>
        <Text style={{ fontSize: 8.5, color: "#555", marginBottom: 22 }}>
          By signing below, the parties acknowledge they have read, understand, and agree to the terms of this Listing Agreement.
        </Text>

        <View style={s.sigPairRow}>
          <View style={s.sigBoxL}>
            <View style={s.sigLine}><Text> </Text></View>
            <Text style={s.sigLabel}>Seller 1 Signature</Text>
            <Text style={s.sigDate}>Date: _______________</Text>
          </View>
          <View style={s.sigBoxR}>
            <View style={s.sigLine}><Text> </Text></View>
            <Text style={s.sigLabel}>Broker / Agent Signature</Text>
            <Text style={s.sigDate}>Date: _______________</Text>
          </View>
        </View>

        {seller2Name ? (
          <View style={s.sigPairRow}>
            <View style={s.sigBoxL}>
              <View style={s.sigLine}><Text> </Text></View>
              <Text style={s.sigLabel}>Seller 2 Signature</Text>
              <Text style={s.sigDate}>Date: _______________</Text>
            </View>
            <View style={s.sigBoxR} />
          </View>
        ) : null}
      </Page>
    </Document>
  );
}
