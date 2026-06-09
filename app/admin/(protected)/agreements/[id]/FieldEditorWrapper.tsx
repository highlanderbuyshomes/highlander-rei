"use client";

import AgreementFieldEditor, { type FieldInput } from "./AgreementFieldEditor";

export default function FieldEditorWrapper({
  agreementId,
  pdfUrl,
  initialFields,
  signerLabels,
  saveAction,
}: {
  agreementId: string;
  pdfUrl: string;
  initialFields: FieldInput[];
  signerLabels: string[];
  saveAction: (fields: FieldInput[]) => Promise<void>;
}) {
  return (
    <>
      <div className="agreement-field-editor-desktop">
        <AgreementFieldEditor
          pdfUrl={pdfUrl}
          initialFields={initialFields}
          signerLabels={signerLabels}
          onSave={saveAction}
        />
      </div>
      <div className="agreement-field-editor-mobile">
        <strong>Signing fields ready</strong>
        <span>Field placement is easier on a larger screen. You can still review the PDF and send signatures from your phone.</span>
        <a href={pdfUrl} target="_blank" rel="noopener noreferrer">Review PDF</a>
      </div>
    </>
  );
}
