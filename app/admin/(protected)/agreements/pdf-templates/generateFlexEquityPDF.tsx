import { renderToBuffer } from "@react-pdf/renderer";
import FlexEquityPDF, { type FlexEquityPDFProps } from "./FlexEquityPDF";

export async function generateFlexEquityPDF(data: FlexEquityPDFProps): Promise<Buffer> {
  return renderToBuffer(<FlexEquityPDF {...data} />);
}
