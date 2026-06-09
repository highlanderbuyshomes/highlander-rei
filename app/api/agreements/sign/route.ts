import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { stampPdf } from "@/lib/stamp-pdf";
import { put } from "@vercel/blob";
import { Resend } from "resend";
import { resolveAgreementFields, type AgreementField } from "@/lib/agreement-fields";

const MAX_REQUEST_SIZE = 750_000;
const MAX_SIGNATURE_SIZE = 500_000;
const MAX_FIELDS = 50;

const TYPE_LABELS: Record<string, string> = {
  cash_offer:   "Cash Offer",
  flex_equity:  "Flex Equity Program",
  listing:      "Listing Agreement",
  aif_novation: "AIF / Novation Agreement",
};

function invalid(error: string, status = 400) {
  return NextResponse.json({ error }, { status });
}

function cleanFields(value: unknown): Record<string, string> | null {
  if (value === undefined) return {};
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  const entries = Object.entries(value);
  if (entries.length > MAX_FIELDS) return null;

  const fields: Record<string, string> = {};
  for (const [key, fieldValue] of entries) {
    if (key.length > 100 || typeof fieldValue !== "string" || fieldValue.length > 2_000) return null;
    fields[key] = fieldValue;
  }
  return fields;
}

async function finalizeAgreement(agreementId: string) {
  const agreement = await prisma.agreement.findUnique({
    where: { id: agreementId },
    include: {
      signers: { orderBy: { order: "asc" } },
    },
  });
  if (!agreement) return;

  const typeLabel = TYPE_LABELS[agreement.type] ?? agreement.type;

  // ── 1. Stamp PDF ─────────────────────────────────────────────────────────
  let completedPdfUrl: string | null = null;

  if (agreement.pdfUrl && process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      // Use per-agreement custom fields if saved, otherwise fall back to template fields
      const customFields = Array.isArray(agreement.customFields)
        ? (agreement.customFields as AgreementField[])
        : null;

      let stampFields: { id: string; type: string; page: number; x: number; y: number; width: number; height: number; signerIndex: number }[];

      if (customFields) {
        stampFields = customFields.map((f, i) => ({ ...f, id: f.id ?? `cf-${i}` }));
      } else {
        const template = await prisma.agreementTemplate.findUnique({
          where: { type: agreement.type },
          include: { fields: { orderBy: { page: "asc" } } },
        });
        stampFields = resolveAgreementFields((template?.fields ?? []).map((field) => ({
          ...field,
          label: field.label ?? undefined,
        })), {
          type: agreement.type,
          seller2Name: agreement.seller2Name,
          signerCount: agreement.signers.length,
        }).map((field, index) => ({ ...field, id: field.id ?? `tf-${index}` }));
      }

      if (stampFields.length) {
        const pdfRes = await fetch(agreement.pdfUrl);
        const pdfBytes = await pdfRes.arrayBuffer();

        const signers = agreement.signers
          .filter(s => s.signedAt && s.fieldData)
          .map(s => ({
            order: s.order,
            fieldData: s.fieldData as Record<string, string>,
          }));

        const stamped = await stampPdf(pdfBytes, stampFields, signers);

        const blob = await put(
          `agreements/executed-${agreementId}-${Date.now()}.pdf`,
          Buffer.from(stamped),
          { access: "public", contentType: "application/pdf" }
        );
        completedPdfUrl = blob.url;

        await prisma.agreement.update({
          where: { id: agreementId },
          data:  { completedPdfUrl },
        });
      }
    } catch (err) {
      console.error("PDF stamping failed:", err);
    }
  }

  // ── 2. Send completion emails ─────────────────────────────────────────────
  const resendKey  = process.env.RESEND_API_KEY;
  const fromEmail  = process.env.RESEND_FROM_EMAIL ?? "noreply@highlanderrei.com";
  const adminEmail = process.env.ADMIN_EMAIL ?? process.env.RESEND_FROM_EMAIL;

  if (!resendKey) return;

  const resend = new Resend(resendKey);

  const pdfLink = completedPdfUrl ?? agreement.pdfUrl;
  const pdfButton = pdfLink
    ? `<a href="${pdfLink}" style="display:inline-block;background:#B8962E;color:#fff;padding:10px 24px;border-radius:6px;font-size:14px;font-weight:600;text-decoration:none;margin-top:12px">Download Executed Agreement →</a>`
    : "";

  const signerNames = agreement.signers.map(s => s.name).join(", ");

  const bodyHtml = (recipientName: string) => `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px">
      <div style="background:#111110;padding:18px 24px;border-radius:8px 8px 0 0">
        <p style="font-size:10px;color:#888;letter-spacing:1.5px;text-transform:uppercase;margin:0 0 4px">Highlander</p>
        <p style="font-size:20px;font-family:Georgia,serif;color:#fff;letter-spacing:3px;margin:0">REI<span style="color:#B8962E">.</span></p>
      </div>
      <div style="background:#fafaf8;border:1px solid #e8e7e2;border-top:none;border-radius:0 0 8px 8px;padding:28px 24px">
        <h2 style="font-size:17px;color:#111;margin:0 0 12px">Hi ${recipientName},</h2>
        <p style="font-size:14px;color:#333;line-height:1.6;margin:0 0 8px">
          Your <strong>${typeLabel}</strong> for <strong style="color:#111">${agreement.address}</strong> has been fully executed.
        </p>
        <p style="font-size:13px;color:#666;margin:0 0 4px">Signed by: ${signerNames}</p>
        <p style="font-size:13px;color:#666;margin:0 0 16px">Date: ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
        ${pdfButton}
        <p style="font-size:12px;color:#aaa;margin:24px 0 0">This is an automated message from Highlander REI.</p>
      </div>
    </div>
  `;

  // Email every signer
  const recipients = [
    ...agreement.signers.map(s => ({ name: s.name, email: s.email })),
    ...(adminEmail ? [{ name: "Highlander REI", email: adminEmail }] : []),
  ];

  await Promise.allSettled(
    recipients.map(r =>
      resend.emails.send({
        from: fromEmail,
        to:   r.email,
        subject: `Executed: ${typeLabel} — ${agreement.address}`,
        html:  bodyHtml(r.name),
      })
    )
  );
}

