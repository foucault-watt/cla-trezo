import { describe, expect, it } from "vitest";
import { formatCentsForPdf } from "@/lib/money";
import { buildSoldePdfData, buildSubventionPdfData } from "./expense-report-pdf-data";

const context = {
  reportDate: new Date("2026-03-15T10:00:00+01:00"),
  beneficiaryName: "Camille Martin",
  associationName: "Club Robotique",
  iban: "FR7630006000011234567890189",
  treasurerName: "Baptiste Frenay",
};

describe("buildSubventionPdfData", () => {
  it("cumule le financement accordé sur toutes les Subventions de la Campagne", () => {
    const data = buildSubventionPdfData({
      context,
      campaignName: "Budget prévisionnel 2025-2026",
      grantReason: "Achat de matériel",
      campaignGrantedOn: new Date("2026-01-10T00:00:00+01:00"),
      campaignSubventions: [
        { reason: "Achat de matériel", amountCents: 50000 },
        { reason: "Événement de rentrée", amountCents: 20000 },
      ],
      reimbursedHistory: [],
      linesToReimburse: [],
    });

    expect(data.grantedExpenses).toEqual([
      { date: "10/01/2026", description: "Achat de matériel", amount: formatCentsForPdf(50000) },
      { date: "10/01/2026", description: "Événement de rentrée", amount: formatCentsForPdf(20000) },
    ]);
    expect(data.grantedTotal).toBe(formatCentsForPdf(70000));
    expect(data.fundingName).toBe("Budget prévisionnel 2025-2026");
    expect(data.grantName).toBe("Achat de matériel");
  });

  it("calcule le solde restant avant puis après la Note en cours", () => {
    const data = buildSubventionPdfData({
      context,
      campaignName: "Budget prévisionnel 2025-2026",
      grantReason: "Achat de matériel",
      campaignGrantedOn: new Date("2026-01-10T00:00:00+01:00"),
      campaignSubventions: [{ reason: "Achat de matériel", amountCents: 100000 }],
      reimbursedHistory: [
        {
          amountCents: 20000,
          date: new Date("2026-02-01T00:00:00+01:00"),
          description: "Casque VR",
        },
      ],
      linesToReimburse: [
        {
          amountCents: 15000,
          date: new Date("2026-03-01T00:00:00+01:00"),
          description: "Carte électronique",
        },
      ],
    });

    expect(data.reimbursedExpenses).toEqual([
      { date: "01/02/2026", description: "Casque VR", amount: formatCentsForPdf(20000) },
    ]);
    expect(data.remainingTotal).toBe(formatCentsForPdf(80000));
    expect(data.expensesToReimburse).toEqual([
      { date: "01/03/2026", description: "Carte électronique", amount: formatCentsForPdf(15000) },
    ]);
    expect(data.reimbursementTotal).toBe(formatCentsForPdf(15000));
    expect(data.grantBalance).toBe(formatCentsForPdf(65000));
  });

  it("utilise la date de la Note en l'absence de date de dépense", () => {
    const data = buildSubventionPdfData({
      context,
      campaignName: "Budget prévisionnel 2025-2026",
      grantReason: "Achat de matériel",
      campaignGrantedOn: new Date("2026-01-10T00:00:00+01:00"),
      campaignSubventions: [{ reason: "Achat de matériel", amountCents: 10000 }],
      reimbursedHistory: [],
      linesToReimburse: [
        { amountCents: 3000, date: null, description: "Pièce sans date" },
      ],
    });

    expect(data.expensesToReimburse).toEqual([
      { date: "15/03/2026", description: "Pièce sans date", amount: formatCentsForPdf(3000) },
    ]);
  });

  it("reprend le bénéficiaire de la Note comme auteur, destinataire et virement", () => {
    const data = buildSubventionPdfData({
      context,
      campaignName: "Budget prévisionnel 2025-2026",
      grantReason: "Achat de matériel",
      campaignGrantedOn: new Date("2026-01-10T00:00:00+01:00"),
      campaignSubventions: [{ reason: "Achat de matériel", amountCents: 10000 }],
      reimbursedHistory: [],
      linesToReimburse: [],
    });

    expect(data.authorName).toBe("Camille Martin");
    expect(data.recipientName).toBe("Camille Martin");
    expect(data.associationName).toBe("Club Robotique");
    expect(data.reimbursedAssociationName).toBe("Club Robotique");
    expect(data.treasurerName).toBe("Baptiste Frenay");
    expect(data.paymentMethod).toBe("transfer");
    expect(data.iban).toBe("FR7630006000011234567890189");
  });

  it("laisse reconstitutionNote absent en temps normal, présent lors d'une reconstitution", () => {
    const normal = buildSubventionPdfData({
      context,
      campaignName: "Budget prévisionnel 2025-2026",
      grantReason: "Achat de matériel",
      campaignGrantedOn: new Date("2026-01-10T00:00:00+01:00"),
      campaignSubventions: [{ reason: "Achat de matériel", amountCents: 10000 }],
      reimbursedHistory: [],
      linesToReimburse: [],
    });
    expect(normal.reconstitutionNote).toBeUndefined();

    const reconstituted = buildSubventionPdfData({
      context: { ...context, reconstitutionNote: "Document reconstitué le 20/03/2026." },
      campaignName: "Budget prévisionnel 2025-2026",
      grantReason: "Achat de matériel",
      campaignGrantedOn: new Date("2026-01-10T00:00:00+01:00"),
      campaignSubventions: [{ reason: "Achat de matériel", amountCents: 10000 }],
      reimbursedHistory: [],
      linesToReimburse: [],
    });
    expect(reconstituted.reconstitutionNote).toBe(
      "Document reconstitué le 20/03/2026.",
    );
  });
});

describe("buildSoldePdfData", () => {
  it("liste les dépenses financées par le Solde et leur total", () => {
    const data = buildSoldePdfData({
      context,
      lines: [
        {
          amountCents: 1500,
          date: new Date("2026-03-02T00:00:00+01:00"),
          description: "Taxi gare",
        },
        {
          amountCents: 2500,
          date: new Date("2026-03-03T00:00:00+01:00"),
          description: "Repas équipe",
        },
      ],
    });

    expect(data.expenses).toEqual([
      { date: "02/03/2026", description: "Taxi gare", amount: formatCentsForPdf(1500) },
      { date: "03/03/2026", description: "Repas équipe", amount: formatCentsForPdf(2500) },
    ]);
    expect(data.total).toBe(formatCentsForPdf(4000));
    expect(data.authorName).toBe("Camille Martin");
    expect(data.recipientName).toBe("Camille Martin");
    expect(data.treasurerName).toBe("Baptiste Frenay");
    expect(data.paymentMethod).toBe("transfer");
  });

  it("laisse reconstitutionNote absent en temps normal, présent lors d'une reconstitution", () => {
    const normal = buildSoldePdfData({ context, lines: [] });
    expect(normal.reconstitutionNote).toBeUndefined();

    const reconstituted = buildSoldePdfData({
      context: { ...context, reconstitutionNote: "Document reconstitué le 20/03/2026." },
      lines: [],
    });
    expect(reconstituted.reconstitutionNote).toBe(
      "Document reconstitué le 20/03/2026.",
    );
  });
});
