import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { token, signerName } = await req.json();
    if (!token || !signerName) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    const agreement = await prisma.agreement.findUnique({ where: { signerToken: token } });
    if (!agreement) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (agreement.signedAt) return NextResponse.json({ error: "Already signed" }, { status: 409 });

    await prisma.agreement.update({
      where: { id: agreement.id },
      data: {
        signedAt:   new Date(),
        signerName: signerName.trim(),
        status:     "signed",
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Sign error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
