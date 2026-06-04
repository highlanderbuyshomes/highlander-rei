import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  // Require API key for cross-origin submissions
  const apiKey = req.headers.get("x-api-key");
  if (apiKey !== process.env.LEADS_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, email, phone, message, type, company, source } = body;
    if (!name || !email) return NextResponse.json({ error: "Missing name/email" }, { status: 400 });

    await prisma.lead.create({
      data: { name, email, phone: phone ?? null, message: message ?? null, type: type ?? null, company: company ?? null, source: source ?? null },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Lead intake error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
