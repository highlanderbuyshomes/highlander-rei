import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/session";
import { loadRowsByIds } from "@/lib/search/load";

export async function GET(req: NextRequest) {
  if (!(await requireAdminApi())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id query parameter is required" }, { status: 400 });

  const rows = await loadRowsByIds([id]);
  const row = rows[0];

  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(row);
}
