import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateLeadRequest } from "@/lib/leadGuard";

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const validation = validateLeadRequest(req, data);
    if (!validation.ok) {
      if (validation.status === 204) return new NextResponse(null, { status: 204 });
      return NextResponse.json({ error: validation.message }, { status: validation.status });
    }

    const { firstName, lastName, email, phone, message } = data;

    await prisma.lead.create({
      data: {
        name:    [firstName, lastName].filter(Boolean).join(" ") || email,
        email,
        phone:   phone   ?? null,
        message: message ?? null,
        type:    "investor",
        source:  "highlander-rei",
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Investor inquiry error:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
