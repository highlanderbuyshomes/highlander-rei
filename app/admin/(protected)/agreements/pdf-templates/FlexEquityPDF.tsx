import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

export type FlexEquityPDFProps = {
  agreementDate: string;
  seller1Name: string;
  seller2Name?: string;
  address: string;
  purchasePrice: string;
  earnestMoney: string;
  cashAtClosing: string;
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
  ptWrap: { marginBottom: 8 },
  ptHeader: { backgroundColor: DARK, paddingVertical: 4, paddingHorizontal: 8 },
  ptHeaderText: { color: "#fff", fontSize: 7.5, letterSpacing: 2, fontFamily: "Helvetica-Bold" },
  ptBody: { flexDirection: "row", borderWidth: 1, borderTopWidth: 0, borderColor: "#bbb" },
  ptLabel: { width: 74, borderRightWidth: 1, borderRightColor: "#bbb", paddingVertical: 7, paddingHorizontal: 8 },
  ptLabelText: { fontSize: 7, fontFamily: "Helvetica-Bold", letterSpacing: 0.5, textTransform: "uppercase", lineHeight: 1.4 },
  ptValue: { flex: 1, paddingVertical: 7, paddingHorizontal: 8 },
  secHead: {
    fontFamily: "Helvetica-Bold", fontSize: 8.5, letterSpacing: 2.5, textTransform: "uppercase",
    marginTop: 13, marginBottom: 7, paddingBottom: 4, borderBottomWidth: 1, borderBottomColor: BLUE,
  },
  pdTable: { borderWidth: 1, borderColor: "#bbb", marginTop: 2 },
  pdRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#bbb" },
  pdRowLast: { flexDirection: "row" },
  pdLabel: { width: 90, borderRightWidth: 1, borderRightColor: "#bbb", paddingVertical: 6, paddingHorizontal: 8 },
  pdLabelText: { fontSize: 7, fontFamily: "Helvetica-Bold", letterSpacing: 0.5, textTransform: "uppercase", lineHeight: 1.4 },
  pdValue: { flex: 1, paddingVertical: 6, paddingHorizontal: 8, fontSize: 9.5 },
  para: { marginBottom: 8, fontSize: 9.5 },
  bold: { fontFamily: "Helvetica-Bold" },
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
      <View style={s.pdLabel}>
        <Text style={s.pdLabelText}>{label}</Text>
      </View>
      <View style={s.pdValue}>
        <Text>{value}</Text>
      </View>
    </View>
  );
}

function Sec({ children }: { children: string }) {
  return <Text style={s.secHead}>{children}</Text>;
}

function P({ bold, children }: { bold: string; children: string }) {
  return (
    <Text style={s.para}>
      <Text style={s.bold}>{bold} </Text>
      {children}
    </Text>
  );
}

