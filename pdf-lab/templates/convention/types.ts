export type ConventionExpenseRow = {
  grantedOn: string;
  description: string;
  amount: string;
};

export type ConventionRepresentative = {
  name: string;
  role: string;
};

export type ConventionParty = {
  associationName: string;
  address: string;
  representatives: ConventionRepresentative[];
};

export type ConventionSignatureBlock = {
  associationName: string;
  signatoryName: string;
  signatoryRole: string;
  city: string;
  date: string;
};

export type SubsidyConventionPdfData = {
  period: string;
  firstParty: ConventionParty;
  secondParty: ConventionParty;
  expenses: ConventionExpenseRow[];
  totalAmount: string;
  firstPartySignature: ConventionSignatureBlock;
  secondPartySignature: ConventionSignatureBlock;
};
