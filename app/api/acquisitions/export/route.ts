import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

function escapeCell(val: string): string {
  if (/^[=+\-@\t\r]/.test(val)) return `'${val}`;
  if (val.includes(",") || val.includes('"') || val.includes("\n")) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

function cell(val: unknown): string {
  if (val == null || val === "") return "";
  return escapeCell(String(val));
}

export async function GET(req: NextRequest) {
  if (!(await verifySession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const zip = searchParams.get("zip");
  const city = searchParams.get("city");
  const importRunId = searchParams.get("importRunId");

  const where: Record<string, unknown> = {};
  if (zip) where.zip = zip;
  if (city) where.city = { contains: city, mode: "insensitive" };
  if (importRunId) where.importRunId = importRunId;

  const properties = await prisma.property.findMany({
    where,
    include: { owners: { take: 1 } },
    orderBy: { createdAt: "desc" },
    take: 5000,
  });

  const headers = [
    "Address", "City", "State", "ZIP", "Property Type",
    "Beds", "Baths", "Sqft", "Lot Sqft", "Year Built",
    "Estimated Value", "Last Sale Date", "Last Sale Price",
    "Owner Name", "Owner Mailing Address", "Owner Mailing City",
    "Owner Mailing State", "Owner Mailing ZIP", "Owner Occupied",
    "Estimated Equity", "Estimated Equity %", "Phone", "Email",
  ];

  const rows = properties.map((p) => {
    const o = p.owners[0];
    return [
      cell(p.streetAddress), cell(p.city), cell(p.state), cell(p.zip), cell(p.propertyType),
      cell(p.beds), cell(p.baths), cell(p.sqft), cell(p.lotSqft), cell(p.yearBuilt),
      cell(p.estimatedValue), cell(p.lastSaleDate ? new Date(p.lastSaleDate).toLocaleDateString() : ""), cell(p.lastSalePrice),
      cell(o?.fullName ?? [o?.firstName, o?.lastName].filter(Boolean).join(" ")),
      cell(o?.mailingAddress), cell(o?.mailingCity), cell(o?.mailingState), cell(o?.mailingZip),
      cell(o?.ownerOccupied != null ? (o.ownerOccupied ? "Yes" : "No") : ""),
      cell(o?.estimatedEquity), cell(o?.estimatedEquityPct), cell(o?.phone), cell(o?.email),
    ].join(",");
  });

  const csv = [headers.join(","), ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="acquisitions-export-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
