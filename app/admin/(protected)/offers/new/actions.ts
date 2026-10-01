"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { PERSONAL_PROPERTY, TD_TEMPLATE, type PersonalProperty, type TdOffer } from "@/lib/offers/transaction-desk";

const money = (v: FormDataEntryValue | null) => { const n = Number(String(v ?? "").replace(/[$,\s]/g, "")); return Number.isFinite(n) && n > 0 ? n : null; };
const text = (f: FormData, k: string) => String(f.get(k) ?? "").trim();

/** Saves an MLS offer draft (type mls_offer) for entry into Transaction Desk. */
export async function saveMlsOffer(formData: FormData) {
  await requireAdmin();
  const price = money(formData.get("price"));
  const mlsNumber = text(formData, "mlsNumber");
  if (!mlsNumber || price == null) redirect(`/admin/offers/new?mls=${encodeURIComponent(mlsNumber)}&error=price`);

  const offer: TdOffer = {
    mlsNumber,
    streetAddress: text(formData, "streetAddress"), city: text(formData, "city"), county: text(formData, "county"), zip: text(formData, "zip"),
    sellers: text(formData, "sellers"), apn: text(formData, "apn"),
    price: price!, earnestMoney: money(formData.get("earnestMoney")) ?? 5000,
    closeOfEscrow: text(formData, "closeOfEscrow"), inspectionDays: Number(text(formData, "inspectionDays")) || 10,
    offerExpiresDate: text(formData, "offerExpiresDate"), offerExpiresTime: text(formData, "offerExpiresTime") || "5:00 PM",
    titleCompany: text(formData, "titleCompany"), titleOfficer: text(formData, "titleOfficer"), titlePhone: text(formData, "titlePhone"), titleEmail: text(formData, "titleEmail"),
    warrantyCost: money(formData.get("warrantyCost")), warrantyPaidBy: text(formData, "warrantyPaidBy") === "buyer" ? "buyer" : "seller",
    sellerComp: text(formData, "sellerComp"),
    possession: text(formData, "possession") === "other" ? "other" : "close_of_escrow",
    personalProperty: PERSONAL_PROPERTY.filter((p) => formData.get(`pp_${p}`) === "on") as PersonalProperty[],
    listAgent: text(formData, "listAgent"), listOffice: text(formData, "listOffice"), listAgentPhone: text(formData, "listAgentPhone"), listAgentEmail: text(formData, "listAgentEmail"),
  };

  const agreement = await prisma.agreement.create({
    data: {
      type: "mls_offer",
      status: "draft",
      address: offer.streetAddress,
      sellers: offer.sellers,
      companyBuyer: "True Home Capital LLC",
      offerPrice: String(offer.price),
      closingDate: offer.closeOfEscrow,
      earnestMoney: String(offer.earnestMoney),
      inspectionPeriod: String(offer.inspectionDays),
      titleOffice: offer.titleCompany || null,
      agentName: offer.listAgent || null,
      agentEmail: offer.listAgentEmail || null,
      agentPhone: offer.listAgentPhone || null,
      brokerageName: offer.listOffice || null,
      notes: text(formData, "notes") || null,
      customFields: { mlsOffer: offer, transactionDesk: { template: TD_TEMPLATE, status: "ready" }, offerPipelineStage: "offer_made" },
    },
  });
  redirect(`/admin/offers/new?mls=${encodeURIComponent(mlsNumber)}&saved=${agreement.id}`);
}
