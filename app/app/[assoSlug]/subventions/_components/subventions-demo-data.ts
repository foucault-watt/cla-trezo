import type { VisibleSubvention } from "@/lib/subventions/visible-subventions";

const DAY_MS = 24 * 60 * 60 * 1000;

function daysAgo(days: number) {
  return new Date(Date.now() - days * DAY_MS);
}

export function createSubventionAgeDemoData(): VisibleSubvention[] {
  return [
    {
      id: "demo-old-grant",
      campaignId: "demo-old-campaign",
      campaignName: "Exemple · CA Event printemps 2025",
      type: "CA_EVENT",
      reason: "Location et logistique de l’événement",
      totalAmountCents: 240000,
      usedAmountCents: 186500,
      remainingAmountCents: 53500,
      commentary: "Données ajoutées uniquement pour la démonstration.",
      publicationDate: daysAgo(500),
      campaignDate: daysAgo(500),
      stale: true,
    },
    {
      id: "demo-history-grant",
      campaignId: "demo-history-campaign",
      campaignName: "Exemple · CA Budget 2023",
      type: "CA_BUDGET",
      reason: "Matériel et fonctionnement",
      totalAmountCents: 120000,
      usedAmountCents: 98500,
      remainingAmountCents: 21500,
      commentary: "Données ajoutées uniquement pour la démonstration.",
      publicationDate: daysAgo(900),
      campaignDate: daysAgo(900),
      stale: true,
    },
  ];
}
