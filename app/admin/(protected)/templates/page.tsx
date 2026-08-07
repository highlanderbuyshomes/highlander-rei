import { redirect } from "next/navigation";

export default function TemplatesRedirect() {
  redirect("/admin/agreements?tab=templates");
}
