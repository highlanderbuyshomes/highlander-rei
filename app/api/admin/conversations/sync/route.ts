import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdminApi } from "@/lib/session";
import { syncGhlConversations } from "@/lib/integrations/ghl-conversations";

export const maxDuration = 60;

// Refresh button on Our Buyers > Conversations: a short incremental pull.
export async function POST() {
  if (!(await requireAdminApi())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const result = await syncGhlConversations(40_000);
  revalidatePath("/admin/buyers");
  return NextResponse.json(result, { status: result.error ? 502 : 200 });
}
