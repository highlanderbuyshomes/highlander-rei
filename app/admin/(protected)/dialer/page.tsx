import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";
import DialerIntegrationPanel from "./DialerIntegrationPanel";

export const metadata: Metadata = { title: "Dialer | Highlander REI" };

export default async function DialerPage() {
  await requireUser();
  const pendingAssignments = await prisma.callAssignment.count({ where: { status: "pending" } });
  const configured = Boolean(
    process.env.COLD_CALL_DOGS_URL && process.env.INTEGRATION_SHARED_SECRET
  );

  return (
    <div style={{ maxWidth: "1100px", padding: "32px" }}>
      <div style={{ fontFamily: "var(--font-display), serif", fontSize: "36px", color: "#111110", letterSpacing: "2px", lineHeight: 1, marginBottom: "24px" }}>DIALER</div>
      <DialerIntegrationPanel
        configured={configured}
        initialPending={pendingAssignments}
        dialerUrl={process.env.COLD_CALL_DOGS_URL ?? "/coldcalldogs"}
      />
    </div>
  );
}
