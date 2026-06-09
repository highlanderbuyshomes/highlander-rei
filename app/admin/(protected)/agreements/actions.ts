"use server";

import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { put } from "@vercel/blob";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { randomUUID } from "crypto";
import { Resend } from "resend";
import { getAgreementFieldIssues, isAgreementDataField, resolveAgreementFields, type AgreementField } from "@/lib/agreement-fields";
import { stampAgreementData } from "@/lib/stamp-pdf";

const TYPE_LABELS: Record<string, string> = {
  cash_offer:   "Cash Offer",
  flex_equity:  "Flex Equity Program",
  listing:      "Listing Agreement",
  aif_novation: "AIF / Novation Agreement",
};
const AGREEMENT_TYPES = new Set(Object.keys(TYPE_LABELS));
const AGREEMENT_STATUSES = new Set(["draft", "sent", "signed", "completed", "void"]);
const MAX_PDF_SIZE = 20 * 1024 * 1024;

function hasBlobToken() {
  return !!process.env.BLOB_READ_WRITE_TOKEN;
}

function requireBlobToken() {
  if (!hasBlobToken()) throw new Error("Document storage is not configured.");
}

function shouldGeneratePdf() {
  if (hasBlobToken()) return true;
  if (process.env.NODE_ENV === "production") requireBlobToken();
  return false;
}

function validatePdf(file: File) {
  if (file.type !== "application/pdf") throw new Error("Agreement documents must be PDF files.");
  if (file.size > MAX_PDF_SIZE) throw new Error("Agreement PDFs must be 20 MB or smaller.");
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[char] ?? char);
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

type NewSigner = {
  name: string;
  email: string;
};

function requireUniqueSignerEmails(signers: NewSigner[]) {
  const duplicateEmail = signers.find((signer, index) =>
    signers.findIndex((candidate) => candidate.email.toLowerCase() === signer.email.toLowerCase()) !== index
  );
  if (duplicateEmail) throw new Error(`Each signer needs a unique email address. ${duplicateEmail.email} was entered more than once.`);
}

