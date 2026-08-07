import { redirect } from "next/navigation";

export default function PasswordRedirect() {
  redirect("/admin/settings?tab=password");
}
