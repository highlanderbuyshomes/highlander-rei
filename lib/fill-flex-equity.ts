import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

export type FlexEquityFillData = {
  agreementDate: string;
  seller1Name: string;
  seller2Name?: string;
  address: string;
  purchasePrice: string;
  earnestMoney: string;
  cashAtClosing: string;
  inspectionPeriod?: string;
  titleOffice?: string;
  daysToClosing?: string;
};

// Page 1 is 612 × 792 pts. pdf-lib origin = bottom-left.
// Coordinates measured from the blank cells in the template PDF.
const BLACK = rgb(0.05, 0.05, 0.05);
const CELL_X = 165;   // left edge of right-value column in property table
const CELL_W = 389;   // width of value cell (to right margin ~58)

// Party box right-cell x (label col is narrower)
const PARTY_X = 150;
const PARTY_W = 404;

export async function fillFlexEquityTemplate(
  templateBytes: ArrayBuffer,
  data: FlexEquityFillData
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(templateBytes);
  const page1  = pdfDoc.getPages()[0];
  const font   = await pdfDoc.embedFont(StandardFonts.Helvetica);

  function draw(x: number, y: number, text: string, maxWidth = 300) {
    if (!text) return;
    page1.drawText(text, {
      x, y,
      size: 9,
      font,
      color: BLACK,
      maxWidth,
    });
  }

  // ── Agreement date (after "THIS AGREEMENT is made this ") ──────────────────
  draw(333, 664, data.agreementDate, 180);

  // ── Party name cells ────────────────────────────────────────────────────────
  draw(PARTY_X, 625, data.seller1Name, PARTY_W);
  draw(PARTY_X, 548, data.seller2Name ?? "N/A", PARTY_W);
  draw(PARTY_X, 471, "Highlander REI LLC", PARTY_W);

  // ── Property details table ──────────────────────────────────────────────────
  draw(CELL_X, 354, data.address,         CELL_W);
  draw(CELL_X, 315, data.purchasePrice,   CELL_W);
  draw(CELL_X, 278, data.earnestMoney,    CELL_W);
  draw(CELL_X, 237, data.cashAtClosing,   CELL_W);
  draw(CELL_X, 196, data.inspectionPeriod ?? "10 Business Days", CELL_W);
  draw(CELL_X, 157, data.titleOffice ?? "Magnus AZ Title Agency", CELL_W);
  draw(CELL_X, 118, data.daysToClosing ?? "30", CELL_W);

  return pdfDoc.save();
}
