export type AgreementField = {
  id?: string;
  type: string;
  label?: string;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  signerIndex: number;
};

export const AGREEMENT_DATA_FIELDS = [
  ["data:agreementDate", "Agreement Date"],
  ["data:seller1Name", "Seller 1 Name"],
  ["data:seller2Name", "Seller 2 Name"],
  ["data:buyerName", "Buyer Name"],
  ["data:propertyAddress", "Property Address"],
  ["data:purchasePrice", "Purchase Price"],
  ["data:earnestMoney", "Earnest Money"],
  ["data:cashAtClosing", "Cash at Closing"],
  ["data:inspectionPeriod", "Inspection Period"],
  ["data:titleOffice", "Title / Attorney Office"],
  ["data:daysToClosing", "Days to Closing"],
] as const;

export function isAgreementDataField(field: Pick<AgreementField, "type">) {
  return field.type.startsWith("data:");
}

type AgreementFieldContext = {
  type: string;
  seller2Name?: string | null;
  signerCount: number;
};

/**
 * Template signer indexes describe roles, while agreement signer indexes
 * describe the people actually attached to one agreement.
 */
export function resolveAgreementFields<T extends AgreementField>(
  fields: T[],
  context: AgreementFieldContext
): T[] {
  const hasSeller2 = !!context.seller2Name?.trim();
  const dataFields = fields.filter(isAgreementDataField);
  const signerFields = fields.filter((field) => !isAgreementDataField(field));

  if (context.type === "cash_offer" || context.type === "flex_equity" || context.type === "aif_novation") {
    const buyerIndex = hasSeller2 ? 2 : 1;
    const hasBuyer = context.signerCount > buyerIndex;

    return [...dataFields, ...signerFields.flatMap((field) => {
      if (field.signerIndex === 0 && context.signerCount > 0) return [field];
      if (field.signerIndex === 1) return hasSeller2 ? [field] : [];
      if (field.signerIndex === 2 && hasBuyer) return [{ ...field, signerIndex: buyerIndex }];
      return [];
    })];
  }

  if (context.type === "listing") {
    const buyerIndex = hasSeller2 ? 2 : 1;
    const hasBuyer = context.signerCount > buyerIndex;

    return [...dataFields, ...signerFields.flatMap((field) => {
      if (field.signerIndex === 0 && context.signerCount > 0) return [field];
      if (field.signerIndex === 1 && hasBuyer) return [{ ...field, signerIndex: buyerIndex }];
      return [];
    })];
  }

  return [...dataFields, ...signerFields.filter((field) => field.signerIndex < context.signerCount)];
}

export function getAgreementSignerLabels(context: AgreementFieldContext): string[] {
  const labels = ["Seller 1"];
  if (context.seller2Name?.trim()) labels.push("Seller 2");
  while (labels.length < context.signerCount) labels.push("Buyer");
  return labels.slice(0, context.signerCount);
}

export function getDefaultAgreementFields(context: AgreementFieldContext): AgreementField[] | null {
  if (context.type !== "flex_equity" || context.signerCount < 1) return null;

  const fields: AgreementField[] = [
    { type: "signature", label: "Seller 1 Signature", page: 5, x: 0.095, y: 0.795, width: 0.37, height: 0.04, signerIndex: 0 },
    { type: "date", label: "Seller 1 Date", page: 5, x: 0.095, y: 0.84, width: 0.2, height: 0.03, signerIndex: 0 },
  ];

  if (context.seller2Name?.trim() && context.signerCount > 1) {
    fields.push(
      { type: "signature", label: "Seller 2 Signature", page: 5, x: 0.095, y: 0.89, width: 0.37, height: 0.04, signerIndex: 1 },
      { type: "date", label: "Seller 2 Date", page: 5, x: 0.095, y: 0.935, width: 0.2, height: 0.03, signerIndex: 1 },
    );
  }

  const buyerIndex = context.seller2Name?.trim() ? 2 : 1;
  if (context.signerCount > buyerIndex) {
    fields.push(
      { type: "signature", label: "Buyer Signature", page: 5, x: 0.53, y: 0.795, width: 0.37, height: 0.04, signerIndex: buyerIndex },
      { type: "date", label: "Buyer Date", page: 5, x: 0.53, y: 0.84, width: 0.2, height: 0.03, signerIndex: buyerIndex },
    );
  }

  return fields;
}

export function getAgreementFieldIssues(
  fields: AgreementField[] | null,
  signerCount: number
): string[] {
  if (!fields) return ["Review and save the signing fields before sending."];
  if (signerCount < 1) return ["Add at least one signer before sending."];

  const issues: string[] = [];
  const allowedTypes = new Set(["signature", "initials", "date", "text"]);

  fields.forEach((field, index) => {
    const fieldName = field.label?.trim() || `Field ${index + 1}`;
    if (!allowedTypes.has(field.type) && !isAgreementDataField(field)) issues.push(`${fieldName} has an unsupported type.`);
    if (!Number.isInteger(field.page) || field.page < 1) issues.push(`${fieldName} has an invalid page.`);
    if (!isAgreementDataField(field) && (!Number.isInteger(field.signerIndex) || field.signerIndex < 0 || field.signerIndex >= signerCount)) {
      issues.push(`${fieldName} points to a signer who is not on this agreement.`);
    }
    if (![field.x, field.y, field.width, field.height].every(Number.isFinite)) {
      issues.push(`${fieldName} has invalid coordinates.`);
    } else if (
      field.x < 0 || field.y < 0 || field.width <= 0 || field.height <= 0 ||
      field.x + field.width > 1.001 || field.y + field.height > 1.001
    ) {
      issues.push(`${fieldName} is outside the PDF page.`);
    }
  });

  for (let signerIndex = 0; signerIndex < signerCount; signerIndex += 1) {
    if (!fields.some((field) => !isAgreementDataField(field) && field.signerIndex === signerIndex && field.type === "signature")) {
      issues.push(`Signer ${signerIndex + 1} needs a signature field.`);
    }
  }

  return [...new Set(issues)];
}
