import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { firstName, lastName, email, phone, address, message, type } = data;

    if (email) {
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
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Buyer inquiry error:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
