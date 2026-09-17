export const DOC_TYPES = [
  "confirmation_letter",
  "fee_notice",
  "cr",
  "iqama",
  "contract",
  "other",
] as const;

export type DocType = (typeof DOC_TYPES)[number];

export const DOC_TYPE_LABEL: Record<DocType, string> = {
  confirmation_letter: "Confirmation letter",
  fee_notice: "Fee notice",
  cr: "CR",
  iqama: "Iqama",
  contract: "Contract",
  other: "Other",
};