export async function createAgreement(formData: FormData) {
  await requireAdmin();

  const type    = String(formData.get("type")    ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  if (!AGREEMENT_TYPES.has(type) || !address) throw new Error("Missing or invalid required fields");

  let sellers: string;
  let pdfUrl: string | null = null;
  let customFields: AgreementField[] | undefined;
  let seller1Name: string | null = null;
  let seller2Name: string | null = null;
  let agreementDate: string | null = null;
  let cashAtClosing: string | null = null;
  let offerPrice: string | null = null;
  let earnestMoney: string | null = null;
  let titleOffice: string | null = null;
  let daysToClosing: string | null = null;
  let inspectionPeriod: string | null = null;
  let agentName: string | null = null;
  let agentEmail: string | null = null;
  let agentPhone: string | null = null;
  let agentLicense: string | null = null;
  let brokerageName: string | null = null;
  let listPrice: string | null = null;
  let agencyRelationship: string | null = null;
  let brokerComp: string | null = null;
  let listingStart: string | null = null;
  let listingEnd: string | null = null;

  const today = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  const g = (key: string) => String(formData.get(key) ?? "").trim() || null;
  const intent = formData.get("intent") === "review" ? "review" : "draft";
  const signers: NewSigner[] = [];
  const buyerSignerName = g("buyerSignerName");
  const buyerSignerEmail = g("buyerSignerEmail");
  if (!buyerSignerName || !buyerSignerEmail || !isValidEmail(buyerSignerEmail)) {
    throw new Error("Every agreement requires a valid buyer name and email.");
  }
  const addBuyerSigner = () => {
    signers.push({ name: buyerSignerName, email: buyerSignerEmail });
  };

  if (type === "flex_equity") {
    seller1Name      = g("seller1Name");
    seller2Name      = g("seller2Name");
    agreementDate    = g("agreementDate");
    offerPrice       = g("offerPrice");
    earnestMoney     = g("earnestMoney");
    cashAtClosing    = g("cashAtClosing");
    inspectionPeriod = g("inspectionPeriod");
    titleOffice      = g("titleOffice");
    daysToClosing    = g("daysToClosing");

    if (!seller1Name || !offerPrice || !earnestMoney || !cashAtClosing) {
      throw new Error("Missing required fields for Flex Equity agreement");
    }

    const seller1Email = g("seller1Email");
    const seller2Email = g("seller2Email");
    if (!seller1Email || !isValidEmail(seller1Email)) throw new Error("Enter a valid email for Seller 1.");
    if (seller2Name && (!seller2Email || !isValidEmail(seller2Email))) throw new Error("Enter a valid email for Seller 2.");
    signers.push({ name: seller1Name, email: seller1Email });
    if (seller2Name && seller2Email) signers.push({ name: seller2Name, email: seller2Email });
    addBuyerSigner();
    requireUniqueSignerEmails(signers);

    sellers = seller2Name ? `${seller1Name}, ${seller2Name}` : seller1Name;

    if (shouldGeneratePdf()) {
      const { generateFlexEquityPDF } = await import("./pdf-templates/generateFlexEquityPDF");
      const pdfBuffer = await generateFlexEquityPDF({
        agreementDate:    agreementDate ?? today,
        seller1Name,
        seller2Name:      seller2Name      ?? undefined,
        buyerName:        buyerSignerName,
        address,
        purchasePrice:    offerPrice,
        earnestMoney,
        cashAtClosing,
        inspectionPeriod: inspectionPeriod ?? undefined,
        titleOffice:      titleOffice      ?? undefined,
        daysToClosing:    daysToClosing    ?? undefined,
      });

      const blob = await put(`agreements/flex-equity-${Date.now()}.pdf`, pdfBuffer, {
        access: "public",
        contentType: "application/pdf",
      });
      pdfUrl = blob.url;
    }

  } else if (type === "cash_offer") {
    seller1Name   = g("seller1Name");
    seller2Name   = g("seller2Name");
    agreementDate = g("agreementDate");
    offerPrice    = g("offerPrice");
    earnestMoney  = g("earnestMoney");
    cashAtClosing = g("cashAtClosing");
    titleOffice   = g("titleOffice");
    daysToClosing = g("daysToClosing");

    if (!seller1Name || !offerPrice || !earnestMoney || !cashAtClosing) {
      throw new Error("Missing required fields for Cash Offer agreement");
    }

    const seller1Email = g("seller1Email");
    const seller2Email = g("seller2Email");
    if (!seller1Email || !isValidEmail(seller1Email)) throw new Error("Enter a valid email for Seller 1.");
    if (seller2Name && (!seller2Email || !isValidEmail(seller2Email))) throw new Error("Enter a valid email for Seller 2.");
    signers.push({ name: seller1Name, email: seller1Email });
    if (seller2Name && seller2Email) signers.push({ name: seller2Name, email: seller2Email });
    addBuyerSigner();
    requireUniqueSignerEmails(signers);

    sellers = seller2Name ? `${seller1Name}, ${seller2Name}` : seller1Name;

    if (shouldGeneratePdf()) {
      const { generateCashOfferPDF } = await import("./pdf-templates/generateCashOfferPDF");
      const pdfBuffer = await generateCashOfferPDF({
        agreementDate: agreementDate ?? today,
        seller1Name,
        seller2Name: seller2Name ?? undefined,
        buyerName: buyerSignerName,
        address,
        purchasePrice: offerPrice,
        earnestMoney,
        cashAtClosing,
        titleOffice:   titleOffice   ?? undefined,
        daysToClosing: daysToClosing ?? undefined,
      });
      const blob = await put(`agreements/cash-offer-${Date.now()}.pdf`, pdfBuffer, {
        access: "public",
        contentType: "application/pdf",
      });
      pdfUrl = blob.url;
    }

  } else if (type === "aif_novation") {
    seller1Name = g("seller1Name");
    seller2Name = g("seller2Name");
    agreementDate = g("agreementDate");

    if (!seller1Name) throw new Error("Missing required fields for AIF / Novation Agreement");

    const seller1Email = g("seller1Email");
    const seller2Email = g("seller2Email");
    if (!seller1Email || !isValidEmail(seller1Email)) throw new Error("Enter a valid email for Seller 1.");
    if (seller2Name && (!seller2Email || !isValidEmail(seller2Email))) throw new Error("Enter a valid email for Seller 2.");
    signers.push({ name: seller1Name, email: seller1Email });
    if (seller2Name && seller2Email) signers.push({ name: seller2Name, email: seller2Email });
    addBuyerSigner();
    requireUniqueSignerEmails(signers);

    sellers = seller2Name ? `${seller1Name}, ${seller2Name}` : seller1Name;

    const template = await prisma.agreementTemplate.findUnique({
      where: { type: "aif_novation" },
      include: { fields: { orderBy: { page: "asc" } } },
    });
    if (!template?.pdfUrl) {
      throw new Error("Upload the AIF / Novation Agreement template PDF before creating an agreement.");
    }
    if (template.fields.length === 0) {
      throw new Error("Add and save signing fields on the AIF / Novation Agreement template before creating an agreement.");
    }

    const resolvedFields = resolveAgreementFields(template.fields.map((field) => ({
      id: field.id,
      type: field.type,
      label: field.label ?? undefined,
      page: field.page,
      x: field.x,
      y: field.y,
      width: field.width,
      height: field.height,
      signerIndex: field.signerIndex,
    })), {
      type,
      seller2Name,
      signerCount: signers.length,
    });
    customFields = resolvedFields.filter((field) => !isAgreementDataField(field));

    const fieldIssues = getAgreementFieldIssues(customFields, signers.length);
    if (fieldIssues.length > 0) {
      throw new Error(`AIF / Novation template is not ready: ${fieldIssues[0]}`);
    }

    const templateResponse = await fetch(template.pdfUrl);
    if (!templateResponse.ok) throw new Error("The AIF / Novation template PDF could not be loaded.");
    const filledPdf = await stampAgreementData(await templateResponse.arrayBuffer(), resolvedFields.map((field, index) => ({
      ...field,
      id: field.id ?? `field-${index}`,
    })), {
      agreementDate: agreementDate ?? today,
      seller1Name,
      seller2Name,
      buyerName: buyerSignerName,
      propertyAddress: address,
      purchasePrice: offerPrice,
      earnestMoney,
      cashAtClosing,
      inspectionPeriod,
      titleOffice,
      daysToClosing,
    });
    const blob = await put(`agreements/aif-novation-${Date.now()}.pdf`, Buffer.from(filledPdf), {
      access: "public",
      contentType: "application/pdf",
    });
    pdfUrl = blob.url;

  } else {
    // Listing Agreement
    seller1Name   = g("seller1Name");
    seller2Name   = g("seller2Name");
    agreementDate = g("agreementDate");
    listPrice     = g("listPrice");
    listingStart  = g("listingStart");
    listingEnd    = g("listingEnd");
    agentName     = g("agentName");
    agentEmail    = g("agentEmail");
    agentPhone    = g("agentPhone");
    agentLicense  = g("agentLicense");
    brokerageName = g("brokerageName");
    agencyRelationship = g("agencyRelationship");
    brokerComp    = g("brokerComp");

    if (!seller1Name || !listPrice || !listingStart || !listingEnd) {
      throw new Error("Missing required fields for Listing Agreement");
    }

    const seller1Email = g("seller1Email");
    const seller2Email = g("seller2Email");
    if (!seller1Email || !isValidEmail(seller1Email)) throw new Error("Enter a valid email for Seller 1.");
    if (seller2Name && (!seller2Email || !isValidEmail(seller2Email))) throw new Error("Enter a valid email for Seller 2.");
    signers.push({ name: seller1Name, email: seller1Email });
    if (seller2Name && seller2Email) signers.push({ name: seller2Name, email: seller2Email });
    addBuyerSigner();
    requireUniqueSignerEmails(signers);

    sellers = seller2Name ? `${seller1Name}, ${seller2Name}` : seller1Name;

    if (shouldGeneratePdf()) {
      const { generateListingAgreementPDF } = await import("./pdf-templates/generateListingAgreementPDF");
      const pdfBuffer = await generateListingAgreementPDF({
        agreementDate: agreementDate ?? today,
        seller1Name,
        seller2Name: seller2Name ?? undefined,
        address,
        listPrice,
        listingStart,
        listingEnd,
        agentName:         agentName ?? undefined,
        brokerageName:     brokerageName ?? undefined,
        brokerComp:        brokerComp ?? undefined,
        agencyRelationship: agencyRelationship ?? undefined,
      });
      const blob = await put(`agreements/listing-${Date.now()}.pdf`, pdfBuffer, {
        access: "public",
        contentType: "application/pdf",
      });
      pdfUrl = blob.url;
    }
  }

  const agreement = await prisma.agreement.create({
    data: {
      type,
      address,
      sellers,
      companyBuyer: buyerSignerName,
      seller1Name,
      seller2Name,
      agreementDate,
      cashAtClosing,
      offerPrice,
      earnestMoney,
      titleOffice,
      daysToClosing,
      inspectionPeriod,
      agentName,
      agentEmail,
      agentPhone,
      agentLicense,
      brokerageName,
      listPrice,
      agencyRelationship,
      brokerComp,
      listingStart,
      listingEnd,
      signerName:  signers[0]?.name ?? null,
      signerEmail: signers[0]?.email ?? null,
      notes:       formData.get("notes")       ? String(formData.get("notes"))       : null,
      pdfUrl,
      customFields,
      status: "draft",
      signers: {
        create: signers.map((signer, order) => ({
          ...signer,
          order,
          token: randomUUID(),
        })),
      },
    },
  });

  revalidatePath("/admin/agreements");
  redirect(`/admin/agreements/${agreement.id}${intent === "review" ? "?review=send" : ""}`);
}

export async function updateAgreementStatus(id: string, formData: FormData) {
  await requireAdmin();
  const status = String(formData.get("status") ?? "");
  if (!AGREEMENT_STATUSES.has(status)) throw new Error("Invalid agreement status");
  if (status === "signed" || status === "completed") {
    const agreement = await prisma.agreement.findUnique({
      where: { id },
      select: { signedAt: true, signers: { select: { signedAt: true } } },
    });
    if (!agreement) throw new Error("Agreement not found");
    const allSigned = agreement.signers.length > 0
      ? agreement.signers.every((signer) => !!signer.signedAt)
      : !!agreement.signedAt;
    if (!allSigned) throw new Error("All signers must sign before the agreement can be completed.");
  }
  await prisma.agreement.update({ where: { id }, data: { status } });
  revalidatePath("/admin/agreements");
  revalidatePath(`/admin/agreements/${id}`);
}

export async function updateAgreement(id: string, formData: FormData) {
  await requireAdmin();

  const file = formData.get("pdfFile") as File | null;
  let pdfUrl: string | undefined;
  if (file && file.size > 0) {
    requireBlobToken();
    validatePdf(file);
    const blob = await put(`agreements/${Date.now()}-${file.name.replace(/\s+/g, "-")}`, file, { access: "public" });
    pdfUrl = blob.url;
  }

  await prisma.agreement.update({
    where: { id },
    data: {
      address:     String(formData.get("address") ?? "").trim(),
      sellers:     String(formData.get("sellers") ?? "").trim(),
      signerName:  formData.get("signerName")  ? String(formData.get("signerName"))  : null,
      signerEmail: formData.get("signerEmail") ? String(formData.get("signerEmail")) : null,
      notes:       formData.get("notes")       ? String(formData.get("notes"))       : null,
      ...(pdfUrl ? { pdfUrl } : {}),
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

// ── Signer management ──────────────────────────────────────────────────────────

export async function addSigner(agreementId: string, formData: FormData) {
  await requireAdmin();
  const name      = String(formData.get("name")      ?? "").trim();
  const email     = String(formData.get("email")     ?? "").trim();
  const contactId = formData.get("contactId") ? String(formData.get("contactId")) : null;
  if (!name || !email) return;

  const last = await prisma.agreementSigner.findFirst({
    where: { agreementId },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  await prisma.agreementSigner.create({
    data: {
      agreementId,
      contactId,
      name,
      email,
      order: (last?.order ?? -1) + 1,
      token: randomUUID(),
    },
  });

  revalidatePath(`/admin/agreements/${agreementId}`);
}

export async function removeSigner(signerId: string) {
  await requireAdmin();
  const s = await prisma.agreementSigner.findUnique({ where: { id: signerId } });
  if (!s) return;
  await prisma.agreementSigner.delete({ where: { id: signerId } });
  revalidatePath(`/admin/agreements/${s.agreementId}`);
}

export async function sendSigningLinks(agreementId: string) {
  await requireAdmin();

  const agreement = await prisma.agreement.findUnique({
    where: { id: agreementId },
    include: { signers: { orderBy: { order: "asc" } } },
  });
  if (!agreement) return { ok: false, error: "Agreement not found." };
  if (agreement.signers.length === 0) return { ok: false, error: "Add at least one signer before sending." };
  if (!agreement.pdfUrl) return { ok: false, error: "Attach or generate the agreement PDF before sending signing links." };
  const fields = Array.isArray(agreement.customFields)
    ? agreement.customFields as AgreementField[]
    : null;
  const fieldIssues = getAgreementFieldIssues(fields, agreement.signers.length);
  if (fieldIssues.length > 0) return { ok: false, error: fieldIssues[0] };

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://highlanderrei.com";
  const resendKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? "noreply@highlanderrei.com";
  if (!resendKey) return { ok: false, error: "Email delivery is not configured. Add RESEND_API_KEY first." };
  const resend = new Resend(resendKey);

  const unsent = agreement.signers.filter((s) => !s.emailedAt);
  if (unsent.length === 0) return { ok: false, error: "All signing links have already been sent." };

  let sent = 0;
  for (const signer of unsent) {
    const signingUrl = `${baseUrl}/sign/${signer.token}`;
    const typeLabel = TYPE_LABELS[agreement.type] ?? agreement.type;
    const safeName = escapeHtml(signer.name);
    const safeTypeLabel = escapeHtml(typeLabel);
    const safeAddress = escapeHtml(agreement.address);
    const safeSigningUrl = escapeHtml(signingUrl);

    const { error } = await resend.emails.send({
      from: fromEmail,
      to: signer.email,
      subject: `Action required: Please sign your ${typeLabel}`,
      html: `
          <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px">
            <div style="background:#111110;padding:18px 24px;border-radius:8px 8px 0 0">
              <p style="font-size:10px;color:#888;letter-spacing:1.5px;text-transform:uppercase;margin:0 0 4px">Highlander</p>
              <p style="font-size:20px;font-family:Georgia,serif;color:#fff;letter-spacing:3px;margin:0">REI<span style="color:#B8962E">.</span></p>
            </div>
            <div style="background:#fafaf8;border:1px solid #e8e7e2;border-top:none;border-radius:0 0 8px 8px;padding:28px 24px">
              <h2 style="font-size:17px;color:#111;margin:0 0 12px">Hi ${safeName},</h2>
              <p style="font-size:14px;color:#333;line-height:1.6;margin:0 0 20px">
                You have a <strong>${safeTypeLabel}</strong> ready for your signature regarding the property at:<br/>
                <strong style="color:#111">${safeAddress}</strong>
              </p>
              <a href="${safeSigningUrl}" style="display:inline-block;background:#111110;color:#fff;padding:12px 28px;border-radius:6px;font-size:14px;font-weight:600;text-decoration:none;letter-spacing:0.3px">
                Review &amp; Sign →
              </a>
              <p style="font-size:12px;color:#aaa;margin:20px 0 0">
                Or copy this link: ${safeSigningUrl}
              </p>
            </div>
          </div>
      `,
    });
    if (error) {
      console.error("Signing email delivery failed:", { signerId: signer.id, error });
      continue;
    }

    await prisma.agreementSigner.update({
      where: { id: signer.id },
      data:  { emailedAt: new Date() },
    });
    sent += 1;
  }

  if (sent === 0) return { ok: false, error: "No signing links were delivered. Check the email configuration and try again." };

  await prisma.agreement.update({
    where: { id: agreementId },
    data:  { status: "sent" },
  });

  revalidatePath("/admin/agreements");
  revalidatePath(`/admin/agreements/${agreementId}`);
  return { ok: true, sent };
}

export async function saveAgreementFields(
  agreementId: string,
  fields: AgreementField[]
) {
  await requireAdmin();
  const signerCount = await prisma.agreementSigner.count({ where: { agreementId } });
  const issues = getAgreementFieldIssues(fields, signerCount);
  if (issues.length > 0) throw new Error(issues[0]);
  await prisma.agreement.update({
    where: { id: agreementId },
    data:  { customFields: fields },
  });
  revalidatePath(`/admin/agreements/${agreementId}`);
}
