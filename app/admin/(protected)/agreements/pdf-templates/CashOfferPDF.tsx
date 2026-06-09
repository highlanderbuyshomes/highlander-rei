/* eslint-disable react/no-unescaped-entities -- Contract language must render verbatim in the generated PDF. */
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

export type CashOfferPDFProps = {
  agreementDate: string;
  seller1Name: string;
  seller2Name?: string;
  buyerName?: string;
  address: string;
  purchasePrice: string;
  earnestMoney: string;
  cashAtClosing: string;
  titleOffice?: string;
  daysToClosing?: string;
};

const BLUE = "#3A5FA0";
const DARK = "#1e2c44";

const s = StyleSheet.create({
  page: {
    paddingTop: 76, paddingBottom: 54, paddingHorizontal: 58,
    fontFamily: "Helvetica", fontSize: 9.5, color: "#111", lineHeight: 1.58,
  },
  fixedHeader: { position: "absolute", top: 22, left: 58, right: 58 },
  brandRow: { flexDirection: "row", alignItems: "flex-end", marginBottom: 1 },
  brandMain: { fontFamily: "Helvetica-Bold", fontSize: 13, letterSpacing: 3.5, color: "#111" },
  brandDot: { fontFamily: "Helvetica-Bold", fontSize: 13, color: BLUE },
  brandSub: { fontSize: 7, letterSpacing: 2, color: "#666", textTransform: "uppercase", marginBottom: 4 },
  brandLine: { borderBottomWidth: 1.5, borderBottomColor: BLUE },
  fixedFooter: {
    position: "absolute", bottom: 18, left: 58, right: 58,
    borderTopWidth: 0.5, borderTopColor: "#ddd", paddingTop: 5,
    flexDirection: "row", justifyContent: "space-between",
  },
  footerText: { fontSize: 7.5, color: "#888" },
  docTitle: {
    fontFamily: "Helvetica-Bold", fontSize: 14.5, letterSpacing: 4.5,
    textAlign: "center", marginBottom: 12,
  },
  introLine: { marginBottom: 10, fontSize: 9.5 },
  // Party tables
  ptWrap: { marginBottom: 8 },
  ptHeader: { backgroundColor: DARK, paddingVertical: 4, paddingHorizontal: 8 },
  ptHeaderText: { color: "#fff", fontSize: 7.5, letterSpacing: 2, fontFamily: "Helvetica-Bold" },
  ptBody: { flexDirection: "row", borderWidth: 1, borderTopWidth: 0, borderColor: "#bbb" },
  ptLabel: { width: 74, borderRightWidth: 1, borderRightColor: "#bbb", paddingVertical: 7, paddingHorizontal: 8 },
  ptLabelText: { fontSize: 7, fontFamily: "Helvetica-Bold", letterSpacing: 0.5, textTransform: "uppercase", lineHeight: 1.4 },
  ptValue: { flex: 1, paddingVertical: 7, paddingHorizontal: 8 },
  // Property details table (no header, just rows)
  pdTable: { borderWidth: 1, borderColor: "#bbb", marginTop: 10, marginBottom: 14 },
  pdRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#bbb" },
  pdRowLast: { flexDirection: "row" },
  pdLabel: { width: 90, borderRightWidth: 1, borderRightColor: "#bbb", paddingVertical: 6, paddingHorizontal: 8 },
  pdLabelText: { fontSize: 7, fontFamily: "Helvetica-Bold", letterSpacing: 0.5, textTransform: "uppercase", lineHeight: 1.4 },
  pdValue: { flex: 1, paddingVertical: 6, paddingHorizontal: 8, fontSize: 9.5 },
  // Closing detail mini-table
  closeTable: { borderWidth: 1, borderColor: "#bbb", marginTop: 6, marginBottom: 8, width: "60%" },
  closeRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#bbb" },
  closeRowLast: { flexDirection: "row" },
  closeLabel: { width: 110, borderRightWidth: 1, borderRightColor: "#bbb", paddingVertical: 5, paddingHorizontal: 8 },
  closeLabelText: { fontSize: 7, fontFamily: "Helvetica-Bold", letterSpacing: 0.5, textTransform: "uppercase", lineHeight: 1.4 },
  closeValue: { flex: 1, paddingVertical: 5, paddingHorizontal: 8, fontSize: 9.5 },
  // Section header (terms & conditions uses centered pipes style)
  tcHeader: {
    fontFamily: "Helvetica-Bold", fontSize: 10, letterSpacing: 2,
    textAlign: "center", marginTop: 14, marginBottom: 8,
    paddingBottom: 4, borderBottomWidth: 1, borderBottomColor: BLUE,
    color: BLUE,
  },
  secHead: {
    fontFamily: "Helvetica-Bold", fontSize: 8.5, letterSpacing: 2.5, textTransform: "uppercase",
    marginTop: 13, marginBottom: 7, paddingBottom: 4, borderBottomWidth: 1, borderBottomColor: BLUE,
  },
  para: { marginBottom: 8, fontSize: 9.5 },
  bold: { fontFamily: "Helvetica-Bold", color: BLUE },
  boldBlack: { fontFamily: "Helvetica-Bold" },
  // Signatures
  sigPad: { marginTop: 28 },
  sigPairRow: { flexDirection: "row", marginBottom: 38 },
  sigBoxL: { flex: 1, marginRight: 36 },
  sigBoxR: { flex: 1 },
  sigBoxSolo: { width: "47%", marginBottom: 36 },
  sigLine: { borderBottomWidth: 1, borderBottomColor: "#111", marginBottom: 5 },
  sigLabel: { fontSize: 7.5, fontFamily: "Helvetica-Bold", letterSpacing: 1.5, textTransform: "uppercase", color: "#333" },
  sigDate: { fontSize: 7.5, color: "#888", marginTop: 3 },
  tagline: { textAlign: "center", fontFamily: "Helvetica-Oblique", fontSize: 9, color: "#888", marginTop: 40 },
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
      <View style={s.ptHeader}>
        <Text style={s.ptHeaderText}>{title}</Text>
      </View>
      <View style={s.ptBody}>
        <View style={s.ptLabel}>
          <Text style={s.ptLabelText}>{"Full Legal\nName"}</Text>
        </View>
        <View style={s.ptValue}>
          <Text>{value}</Text>
        </View>
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

function CRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={last ? s.closeRowLast : s.closeRow}>
      <View style={s.closeLabel}><Text style={s.closeLabelText}>{label}</Text></View>
      <View style={s.closeValue}><Text>{value}</Text></View>
    </View>
  );
}

