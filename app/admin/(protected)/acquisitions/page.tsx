import { redirect } from "next/navigation";

export default async function AcquisitionsRedirect({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  redirect(tab === "machine" ? "/admin/offers" : "/admin/search");
}
