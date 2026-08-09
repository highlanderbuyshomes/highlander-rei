import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";
import BuyersWorkspace from "./BuyersWorkspace";

export const metadata: Metadata = { title: "Our Buyers | Highlander REI" };

export default async function BuyersPage() {
  await requireAdmin();
  const buyers = await prisma.acquisitionArea.findMany({
    orderBy: [{ active: "desc" }, { updatedAt: "desc" }],
    include: { buyBoxes: { orderBy: [{ active: "desc" }, { priority: "desc" }, { updatedAt: "desc" }] } },
  });

  return <BuyersWorkspace buyers={buyers} />;
}
