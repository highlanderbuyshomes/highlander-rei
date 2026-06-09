import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

type TemplateField = {
  id: string;
  type: string;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  signerIndex: number;
};

export async function stampAgreementData(
  pdfBytes: ArrayBuffer,
  fields: TemplateField[],
  values: Record<string, string | null | undefined>
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pages = pdfDoc.getPages();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  for (const field of fields) {
    if (!field.type.startsWith("data:")) continue;
    const value = values[field.type.slice(5)]?.trim();
    const page = pages[field.page - 1];
    if (!value || !page) continue;

    const { width: pw, height: ph } = page.getSize();
    const x = field.x * pw;
    const fieldW = field.width * pw;
    const fieldH = field.height * ph;
    const y = ph - (field.y * ph) - fieldH;
    const fontSize = Math.min(fieldH * 0.62, 11);

    page.drawText(value, {
      x: x + 3,
      y: y + fieldH / 2 - fontSize / 3,
      size: fontSize,
      font,
      color: rgb(0.05, 0.05, 0.05),
      maxWidth: fieldW - 6,
    });
  }

  return pdfDoc.save();
}

type SignerData = {
  order: number;
  fieldData: Record<string, string>;
};

/**
 * Overlays collected signatures, initials, dates, and text onto the original PDF.
 * Field coordinates are 0–1 normalized (top-left origin from PdfFieldEditor).
 * Returns the stamped PDF as a Uint8Array.
 */
export async function stampPdf(
  pdfBytes: ArrayBuffer,
  fields: TemplateField[],
  signers: SignerData[]
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pages = pdfDoc.getPages();
  const font     = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const signerByOrder = new Map(signers.map(s => [s.order, s]));

  for (const field of fields) {
    const page = pages[field.page - 1];
    if (!page) continue;

    const signer = signerByOrder.get(field.signerIndex);
    if (!signer) continue;

    const { width: pw, height: ph } = page.getSize();
    const x      = field.x      * pw;
    const fieldW = field.width  * pw;
    const fieldH = field.height * ph;
    // PdfFieldEditor uses top-left origin; pdf-lib uses bottom-left
    const y = ph - (field.y * ph) - fieldH;

    if (field.type === "signature") {
      const sigData = signer.fieldData.signatureData ?? "";
      const sigType = signer.fieldData.signatureType ?? "";

      if (sigType === "draw" && sigData.startsWith("data:image/png;base64,")) {
        try {
          const imgBytes = Buffer.from(sigData.split(",")[1], "base64");
          const img = await pdfDoc.embedPng(imgBytes);
          const scale = Math.min(fieldW / img.width, fieldH / img.height);
          const width = img.width * scale;
          const height = img.height * scale;
          page.drawImage(img, {
            x: x + (fieldW - width) / 2,
            y: y + (fieldH - height) / 2,
            width,
            height,
          });
        } catch { /* skip if PNG embedding fails */ }
      } else if (sigData) {
        // Typed signature — render in italic-style bold
        const fontSize = Math.min(fieldH * 0.6, 16);
        page.drawText(sigData, {
          x: x + 4,
          y: y + fieldH / 2 - fontSize / 3,
          size: fontSize,
          font: boldFont,
          color: rgb(0.05, 0.05, 0.05),
          maxWidth: fieldW - 8,
        });
        page.drawLine({
          start: { x, y: y + 2 },
          end:   { x: x + fieldW, y: y + 2 },
          thickness: 0.5,
          color: rgb(0.5, 0.5, 0.5),
        });
      }
    } else {
      // initials / date / text — keyed by field id in fieldData
      const value = signer.fieldData[field.id] ?? "";
      if (!value) continue;

      const fontSize = Math.min(fieldH * 0.6, 10);
      page.drawText(value, {
        x: x + 3,
        y: y + fieldH / 2 - fontSize / 3,
        size: fontSize,
        font,
        color: rgb(0.05, 0.05, 0.05),
        maxWidth: fieldW - 6,
      });
    }
  }

  return pdfDoc.save();
}
