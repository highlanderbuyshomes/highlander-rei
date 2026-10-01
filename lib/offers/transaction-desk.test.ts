import { describe, expect, it } from "vitest";
import { defaultOfferTerms, splitStreet, tdFieldMap, type TdOffer } from "./transaction-desk";

describe("defaultOfferTerms", () => {
  it("$5k earnest money, close in 30 days, 10-day inspection, expires tomorrow 5:00 PM", () => {
    expect(defaultOfferTerms(new Date("2026-09-30T15:00:00"))).toEqual({
      earnestMoney: 5000, closeOfEscrow: "2026-10-30", inspectionDays: 10, offerExpiresDate: "2026-10-01", offerExpiresTime: "5:00 PM", possession: "close_of_escrow",
    });
  });
});

describe("splitStreet", () => {
  it("splits house number from street, dropping city/state/zip", () => {
    expect(splitStreet("1642 E GLENROSA Avenue, Phoenix, AZ 85016")).toEqual({ number: "1642", street: "E GLENROSA Avenue" });
    expect(splitStreet("10625 N 26TH Street")).toEqual({ number: "10625", street: "N 26TH Street" });
    expect(splitStreet("Lot 5 Desert Rd")).toEqual({ number: "", street: "Lot 5 Desert Rd" });
  });
});

const offer: TdOffer = {
  mlsNumber: "7050463", streetAddress: "1642 E GLENROSA Avenue, Phoenix, AZ 85016", city: "Phoenix", county: "Maricopa", zip: "85016",
  sellers: "Jane Doe", apn: "123-45-678", price: 310000, earnestMoney: 5000, closeOfEscrow: "2026-10-30", inspectionDays: 10,
  offerExpiresDate: "2026-10-01", offerExpiresTime: "5:00 PM", titleCompany: "Premier Title", titleOfficer: "Ann Lee", titlePhone: "(602) 555-0100", titleEmail: "ann@premier.com",
  warrantyCost: 500, warrantyPaidBy: "seller", sellerComp: "2.5%", possession: "close_of_escrow", personalProperty: ["refrigerator", "washer"],
  listAgent: "Rhonda Culver", listOffice: "Culver Realty LLC", listAgentPhone: "(480) 555-0199", listAgentEmail: "rhonda@culver.com",
};

describe("tdFieldMap", () => {
  it("maps an offer onto the AAR purchase contract field names in Transaction Desk", () => {
    expect(tdFieldMap(offer)).toEqual({
      text: {
        txtseller1: "Jane Doe", txtp_assparcelnum: "123-45-678", txtp_streetnum: "1642", txtp_street: "E GLENROSA Avenue",
        txtp_city: "Phoenix", txtp_county: "Maricopa", txtp_zipcode: "85016",
        txtp_price: "310,000.00", txtp_earnestmoney: "5,000.00",
        txtCOEDate_m: "October", txtCOEDate_d: "30", txtCOEDate_yy: "26",
        txtInspectiondays: "10", txttitlecompany: "Premier Title / Ann Lee", txttitlecmpphone: "(602) 555-0100", txttitlecmpemail: "ann@premier.com",
        txtp_warrantycost: "500.00",
        txtOfferExpireTime: "5:00", txtp_OfferExpireDate_mmmm: "October", txtp_OfferExpireDate_d: "1", txtp_OfferExpireDate_yyyy: "2026",
        txtl_brkagent: "Rhonda Culver", txtl_broker: "Culver Realty LLC", txtl_brkagentph: "(480) 555-0199", txtl_brkagentemail: "rhonda@culver.com",
      },
      checkboxes: { chkOpt_refrigerator: true, chkOpt_washer: true, chkOpt_dryer: false },
      choices: { offerExpiresAmPm: "PM", warrantyPaidBy: "seller", possession: "close_of_escrow" },
      notInContract: { sellerComp: "2.5%", mlsNumber: "7050463" },
    });
  });

  it("leaves unknown fields out instead of writing blanks", () => {
    const m = tdFieldMap({ ...offer, sellers: "", apn: "", titleOfficer: "", warrantyCost: null, listAgentEmail: "" });
    expect(m.text).not.toHaveProperty("txtseller1");
    expect(m.text).not.toHaveProperty("txtp_assparcelnum");
    expect(m.text.txttitlecompany).toBe("Premier Title");
    expect(m.text).not.toHaveProperty("txtp_warrantycost");
    expect(m.text).not.toHaveProperty("txtl_brkagentemail");
  });
});
