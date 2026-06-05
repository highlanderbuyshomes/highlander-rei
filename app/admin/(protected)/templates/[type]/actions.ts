"use server";

import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

type FieldInput = {
  type: string;
  label?: string;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  signerIndex: number;
};

export async function saveTemplateFields(type: string, signerCount: number, fields: FieldInput[]) {
  await requireAdmin();

  const template = await prisma.agreementTemplate.findUnique({ where: { type } });
  if (!template) return;

  await prisma.$transaction([
    prisma.templateField.deleteMany({ where: { templateId: template.id } }),
    ...(fields.length > 0 ? [prisma.templateField.createMany({
      data: fields.map((f) => ({
        templateId:  template.id,
        type:        f.type,
        label:       f.label ?? null,
        page:        f.page,
        x:           f.x,
        y:           f.y,
        width:       f.width,
        height:      f.height,
        signerIndex: f.signerIndex,
        required:    true,
      })),
    })] : []),
    prisma.agreementTemplate.update({
      where: { id: template.id },
      data:  { signerCount },
    }),
  ]);

  revalidatePath("/admin/templates");
  revalidatePath(`/admin/templates/${type}`);
}
