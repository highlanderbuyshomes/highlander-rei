import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  if (!(await verifySession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const webhookUrl = process.env.GHL_WEBHOOK_URL;
  if (!webhookUrl) {
    return NextResponse.json({ error: "GHL_WEBHOOK_URL is not configured. Add it in Vercel environment variables." }, { status: 500 });
  }

  const body = await req.json();
  const { propertyIds, zip, city } = body;

  let properties;
  if (propertyIds === "all") {
    const where: Record<string, unknown> = {};
    if (zip) where.zip = zip;
    if (city) where.city = { contains: city, mode: "insensitive" };
    properties = await prisma.property.findMany({
      where,
      include: { owners: { take: 1 } },
      take: 500,
    });
  } else if (Array.isArray(propertyIds) && propertyIds.length > 0) {
    properties = await prisma.property.findMany({
      where: { id: { in: propertyIds } },
      include: { owners: { take: 1 } },
    });
  } else {
    return NextResponse.json({ error: "propertyIds (array or 'all') is required" }, { status: 400 });
  }

  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const p of properties) {
    const o = p.owners[0];
    const payload = {
      firstName: o?.firstName ?? "",
      lastName: o?.lastName ?? "",
      name: o?.fullName ?? [o?.firstName, o?.lastName].filter(Boolean).join(" ") ?? "",
      email: o?.email ?? "",
      phone: o?.phone ?? "",
      address1: p.streetAddress,
      city: p.city,
      state: p.state,
      postalCode: p.zip,
      source: "Highlander REI Acquisitions",
      tags: ["acquisition-lead"],
      customField: {
        property_type: p.propertyType ?? "",
        beds: p.beds?.toString() ?? "",
        baths: p.baths?.toString() ?? "",
        sqft: p.sqft?.toString() ?? "",
        estimated_value: p.estimatedValue?.toString() ?? "",
        estimated_equity: o?.estimatedEquity?.toString() ?? "",
        equity_pct: o?.estimatedEquityPct?.toString() ?? "",
        year_built: p.yearBuilt?.toString() ?? "",
        owner_occupied: o?.ownerOccupied != null ? (o.ownerOccupied ? "Yes" : "No") : "",
        mailing_address: [o?.mailingAddress, o?.mailingCity, o?.mailingState, o?.mailingZip].filter(Boolean).join(", "),
      },
    };

    try {
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        failed++;
        errors.push(`${p.streetAddress}: ${res.status}`);
      } else {
        sent++;
      }
    } catch (err) {
      failed++;
      errors.push(`${p.streetAddress}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return NextResponse.json({ sent, failed, total: properties.length, errors: errors.slice(0, 20) });
}
