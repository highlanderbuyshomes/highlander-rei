import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyInternalRequest } from "@/lib/integrations/internal-auth";

const COMPLETED_OUTCOMES = new Set([
  "contacted",
  "interested",
  "not_interested",
  "bad_number",
  "wrong_number",
  "dnc",
]);

export async function POST(request: Request) {
  if (!verifyInternalRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const assignmentId = typeof body?.assignmentId === "string" ? body.assignmentId : null;
  const eventId = typeof body?.eventId === "string" ? body.eventId : null;
  const outcome = typeof body?.outcome === "string" ? body.outcome : null;
  const notes = typeof body?.notes === "string" ? body.notes : null;
  const phone = typeof body?.phone === "string" ? body.phone.replace(/\D/g, "") : null;
  const attemptedAt = typeof body?.attemptedAt === "string" ? new Date(body.attemptedAt) : new Date();

  if (!assignmentId || !eventId || !outcome || Number.isNaN(attemptedAt.getTime())) {
    return NextResponse.json(
      { error: "assignmentId, eventId, outcome, and a valid attemptedAt are required." },
      { status: 400 }
    );
  }

  const assignment = await prisma.callAssignment.findUnique({ where: { id: assignmentId } });
  if (!assignment) {
    return NextResponse.json({ error: "Assignment not found." }, { status: 404 });
  }

  const existing = await prisma.contactAttempt.findUnique({ where: { externalId: eventId } });
  if (existing) return NextResponse.json({ ok: true, duplicate: true });

  await prisma.$transaction(async (tx) => {
    await tx.contactAttempt.create({
      data: {
        acquisitionLeadId: assignment.acquisitionLeadId,
        callAssignmentId: assignment.id,
        channel: "phone",
        outcome,
        notes,
        externalSystem: "coldcalldogs",
        externalId: eventId,
        attemptedAt,
      },
    });

    await tx.callAssignment.update({
      where: { id: assignment.id },
      data: {
        status: COMPLETED_OUTCOMES.has(outcome) ? "completed" : "queued",
        syncedAt: new Date(),
      },
    });

    if (outcome === "dnc" && phone) {
      await tx.suppressionRecord.upsert({
        where: { type_value: { type: "phone", value: phone } },
        update: { reason: "Dialer DNC disposition", source: "coldcalldogs" },
        create: {
          type: "phone",
          value: phone,
          reason: "Dialer DNC disposition",
          source: "coldcalldogs",
        },
      });
    }
  });

  return NextResponse.json({ ok: true });
}
