import { redirect } from "next/navigation";

export default async function TemplateFieldsRedirect({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;
  redirect(`/admin/agreements/templates/${type}`);
}