export async function POST(req: NextRequest) {
  try {
    const contentLength = Number(req.headers.get("content-length") ?? 0);
    if (contentLength > MAX_REQUEST_SIZE) return invalid("Signature submission is too large.", 413);

    const { token, signerName, signatureData, signatureType, fieldData } = await req.json();
    if (typeof token !== "string" || !token || token.length > 100) return invalid("Invalid signing link.");
    if (typeof signerName !== "string" || !signerName.trim() || signerName.length > 200) return invalid("A valid signer name is required.");
    if (signatureType !== "draw" && signatureType !== "type") return invalid("Choose a valid signature method.");
    if (typeof signatureData !== "string" || !signatureData || signatureData.length > MAX_SIGNATURE_SIZE) return invalid("A valid signature is required.");
    if (signatureType === "draw" && !signatureData.startsWith("data:image/png;base64,")) return invalid("Drawn signature data is invalid.");
    if (signatureType === "type" && signatureData.trim() !== signerName.trim()) return invalid("Typed signature must match the signer name.");

    const cleanedFields = cleanFields(fieldData);
    if (!cleanedFields) return invalid("One or more agreement fields are invalid.");

    // Try new AgreementSigner system first
    const signer = await prisma.agreementSigner.findUnique({
      where: { token },
      include: { agreement: true },
    });

    if (signer) {
      if (signer.signedAt) return NextResponse.json({ error: "Already signed" }, { status: 409 });
      if (signer.agreement.status === "void") return invalid("This agreement has been voided.", 409);
      if (!signer.agreement.pdfUrl) return invalid("This agreement document is unavailable.", 409);

      const storedData = {
        ...cleanedFields,
        signatureData,
        signatureType,
      };

      const updated = await prisma.agreementSigner.updateMany({
        where: { id: signer.id, signedAt: null },
        data: {
          signedAt:  new Date(),
          fieldData: storedData,
        },
      });
      if (updated.count === 0) return invalid("This agreement has already been signed.", 409);

      const remaining = await prisma.agreementSigner.count({
        where: { agreementId: signer.agreementId, signedAt: null },
      });

      if (remaining === 0) {
        await prisma.agreement.updateMany({
          where: { id: signer.agreementId, status: { not: "void" } },
          data:  { status: "completed" },
        });
        // Fire stamp + email in background (don't await — don't block the signer's response)
        finalizeAgreement(signer.agreementId).catch(err =>
          console.error("finalizeAgreement failed:", err)
        );
      }

      return NextResponse.json({ ok: true });
    }

    // Fallback: legacy Agreement.signerToken
    const agreement = await prisma.agreement.findUnique({ where: { signerToken: token } });
    if (!agreement) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (agreement.signedAt) return NextResponse.json({ error: "Already signed" }, { status: 409 });
    if (agreement.status === "void") return invalid("This agreement has been voided.", 409);
    if (!agreement.pdfUrl) return invalid("This agreement document is unavailable.", 409);

    const updated = await prisma.agreement.updateMany({
      where: { id: agreement.id, signedAt: null, status: { not: "void" } },
      data: {
        signedAt:   new Date(),
        signerName: signerName.trim(),
        status:     "signed",
      },
    });
    if (updated.count === 0) return invalid("This agreement has already been signed or voided.", 409);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Sign error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
