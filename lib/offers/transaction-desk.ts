/**
 * MLS offers entered into Transaction Desk from the "True Home Capital -
 * Purchase Offer" template (AAR Residential Resale Real Estate Purchase
 * Contract, Rev. 02/2026). The template already holds the buyer, cash/hard
 * money, earnest money with escrow, the investor additional terms and the
 * buyer's agent/broker; an offer supplies the rest. tdFieldMap gives the
 * contract's own field names so the values go in exactly as saved.
 */

export const TD_TEMPLATE = "True Home Capital - Purchase Offer";

export type Possession = "close_of_escrow" | "other";
export type WarrantyPayer = "seller" | "buyer";
export const PERSONAL_PROPERTY = ["refrigerator", "washer", "dryer"] as const;
export type PersonalProperty = (typeof PERSONAL_PROPERTY)[number];

export type TdOffer = {
  mlsNumber: string;
  streetAddress: string;
  city: string;
  county: string;
  zip: string;
  sellers: string;
  apn: string;
  price: number;
  earnestMoney: number;
  /** YYYY-MM-DD */
  closeOfEscrow: string;
  inspectionDays: number;
  /** YYYY-MM-DD */
  offerExpiresDate: string;
  /** e.g. "5:00 PM" */
  offerExpiresTime: string;
  titleCompany: string;
  titleOfficer: string;
  titlePhone: string;
  titleEmail: string;
  warrantyCost: number | null;
  warrantyPaidBy: WarrantyPayer;
  /** Seller Compensation Addendum, e.g. "2.5%" or "$7,500". */
  sellerComp: string;
  possession: Possession;
  personalProperty: PersonalProperty[];
  listAgent: string;
  listOffice: string;
  listAgentPhone: string;
  listAgentEmail: string;
};

const isoDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

/** Steven's defaults: $5k earnest money, close in 30 days, 10-day inspection, offer open until tomorrow 5 PM. */
export function defaultOfferTerms(now: Date = new Date()) {
  return {
    earnestMoney: 5000,
    closeOfEscrow: isoDate(addDays(now, 30)),
    inspectionDays: 10,
    offerExpiresDate: isoDate(addDays(now, 1)),
    offerExpiresTime: "5:00 PM",
    possession: "close_of_escrow" as Possession,
  };
}

/** "1642 E GLENROSA Avenue, Phoenix, AZ 85016" -> { number: "1642", street: "E GLENROSA Avenue" } */
export function splitStreet(streetAddress: string) {
  const line = streetAddress.split(",")[0].trim();
  const m = line.match(/^(\d+[A-Za-z]?)\s+(.*)$/);
  return m ? { number: m[1], street: m[2] } : { number: "", street: line };
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const parts = (ymd: string) => { const [y, m, d] = ymd.split("-").map(Number); return { year: y, month: MONTHS[m - 1], day: d }; };
const dollars = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export type TdFieldMap = {
  /** Text inputs by contract field name; unknown values are left out, never blanked. */
  text: Record<string, string>;
  checkboxes: Record<string, boolean>;
  /** Radio-style groups that share a field name: picked by label when entering. */
  choices: { offerExpiresAmPm: "AM" | "PM"; warrantyPaidBy: WarrantyPayer; possession: Possession };
  /** Not on the purchase contract (Seller Compensation Addendum / reference). */
  notInContract: { sellerComp: string; mlsNumber: string };
};

export function tdFieldMap(o: TdOffer): TdFieldMap {
  const text: Record<string, string> = {};
  const set = (name: string, value: string | null | undefined) => { if (value != null && String(value).trim()) text[name] = String(value).trim(); };
  const { number, street } = splitStreet(o.streetAddress);
  const coe = parts(o.closeOfEscrow), exp = parts(o.offerExpiresDate);
  const [time, ampm] = o.offerExpiresTime.trim().split(/\s+/);

  set("txtseller1", o.sellers);
  set("txtp_assparcelnum", o.apn);
  set("txtp_streetnum", number);
  set("txtp_street", street);
  set("txtp_city", o.city);
  set("txtp_county", o.county);
  set("txtp_zipcode", o.zip);
  set("txtp_price", dollars(o.price));
  set("txtp_earnestmoney", dollars(o.earnestMoney));
  set("txtCOEDate_m", coe.month);
  set("txtCOEDate_d", String(coe.day));
  set("txtCOEDate_yy", String(coe.year).slice(2));
  set("txtInspectiondays", String(o.inspectionDays));
  set("txttitlecompany", [o.titleCompany, o.titleOfficer].filter((s) => s.trim()).join(" / "));
  set("txttitlecmpphone", o.titlePhone);
  set("txttitlecmpemail", o.titleEmail);
  if (o.warrantyCost != null) set("txtp_warrantycost", dollars(o.warrantyCost));
  set("txtOfferExpireTime", time);
  set("txtp_OfferExpireDate_mmmm", exp.month);
  set("txtp_OfferExpireDate_d", String(exp.day));
  set("txtp_OfferExpireDate_yyyy", String(exp.year));
  set("txtl_brkagent", o.listAgent);
  set("txtl_broker", o.listOffice);
  set("txtl_brkagentph", o.listAgentPhone);
  set("txtl_brkagentemail", o.listAgentEmail);

  return {
    text,
    checkboxes: { chkOpt_refrigerator: o.personalProperty.includes("refrigerator"), chkOpt_washer: o.personalProperty.includes("washer"), chkOpt_dryer: o.personalProperty.includes("dryer") },
    choices: { offerExpiresAmPm: ampm?.toUpperCase() === "AM" ? "AM" : "PM", warrantyPaidBy: o.warrantyPaidBy, possession: o.possession },
    notInContract: { sellerComp: o.sellerComp, mlsNumber: o.mlsNumber },
  };
}