export default function FlexEquityPDF(props: FlexEquityPDFProps) {
  const { agreementDate, seller1Name, seller2Name, address, purchasePrice, earnestMoney, cashAtClosing } = props;

  return (
    <Document title={`Flex Equity Program — ${address}`}>
      <Page size="LETTER" style={s.page}>
        <Header />
        <Footer />

        <Text style={s.docTitle}>REAL ESTATE PURCHASE CONTRACT</Text>

        <Text style={s.introLine}>
          <Text style={s.bold}>THIS AGREEMENT</Text> is made this {agreementDate}
        </Text>

        <Text style={s.introLine}>
          <Text style={s.bold}>BY AND BETWEEN | </Text>
          Seller(s) and their heir(s), successors, administrators, and assigns, as identified in the party boxes above, and Highlander REI LLC and assigns, hereafter called Buyer.
        </Text>

        <PartyBox title="SELLER 1" value={seller1Name} />
        <PartyBox title="SELLER 2 (IF APPLICABLE)" value={seller2Name ?? "N/A"} />
        <PartyBox title="BUYER – HIGHLANDER REI LLC, AND/OR ASSIGNS" value="Highlander REI LLC" />

        <Sec>PROPERTY DETAILS</Sec>
        <View style={s.pdTable}>
          <PRow label={"ADDRESS"} value={address} />
          <PRow label={"PURCHASE\nPRICE"} value={purchasePrice} />
          <PRow label={"EARNEST\nMONEY\nDEPOSIT"} value={earnestMoney} />
          <PRow label={"CASH AT\nCLOSING"} value={cashAtClosing} last />
        </View>

        <Sec>TERMS & CONDITIONS</Sec>

        <P bold="EXPENSES |">
          Buyer to pay all traditional closing costs. Transfer taxes to be paid as a split between Buyer and Seller. Any tax liens, liens, encumbrances, and or mortgage owed will be closed and paid in full by the Seller.
        </P>

        <P bold="CLOSE OF ESCROW |">
          Close of escrow will be held at title or attorney office (Magnus AZ Title Agency) and close of escrow will take place on or before (30 CALENDAR DAYS) or sooner after the date of Ratification without a written addendum to this agreement. If the title is not clear by the close of escrow date, the close of escrow will automatically be extended to 30 days after the Seller can deliver a clear title. If title can't be transferred, the Buyer has the option to terminate this contract and the Deposit will be refunded in full to the Buyer.
        </P>

        <P bold="ACCESS |">
          Although the property is being sold "as is," this property is subject to inspection during the due diligence period, and the buyer may cancel this agreement during the due diligence period, which is 5 business days after contract ratification. The inspection is to validate that the property is in the same "as is" condition as described by the Seller. The seller agrees to provide access to the Buyer's representatives before the transfer of title for inspection, repairs, and to market the property. If the property is vacant, Seller shall provide Buyer with a key to access the property specifically for the reasons above.
        </P>

        <P bold="POSSESSION |">
          This offer is contingent on the Seller providing a clear title to the Buyer. The Buyer will have 10 days to determine if the title is insurable or can extend at the buyer's discretion. If the title is not insurable, this agreement shall be terminated. This offer is subject to financial partner's approval; any earnest money will be refunded to the buyer if terminated for any reason. Any furniture, fixtures, attachments, and debris located in and around the property not removed within a day of closing becomes the property of the buyer.
        </P>

        <Text style={[s.para, { fontFamily: "Helvetica-Bold" }]}>ADDITIONAL TERMS & CONDITIONS |</Text>

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

        <Sec>SETTLEMENT & RELEASE</Sec>

        <P bold="SETTLEMENT AND RELEASE |">
          The Seller(s), referred to as "OCCUPANTS," and Highlander REI LLC, referred to as "OWNER," agree to settle all claims regarding the property at the address listed above. OCCUPANTS agree to vacate the Property by close of escrow and return all keys and devices to OWNER. The parties mutually rescind any lease agreement and terminate any other relationship as of this Agreement's date, except as provided herein. This Agreement fully resolves all residency issues, except for the property's condition, which is currently unknown. OCCUPANTS agree to leave the Property in good and clean condition. OWNER will dismiss any pending eviction action if OCCUPANTS comply with all terms; otherwise, OWNER may pursue remedies under state law. OCCUPANTS release OWNER and its representatives from all claims related to the Property or OCCUPANTS' personal property. The parties acknowledge no representations influenced their decision to enter this Agreement and have had the opportunity to be represented by legal counsel. Any dispute arising from this Agreement shall be governed by state law.
        </P>

        <Sec>SPECIAL PROVISIONS</Sec>

        <P bold="MEMORANDUM OF CONTRACT |">
          Seller authorizes Buyer to execute, acknowledge, and record a memorandum of this Purchase Contract, which will put future purchasers and/or lienholders on notice of Buyer's interest in the Property with the appropriate county department to show an agreement for sale is executed. The seller also agrees that the Buyer has the right to file a mechanics or construction lien if money or work is put into the property by the buyer before the close of escrow.
        </P>

        <P bold="PRE-MARKETING & NOVATION AGREEMENT |">
          The Buyer has the right to market its contract interest in the Property in the Buyer's sole discretion through private investor channels. Seller(s) do hereby grant a limited and specific authorization to Buyer as "Attorney-in-Fact" for such marketing purposes. As Attorney-in-Fact, Buyer shall have full authority to negotiate, execute, and accept any real estate purchase agreement, offer, or contract from an End Buyer on Seller's behalf, including executing listing agreements, purchase contracts, addenda, preliminary offers, and all related disclosures necessary to effectuate the sale of the Property to an End Buyer. Seller hereby consents to and approves a novation of this Agreement whereby Buyer is expressly authorized, at Buyer's sole discretion, to substitute a new purchaser (the "End Buyer") in place of Buyer under this Agreement. Such substitution shall fully release Buyer from all obligations hereunder upon execution of the End Buyer's agreement. The End Buyer may utilize any lawful method of purchase and financing available in the market, including all-cash transactions, conventional mortgage programs, or government-backed financing options, at the sole election of the End Buyer. The substitution of a buyer shall not require further consent of Seller beyond execution of this Agreement, provided all material terms remain substantively unchanged. This authority is effective upon execution of this Agreement and shall automatically be revoked upon completion of the transaction or upon Seller's written notice of revocation, provided that no such revocation shall be effective once an End Buyer's agreement has been executed and presented to the title company. Any incidental acts reasonably required to carry out the authorities granted herein are included within the scope of this authorization.
        </P>

        <Sec>DISCLOSURES</Sec>

        <P bold="LICENSED AGENT DISCLOSURE |">
          One or more members of Highlander REI LLC holds a real estate license in the state of Arizona and/or Texas. In this transaction, Highlander REI LLC is acting solely as a principal buyer — not as your agent, broker, or representative. We are purchasing this property for our own investment purposes. You are encouraged to consult with your own independent real estate professional or attorney before signing this agreement.
        </P>

        <P bold="INVESTOR DISCLOSURE |">
          Highlander REI LLC is a real estate investment company purchasing this property with the intent to resell, lease, renovate, or otherwise profit from the transaction. Seller shall receive the agreed purchase price as stated in this agreement. Highlander REI LLC may, at its sole discretion and expense, perform repairs, renovations, or other improvements to the Property and may thereafter market or sell the Property to an end buyer. Any funds received from a subsequent sale in excess of the Seller's agreed purchase price shall belong to Highlander REI LLC. Highlander REI LLC shall bear all costs associated with improvements, repairs, marketing, carrying costs, and resale of the Property, and any profit realized shall be determined after deduction of such costs and expenses. Highlander REI LLC may also seek to novate or assign this agreement to an end buyer prior to closing. If that occurs, the purchase price stated in this agreement does not change unless both parties agree to an amendment in writing. We may earn a profit through that process and are not required to disclose the amount of that profit. Your signature on this agreement confirms your understanding and acceptance of these terms.
        </P>

        <P bold="AS-IS DISCLOSURE |">
          This property is being purchased in its current condition, as-is, with no warranties or representations made by Highlander REI LLC regarding its condition, value, or fitness for any particular use. You represent and warrant that you have disclosed all known material defects to the best of your knowledge, and Highlander REI LLC is relying on that representation as part of this agreement.
        </P>

        <Sec>LEGAL PROVISIONS</Sec>

        <P bold="FAILURE TO PERFORM |">
          If for any reason other than the failure of the seller to make the seller's title marketable after diligent effort, the seller fails, neglects, or refuses to perform this contract, the Buyer may seek "specific performance" or elect to receive the return of the buyer's deposit(s) without thereby waiving any action for damages resulting from seller's breach.
        </P>

        <P bold="LOAN / FINANCING CONTINGENCY |">
          This Agreement is contingent upon Buyer obtaining financing on terms acceptable to Buyer, in Buyer's sole discretion. Buyer shall have until the close of escrow to secure such financing approval. If Buyer is unable to obtain financing for any reason whatsoever, including but not limited to lender denial, underwriting conditions, appraisal issues, changes in loan terms, interest rate changes, or lender guidelines, Buyer may terminate this Agreement by providing written notice to Seller prior to closing. Upon such termination, the Earnest Money Deposit shall be returned in full to the original Buyer (Highlander REI LLC), regardless of whether a Substituted Buyer has been identified or is in contract. Neither party shall have any further obligation or liability to the other, except for obligations that expressly survive termination.
        </P>

        <P bold="ATTORNEY FEES |">
          In any litigation, including breach, enforcement, or interpretation, arising out of this contract, the prevailing party in such litigation shall be entitled to recover from the non-prevailing party reasonable attorney's fees, costs, and expenses. If the buyer is a prevailing party, the buyer has the right to deduct such fees from the seller's proceeds.
        </P>

        <P bold="TIME IS OF THE ESSENCE |">
          With this agreement, each contingency contained herein shall be satisfied according to its terms by the closing date or this contract extends to provide time for the satisfaction of said contingencies. Each party shall diligently pursue the completion of this transaction. Each warranty herein made survives the closing of this transaction.
        </P>

        <P bold="MISCELLANEOUS |">
          For all purposes herein, an electronic facsimile signature shall be deemed the same as an original signature. If Seller indicates an intention to or refusal to close escrow by the Close of Escrow date, Seller shall be deemed to be in immediate default without any requirement by Buyer to serve a Cure Notice and Buyer may pursue all remedies available to Buyer under this contract or as provided by law. No prior or present agreements or representations shall be binding upon the buyer or seller unless included in this contract. No modification to or change in this contract shall be valid or binding upon the parties unless in writing and executed by the parties intended to be bound by it. If any provision of this agreement is determined by a court of competent jurisdiction to be invalid or unenforceable, the remainder of this agreement shall nonetheless remain in full force and effect.
        </P>

        <Sec>NOVATION & REINSTATEMENT</Sec>

        <P bold="AUTOMATIC REINSTATEMENT |">
          In the event the Substituted Buyer fails to close on the purchase of the Property for any reason whatsoever, including but not limited to financing failure, contingency failure, buyer default, lender denial, appraisal issues, underwriting conditions, title issues, or any other cause, the Real Estate Purchase Agreement between Seller and Highlander REI LLC shall be deemed automatically reinstated in full, without further action required by either party. Upon reinstatement, both Seller and Highlander REI LLC shall be bound by all original terms and conditions of this Agreement as if no conditional termination had occurred.
        </P>

        <P bold="EARNEST MONEY PROTECTION |">
          {`Highlander REI LLC's Earnest Money Deposit shall be fully protected and refunded in all of the following circumstances: (a) the end buyer's financing fails to close for any reason; (b) the end buyer cancels or defaults for any reason; (c) any loan contingency or financing condition that prevents closing; (d) any title issue preventing transfer of clear title; (e) Seller default or refusal to perform; (f) failure of any inspection or due diligence contingency; or (g) any other termination not caused solely by the willful default of Highlander REI LLC. In no event shall Seller retain Highlander REI LLC's Earnest Money Deposit as a result of a third party's failure to perform. Upon confirmation that an end buyer's earnest money has been deposited with the title or escrow agent, Highlander REI LLC's original deposit shall be returned promptly. Should no end buyer be identified or should the transaction not proceed to closing, Highlander REI LLC's deposit shall likewise be returned in full.`}
        </P>

        <P bold="LIQUIDATED DAMAGES |">
          {`In the event Seller defaults on any obligations under this Agreement or under a Third-Party Real Estate Purchase Agreement by refusing or failing to close, Highlander REI LLC shall be entitled to elect either specific performance or liquidated damages. Liquidated damages shall be calculated as the difference between the Seller's agreed net proceeds and the purchase price agreed to by the Substituted Buyer. The parties agree that calculating actual damages in such a scenario would be complex and that liquidated damages as described herein are a reasonable pre-estimate of loss and not a penalty.`}
        </P>

        <P bold="SELLER COOPERATION |">
          {`Seller agrees to cooperate fully and in good faith with Highlander REI LLC and any Substituted Buyer throughout the transaction, including but not limited to executing all documents reasonably required to transfer clear title, complying with escrow instructions, maintaining the property in its current condition, and timely responding to requests from the title company or escrow agent. Seller shall not take any action to encumber, damage, lease, or otherwise impair the Property or Highlander REI LLC's contract interest between the date of this Agreement and closing.`}
        </P>

        <P bold="ACCEPTANCE |">
          This offer expires within 24 hours of the contract request. The buyer holds the right to extend the offer. This instrument will become a binding contract when accepted by the Seller and signed by both Buyer and Seller. In case of a default by the buyer, the sole remedy shall be the earnest money deposit.
        </P>

        <Sec>SIGNATURES</Sec>

        <View style={s.sigPad}>
          <View style={s.sigPairRow}>
            <View style={s.sigBoxL}>
              <View style={s.sigLine} />
              <Text style={s.sigLabel}>SELLER 1</Text>
              <Text style={s.sigDate}>Date</Text>
            </View>
            <View style={s.sigBoxR}>
              <View style={s.sigLine} />
              <Text style={s.sigLabel}>BUYER – HIGHLANDER REI LLC</Text>
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
