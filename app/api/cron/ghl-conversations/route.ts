import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { syncGhlConversations } from "@/lib/integrations/ghl-conversations";

// Called by .github/workflows/ghl-conversations.yml. The repo is public:
// the response carries counts only, never contact or message data.
export const maxDuration = 300;

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const given = req.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  return given.length === expected.length && timingSafeEqual(Buffer.from(given), Buffer.from(expected));
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const result = await syncGhlConversations(240_000);
  revalidatePath("/admin/buyers");
  return NextResponse.json(result, { status: result.error ? 502 : 200 });
}
