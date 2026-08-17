import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/session";
import { prisma } from "@/lib/prisma";

function normalizePhone(value: string): string | null {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return value.startsWith("+") && digits.length >= 10 ? `+${digits}` : null;
}

export async function POST(request: Request) {
  if (!(await requireAdminApi())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dialerUrl = process.env.COLD_CALL_DOGS_URL;
  const sharedSecret = process.env.INTEGRATION_SHARED_SECRET;
  if (!dialerUrl || !sharedSecret) {
    return NextResponse.json(
      { error: "Dialer integration is not configured." },
      { status: 503 }
    );
  }

  const body = await request.json().catch(() => null);
  const requestedLimit = typeof body?.limit === "number" ? body.limit : 100;
  const limit = Math.max(1, Math.min(500, Math.floor(requestedLimit)));
  const assignmentIds = Array.isArray(body?.assignmentIds)
    ? body.assignmentIds.filter((value: unknown): value is string => typeof value === "string")
    : null;

  const assignments = await prisma.callAssignment.findMany({
    where: {
      status: "pending",
      ...(assignmentIds?.length ? { id: { in: assignmentIds } } : {}),
    },
    include: {
      acquisitionLead: {
        include: {
          property: {
            include: {
              owners: {
                include: { contactPoints: true },
                orderBy: { updatedAt: "desc" },
              },
              mlsListings: { orderBy: { updatedAt: "desc" }, take: 1 },
            },
          },
        },
      },
    },
    orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
    take: limit,
  });

  const candidates = assignments.flatMap((assignment) => {
    const property = assignment.acquisitionLead.property;
    const owner = property.owners.find((candidate) => {
      const phonePoint = candidate.contactPoints.find(
        (point) => point.kind === "phone" && point.dncStatus !== "blocked"
      );
      return Boolean(phonePoint?.value || candidate.phone);
    });
    if (!owner) return [];

    const phonePoint = owner.contactPoints.find(
      (point) => point.kind === "phone" && point.dncStatus !== "blocked"
    );
    const phone = normalizePhone(phonePoint?.value ?? owner.phone ?? "");
    if (!phone) return [];

    const emailPoint = owner.contactPoints.find((point) => point.kind === "email");
    const latestListing = property.mlsListings[0];
    const name = owner.fullName ?? [owner.firstName, owner.lastName].filter(Boolean).join(" ");

    return [{
      assignment,
      phone,
      payload: {
        assignmentId: assignment.id,
        acquisitionLeadId: assignment.acquisitionLeadId,
        propertyId: property.id,
        assignee: assignment.assignee,
        priority: assignment.priority,
        name: name || null,
        phone,
        email: emailPoint?.value ?? owner.email,
        address: property.streetAddress,
        city: property.city,
        state: property.state,
        postalCode: property.zip,
        listType: "seller" as const,
        property: {
          apn: property.apn,
          beds: property.beds,
          baths: property.baths,
          sqft: property.sqft,
          yearBuilt: property.yearBuilt,
          estimatedValue: property.estimatedValue,
          lastSalePrice: property.lastSalePrice,
          mlsNumber: latestListing?.mlsNumber ?? null,
          mlsStatus: latestListing?.mlsStatus ?? null,
          listPrice: latestListing?.listPrice ?? null,
          listPricePerSqft:
            latestListing?.listPrice && property.sqft
              ? latestListing.listPrice / property.sqft
              : null,
        },
      },
    }];
  });

  const suppressionValues = candidates.flatMap(({ phone }) => [phone, phone.replace(/\D/g, "")]);
  const suppressions = suppressionValues.length
    ? await prisma.suppressionRecord.findMany({ where: { value: { in: suppressionValues } } })
    : [];
  const suppressed = new Set(suppressions.map((record) => record.value.replace(/\D/g, "")));
  const eligible = candidates.filter(({ phone }) => !suppressed.has(phone.replace(/\D/g, "")));

  if (eligible.length === 0) {
    return NextResponse.json({ sent: 0, skipped: assignments.length, accepted: [] });
  }

  const response = await fetch(
    `${dialerUrl.replace(/\/$/, "")}/api/integrations/acquisition/assignments`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${sharedSecret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ assignments: eligible.map(({ payload }) => payload) }),
    }
  );

  const result = await response.json().catch(() => null);
  if (!response.ok) {
    return NextResponse.json(
      { error: result?.error ?? `Dialer rejected the batch (${response.status}).` },
      { status: 502 }
    );
  }

  const accepted = Array.isArray(result?.accepted) ? result.accepted : [];
  await prisma.$transaction(
    accepted
      .filter(
        (item: unknown): item is { assignmentId: string; leadId: string } =>
          typeof (item as { assignmentId?: unknown })?.assignmentId === "string" &&
          typeof (item as { leadId?: unknown })?.leadId === "string"
      )
      .map((item: { assignmentId: string; leadId: string }) =>
        prisma.callAssignment.update({
          where: { id: item.assignmentId },
          data: {
            status: "queued",
            externalSystem: "coldcalldogs",
            externalId: item.leadId,
            syncedAt: new Date(),
          },
        })
      )
  );

  return NextResponse.json({
    sent: accepted.length,
    skipped: assignments.length - accepted.length,
    accepted,
  });
}
