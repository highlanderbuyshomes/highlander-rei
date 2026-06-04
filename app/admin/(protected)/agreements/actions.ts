"use server";

import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createAgreement(formData: FormData) {
  await requireAdmin();

  const type = String(formData.get("type") ?? "");
  const address = String(formData.get("address") ?? "").trim();
  const sellers = String(formData.get("sellers") ?? "").trim();

  if (!type || !address || !sellers) throw new Error("Missing required fields");

  const data = {
    type,
    address,
    sellers,
    companyBuyer:       formData.get("companyBuyer")       ? String(formData.get("companyBuyer")) : null,
    offerPrice:         formData.get("offerPrice")         ? String(formData.get("offerPrice"))   : null,
    closingDate:        formData.get("closingDate")        ? String(formData.get("closingDate"))  : null,
    earnestMoney:       formData.get("earnestMoney")       ? String(formData.get("earnestMoney")) : null,
    equityPct:          formData.get("equityPct")          ? String(formData.get("equityPct"))    : null,
    termLength:         formData.get("termLength")         ? String(formData.get("termLength"))   : null,
    agentName:          formData.get("agentName")          ? String(formData.get("agentName"))    : null,
    agentEmail:         formData.get("agentEmail")         ? String(formData.get("agentEmail"))   : null,
    agentPhone:         formData.get("agentPhone")         ? String(formData.get("agentPhone"))   : null,
    agentLicense:       formData.get("agentLicense")       ? String(formData.get("agentLicense")) : null,
    brokerageName:      formData.get("brokerageName")      ? String(formData.get("brokerageName")): null,
    listPrice:          formData.get("listPrice")          ? String(formData.get("listPrice"))    : null,
    agencyRelationship: formData.get("agencyRelationship") ? String(formData.get("agencyRelationship")) : null,
    brokerComp:         formData.get("brokerComp")         ? String(formData.get("brokerComp"))   : null,
    listingStart:       formData.get("listingStart")       ? String(formData.get("listingStart")) : null,
    listingEnd:         formData.get("listingEnd")         ? String(formData.get("listingEnd"))   : null,
    notes:              formData.get("notes")              ? String(formData.get("notes"))        : null,
  };

  const agreement = await prisma.agreement.create({ data });
  revalidatePath("/admin/agreements");
  redirect(`/admin/agreements/${agreement.id}`);
}

export async function updateAgreementStatus(id: string, formData: FormData) {
  await requireAdmin();
  const status = String(formData.get("status") ?? "");
  if (!status) return;
  await prisma.agreement.update({ where: { id }, data: { status } });
  revalidatePath("/admin/agreements");
  revalidatePath(`/admin/agreements/${id}`);
}

export async function updateAgreement(id: string, formData: FormData) {
  await requireAdmin();

  await prisma.agreement.update({
    where: { id },
    data: {
      address:            String(formData.get("address") ?? "").trim(),
      sellers:            String(formData.get("sellers") ?? "").trim(),
      companyBuyer:       formData.get("companyBuyer")       ? String(formData.get("companyBuyer"))        : null,
      offerPrice:         formData.get("offerPrice")         ? String(formData.get("offerPrice"))          : null,
      closingDate:        formData.get("closingDate")        ? String(formData.get("closingDate"))         : null,
      earnestMoney:       formData.get("earnestMoney")       ? String(formData.get("earnestMoney"))        : null,
      equityPct:          formData.get("equityPct")          ? String(formData.get("equityPct"))           : null,
      termLength:         formData.get("termLength")         ? String(formData.get("termLength"))          : null,
      agentName:          formData.get("agentName")          ? String(formData.get("agentName"))           : null,
      agentEmail:         formData.get("agentEmail")         ? String(formData.get("agentEmail"))          : null,
      agentPhone:         formData.get("agentPhone")         ? String(formData.get("agentPhone"))          : null,
      agentLicense:       formData.get("agentLicense")       ? String(formData.get("agentLicense"))        : null,
      brokerageName:      formData.get("brokerageName")      ? String(formData.get("brokerageName"))       : null,
      listPrice:          formData.get("listPrice")          ? String(formData.get("listPrice"))           : null,
      agencyRelationship: formData.get("agencyRelationship") ? String(formData.get("agencyRelationship"))  : null,
      brokerComp:         formData.get("brokerComp")         ? String(formData.get("brokerComp"))          : null,
      listingStart:       formData.get("listingStart")       ? String(formData.get("listingStart"))        : null,
      listingEnd:         formData.get("listingEnd")         ? String(formData.get("listingEnd"))          : null,
      notes:              formData.get("notes")              ? String(formData.get("notes"))               : null,
    },
  });

  revalidatePath("/admin/agreements");
  revalidatePath(`/admin/agreements/${id}`);
  redirect(`/admin/agreements/${id}`);
}

export async function deleteAgreement(id: string) {
  await requireAdmin();
  await prisma.agreement.delete({ where: { id } });
  revalidatePath("/admin/agreements");
  redirect("/admin/agreements");
}