function P({ bold, children }: { bold: string; children: string }) {
  return (
    <Text style={s.para}>
      <Text style={s.bold}>{bold} </Text>
      {children}
    </Text>
  );
}

export default function CashOfferPDF(props: CashOfferPDFProps) {
  const {
    agreementDate, seller1Name, seller2Name, buyerName = "Highlander REI LLC", address,
    purchasePrice, earnestMoney, cashAtClosing,
    titleOffice = "", daysToClosing = "30",
  } = props;

  const occupants = seller2Name ? `${seller1Name}, ${seller2Name}` : seller1Name;

  return (
    <Document title={`Cash Offer — ${address}`}>
      <Page size="LETTER" style={s.page}>
        <Header />
        <Footer />

        <Text style={s.docTitle}>REAL ESTATE PURCHASE CONTRACT</Text>

        <Text style={s.introLine}>
          <Text style={s.boldBlack}>THIS AGREEMENT</Text> is made this {agreementDate}
        </Text>

        <Text style={s.introLine}>
          <Text style={s.bold}>BY AND BETWEEN | </Text>
          Seller(s) and their heir(s), successors, administrators, and assigns, and Buyer, as identified in the party boxes below, hereafter collectively referred to as the "Parties."
        </Text>

        <PartyBox title="SELLER 1" value={seller1Name} />
        <PartyBox title="SELLER 2 (IF APPLICABLE)" value={seller2Name ?? "N/A"} />
        <PartyBox title="BUYER, AND/OR ASSIGNS" value={buyerName} />

        {/* Property details table — no section header in this version */}
        <View style={s.pdTable}>
          <PRow label={"ADDRESS"} value={address} />
          <PRow label={"PURCHASE\nPRICE"} value={purchasePrice} />
          <PRow label={"EARNEST\nMONEY\nDEPOSIT"} value={earnestMoney} />
          <PRow label={"CASH AT\nCLOSING"} value={cashAtClosing} last />
        </View>

        <Text style={s.tcHeader}>| TERMS & CONDITIONS |</Text>

        <P bold="EXPENSES |">
          Buyer to pay all traditional closing costs. Transfer taxes to be paid as a split between Buyer and Seller. Any tax liens, liens, encumbrances, and or mortgage owed will be closed and paid in full by the Seller.
        </P>

        <P bold="CLOSE OF ESCROW |">
          Close of escrow will be held at the title or attorney office identified below, and close of escrow will take place on or before the number of business days specified below after the date of Ratification. If the title is not clear by the close of escrow date, it will automatically be extended to 30 days after the Seller can deliver a clear title. If title can't be transferred, the Buyer has the option to terminate this contract and the Deposit will be refunded in full to the Buyer.
        </P>

        <View style={s.closeTable}>
          <CRow label={"TITLE / ATTORNEY\nOFFICE"} value={titleOffice} />
          <CRow label={"DAYS TO CLOSING"} value={daysToClosing} last />
        </View>

        <P bold="ACCESS |">
          Although the property is being sold "as is," this property is subject to inspection during the due diligence period, and the buyer may cancel this agreement during the due diligence period, which is 5 business days after contract ratification. The inspection is to validate that the property is in the same "as is" condition as described by the Seller. The seller agrees to provide access to the Buyer's representatives before the transfer of title for inspection, repairs, and to market the property. If the property is vacant, Seller shall provide Buyer with a key to access the property specifically for the reasons above.
        </P>

        <P bold="POSSESSION |">
          This offer is contingent on the Seller providing a clear title to the Buyer. The Buyer will have 10 days to determine if the title is insurable or can extend at the buyer's discretion. If the title is not insurable, this agreement shall be terminated. This offer is subject to financial partner's approval, any earnest money will be refunded to the buyer if terminated for any reason. Any furniture, fixtures, attachments, and debris located in and around the property not removed within a day of closing becomes the property of the buyer.
        </P>

        <Text style={s.para}>
          <Text style={s.bold}>ADDITIONAL TERMS & CONDITIONS: </Text>
          {`${earnestMoney} EMD refundable after both title clearance and inspection period.`}
        </Text>

        <P bold="DEFECTS |">
          Seller warrants subject property to be free from hazardous substances and from violation of any zoning, environmental, building, health, or other governmental codes or ordinances. Seller further warrants that there is no material or other known defects or facts regarding this property, which would adversely affect the value of said property.
        </P>

        <P bold="INSURANCE |">
          As consideration for this purchase the Seller will maintain insurance on the Property until closing.
        </P>

        <P bold="RISK OF LOSS |">
          If the subject property is damaged before the transfer of title, the Buyer has the option of accepting any insurance proceeds with title to the property in "as is" condition or of canceling this contract and accepting the return of the deposit.
        </P>

        <P bold="NO JUDGMENTS |">
          Seller warrants that there are no judgments threatening the equity in the subject property and that there is no bankruptcy pending or contemplated by any titleholder. Seller will not further encumber the property, and an affidavit may be recorded at Buyer's expense putting the public on notice that the closing of this contract will extinguish liens and encumbrances hereafter recorded.
        </P>

        <P bold="INFORMATION AND AUTHORIZATION |">
          The herein authorize the release of any requested payoff or status information to "Highlander REI LLC" and/or Title or Attorney office holding escrow.
        </P>

        <Text style={s.para}>
          <Text style={s.bold}>SETTLEMENT AND RELEASE | </Text>
          {`The Defendants (${occupants}), referred to as "OCCUPANTS," and the Owner of the property, Highlander REI LLC, referred to as "OWNER," agree to settle all claims regarding the property at (${address}). OCCUPANTS agree to vacate the Property by (_______________) and return all keys and devices to OWNER. The parties mutually rescind any lease agreement and terminate any other relationship as of this Agreement's date, except as provided herein. This Agreement fully resolves all residency issues, except for the property's condition, which is currently unknown. OCCUPANTS agree to leave the Property in good and clean condition. OWNER will dismiss any pending eviction action if OCCUPANTS comply with all terms; otherwise, OWNER may pursue remedies under state law. OCCUPANTS releases OWNER and its representatives from all claims related to the Property or OCCUPANTS' personal property. The parties acknowledge no representations influenced their decision to enter this Agreement and have had the opportunity to be represented by legal counsel. Any dispute arising from this Agreement shall be governed by state law.`}
        </Text>

        <P bold="MEMORANDUM OF CONTRACT |">
          Seller authorizes Buyer to execute, acknowledge, and record a memorandum of this Purchase Contract, which will put future purchasers and/or lienholders on notice of Buyer's interest in the Property with the appropriate county department to show an agreement for sale is executed. The seller also agrees that the Buyer has the right to file a mechanics or construction lien if money or work is put into the property by the buyer before the close of escrow.
        </P>

        <P bold="PRE-MARKETING AGREEMENT |">
          The buyer has the right to market its contract interest in the Property in the Buyer's sole discretion, which may include, but is not limited to listing the Property and Buyer's contract interest in the Property on any Multiple Listing Service ("MLS"). Seller(s) do hereby grant a limited and specific authorization to Buyer as "Attorney-in-Fact". Said Attorney-in-Fact shall have full power and authority to undertake and perform the following acts on my behalf. Seller specifically authorizes and permits the Attorney-in-Fact to list the property on any multiple listing service(s) (MLS), investor networks, Zillow, and/or realtors for marketing & selling the Property. This includes executing listing agreement(s), listing agreement addendum(s), preliminary offers, and listing disclosures. The authority herein shall include such incidental acts as reasonably required to carry authorities granted herein. This authorization is effective upon execution. This authorization may be revoked when the above state one (1) time power or responsibility has been completed. This authorization form shall automatically be revoked upon my death or incapacitation, provided any person relying on this power of attorney shall be given full rights to accept and rely upon the authority of the Attorney-in-Fact until the receipt of actual notice of revocation.
        </P>

        <P bold="INVESTOR DISCLOSURE |">
          The buyer is an investor and purchases properties with the intent to lease, resell, or otherwise make a profit. Sellers acknowledge that the purchase price may be less than market value, and are willingly selling it as such for convenience, saving time, lack of funds to renovate, and/or other personal reasons. The seller fully understands that the buyer and/or its representatives are wholesale buyers and are not earning any commission from the seller. The buyer has not made the seller any representations or promises as to the value of the property in its "as is" condition.
        </P>

        <P bold="FAILURE TO PERFORM |">
          If for any reason other than the failure of the seller to make the seller's title marketable after diligent effort, the seller fails, neglects, or refuses to perform this contract, the Buyer may seek "specific performance" or elect to receive the return of the buyer's deposit(s) without thereby waiving any action for damages resulting from seller's breach.
        </P>

        <Text style={s.para}>
          <Text style={s.bold}>LOAN / FINANCING CONTINGENCY |{"\n"}</Text>
          This Agreement is contingent upon Buyer obtaining financing on terms acceptable to Buyer, in Buyer's sole discretion. Buyer shall have until the close of escrow to secure such financing approval. If Buyer is unable to obtain financing for any reason whatsoever, including but not limited to lender denial, underwriting conditions, appraisal issues, changes in loan terms, interest rate changes, lender guidelines, or Buyer's financial partner's approval, Buyer may terminate this Agreement by providing written notice to Seller prior to closing. Upon such termination, Buyer's Earnest Money Deposit shall be returned to Buyer in full, and neither party shall have any further obligation or liability to the other, except for obligations that expressly survive termination.
        </Text>

        <P bold="ATTORNEY FEES |">
          In any litigation, including breach, enforcement, or interpretation, arising out of this contract, the prevailing party in such litigation shall be entitled to recover from the non-prevailing party reasonable attorney's fees, costs, and expenses. If the buyer is a prevailing party, the buyer has the right to deduct such fees from the seller's proceeds.
        </P>

        <P bold="TIME IS OF THE ESSENCE |">
          With this agreement, each contingency contained herein shall be satisfied according to its terms by the closing date or this contract extends to provide time for the satisfaction of said contingencies. Each party shall diligently pursue the completion of this transaction. Each warranty herein made survives the closing of this transaction.
        </P>

        <P bold="MISCELLANEOUS |">
          For all purposes herein, an electronic facsimile signature shall be deemed the same as an original signature. If Seller indicates an intention to or refusal to close escrow by the Close of Escrow date, Seller shall be deemed to be in immediate default without any requirement by Buyer to serve a Cure Notice and Buyer may pursue all remedies available to Buyer under this contract or as provided by law. No prior or present agreements or representations shall be binding upon the buyer or seller unless included in this contract. No modification to or change in this contract shall be valid or binding upon the parties unless in writing and executed by the parties intended to be bound by it. If any provision of this agreement is determined by a court of competent jurisdiction to be invalid or unenforceable, the remainder of this agreement shall nonetheless remain in full force and effect.
        </P>

        <P bold="ACCEPTANCE |">
          This offer expires within 24 hours of the contract request. The buyer holds the right to extend the offer. This instrument will become a binding contract when accepted by the Seller and signed by both Buyer and Seller. In case of a default by the buyer, the sole remedy shall be the earnest money deposit.
        </P>

        <Text style={s.secHead}>SIGNATURES</Text>

        <View style={s.sigPad}>
          <View style={s.sigPairRow}>
            <View style={s.sigBoxL}>
              <View style={s.sigLine} />
              <Text style={s.sigLabel}>SELLER 1</Text>
              <Text style={s.sigDate}>Date</Text>
            </View>
            <View style={s.sigBoxR}>
              <View style={s.sigLine} />
              <Text style={s.sigLabel}>BUYER – {buyerName}</Text>
              <Text style={s.sigDate}>Date</Text>
            </View>
          </View>

          {seller2Name && (
            <View style={s.sigBoxSolo}>
              <View style={s.sigLine} />
              <Text style={s.sigLabel}>SELLER 2 (IF APPLICABLE)</Text>
              <Text style={s.sigDate}>Date</Text>
            </View>
          )}
        </View>

        <Text style={s.tagline}>Real estate solutions — Sell, Invest, or Partner with us.</Text>
      </Page>
    </Document>
  );
}
