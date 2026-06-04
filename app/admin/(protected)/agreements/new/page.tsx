import type { Metadata } from "next";
import NewAgreementForm from "./NewAgreementForm";

export const metadata: Metadata = { title: "New Agreement | Highlander REI" };

export default async function NewAgreementPage({
  searchParams,
}: {
  searchParams: Promise<{ template?: string }>;
}) {
  const { template } = await searchParams;
  return <NewAgreementForm defaultType={template ?? ""} />;
}
