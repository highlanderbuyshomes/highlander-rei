import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/session";

const BASE = "https://www.chatarv.ai/api/public";

function apiKey() {
  const k = process.env.CHAT_ARV_API_KEY;
  if (!k) throw new Error("CHAT_ARV_API_KEY not configured");
  return k;
}

// POST /api/underwriting — start async comp analysis, return requestRunId
export async function POST(req: NextRequest) {
  if (!(await verifySession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { address } = await req.json();
  if (!address?.trim()) {
    return NextResponse.json({ error: "Address is required" }, { status: 400 });
  }

  const res = await fetch(`${BASE}/comps/async`, {
    method: "POST",
    headers: {
      "X-API-KEY": apiKey(),
      "Content-Type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({ address: address.trim() }),
  });

  const data = await res.json();
  if (!res.ok) {
    return NextResponse.json({ error: data.error ?? "Chat ARV error" }, { status: res.status });
  }

  return NextResponse.json({ requestRunId: data.requestRunId });
}

// GET /api/underwriting?id=xxx — poll for result
export async function GET(req: NextRequest) {
  if (!(await verifySession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const res = await fetch(`${BASE}/comps/result/${id}`, {
    headers: { "X-API-KEY": apiKey(), accept: "application/json" },
  });

  return NextResponse.json(await res.json());
}
