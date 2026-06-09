import { renderToBuffer } from "@react-pdf/renderer";
import ListingAgreementPDF, { type ListingAgreementPDFProps } from "./ListingAgreementPDF";

export async function generateListingAgreementPDF(data: ListingAgreementPDFProps): Promise<Buffer> {
  return renderToBuffer(<ListingAgreementPDF {...data} />);
}
