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

    const { firstName, lastName, email, phone, address, message, type } = data;

    await prisma.lead.create({
      data: {
        name:    [firstName, lastName].filter(Boolean).join(" ") || email,
        email,
        phone:   phone   ?? null,
        message: address ? `Property: ${address}${message ? ` — ${message}` : ""}` : (message ?? null),
        type:    type    ?? "buyer",
        source:  "highlander-rei",
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Buyer inquiry error:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
