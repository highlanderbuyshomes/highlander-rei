import { verifySession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { renderToBuffer } from "@react-pdf/renderer";
import { NextRequest, NextResponse } from "next/server";
import { createElement } from "react";
import AgreementPDF from "@/app/admin/(protected)/agreements/AgreementPDF";

export async function GET(req: NextRequest) {
  const ok = await verifySession();
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const agreement = await prisma.agreement.findUnique({ where: { id } });
  if (!agreement) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buf = await renderToBuffer(createElement(AgreementPDF, { a: agreement }) as any);

  const slug = agreement.address.split(",")[0].replace(/\s+/g, "-").toLowerCase();
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="agreement-${slug}-${id.slice(-6)}.pdf"`,
    },
  });
}
