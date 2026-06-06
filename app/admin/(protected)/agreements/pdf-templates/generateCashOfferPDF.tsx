import { renderToBuffer } from "@react-pdf/renderer";
import CashOfferPDF, { type CashOfferPDFProps } from "./CashOfferPDF";

export async function generateCashOfferPDF(data: CashOfferPDFProps): Promise<Buffer> {
  return renderToBuffer(<CashOfferPDF {...data} />);
}
