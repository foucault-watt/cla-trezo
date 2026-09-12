/**
 * Script de seed manuel (hors `prisma db seed`) pour peupler le Club "Les
 * Mots Dits" (slug: mots-dits, club d'écriture/slam) avec un historique
 * réaliste sur plusieurs années : Campagnes de subvention (2-3 par an,
 * plusieurs Subventions chacune) et mouvements de Solde (environ une
 * dizaine de dépenses par an, certains mois sans mouvement). Sert de club
 * "vitrine" pour montrer le site une fois rempli.
 *
 * Usage: npx tsx scripts/seed-mots-dits.ts
 */
import "dotenv/config";
import { prisma } from "../lib/prisma";

/**
 * Garde-fou : ce script supprime puis recrée des mouvements de Solde et des
 * Subventions. Il ne doit jamais tourner par accident contre une base qui
 * n'est pas un environnement de dev/démo jetable (cf. docs/agents/seeds.md).
 */
if (process.env.ALLOW_DEV_SEED !== "true") {
  console.error(
    "Refusé : ALLOW_DEV_SEED=true doit être défini dans l'environnement " +
      "(ex: .env) pour autoriser ce script à écrire dans la base. " +
      "Voir docs/agents/seeds.md.",
  );
  process.exit(1);
}

const START_YEAR = 2022;

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[randomInt(0, arr.length - 1)];
}

function daysInMonth(year: number, monthIndex0: number) {
  return new Date(year, monthIndex0 + 1, 0).getDate();
}

function seasonName(monthIndex0: number) {
  if (monthIndex0 <= 1 || monthIndex0 === 11) return "Hiver";
  if (monthIndex0 <= 4) return "Printemps";
  if (monthIndex0 <= 7) return "Été";
  return "Automne";
}

// ─── Contenu thématique (club d'écriture / slam) ──────────────────────────

const SUBVENTION_REASONS: Record<
  "CA_BUDGET" | "CA_EVENT" | "CA_EXCEPTIONNEL",
  string[]
> = {
  CA_BUDGET: [
    "Achat de livres pour la bibliothèque du club",
    "Location annuelle de la salle de lecture",
    "Impression du recueil de poèmes",
    "Frais d'inscription aux scènes ouvertes régionales",
    "Achat de matériel de sonorisation pour les lectures",
    "Abonnement revues et anthologies de poésie",
  ],
  CA_EVENT: [
    "Organisation de la soirée slam de fin d'année",
    "Frais de déplacement - Festival de poésie",
    "Cachet intervenant - atelier d'écriture",
    "Location de matériel scénique pour la scène ouverte",
    "Communication et affichage - soirée lecture publique",
    "Buffet soirée slam",
  ],
  CA_EXCEPTIONNEL: [
    "Remplacement du matériel de sonorisation endommagé",
    "Aide exceptionnelle suite à l'annulation d'une soirée",
    "Achat exceptionnel d'ouvrages pour un projet spécial",
    "Financement exceptionnel - participation au festival national de slam",
  ],
};

const AMOUNT_RANGES: Record<
  "CA_BUDGET" | "CA_EVENT" | "CA_EXCEPTIONNEL",
  [number, number]
> = {
  CA_BUDGET: [50_000, 200_000],
  CA_EVENT: [30_000, 120_000],
  CA_EXCEPTIONNEL: [20_000, 150_000],
};

const SOLDE_DEBIT_CATEGORIES = [
  "Nourriture",
  "Transport",
  "Matériel",
  "Événement",
  "Communication",
  "Autre",
];

const SOLDE_DEBIT_DESCRIPTIONS = [
  "Achat fournitures atelier écriture",
  "Location salle pour lecture publique",
  "Impression recueil de poèmes",
  "Buffet soirée slam",
  "Affiches et flyers",
  "Défraiement intervenant",
  "Achat de livres pour la bibliothèque du club",
  "Frais de déplacement festival",
];

async function main() {
  const admin = await prisma.user.upsert({
    where: { username: "seed-admin" },
    update: {},
    create: {
      username: "seed-admin",
      firstname: "Admin",
      lastname: "Seed",
      isAdmin: true,
    },
  });

  const asso = await prisma.asso.upsert({
    where: { slug: "mots-dits" },
    update: { type: "CLUB", status: "ACTIVE" },
    create: {
      slug: "mots-dits",
      name: "Les Mots Dits",
      type: "CLUB",
      status: "ACTIVE",
    },
  });

  const now = new Date();

  // ─── Repart de zéro pour ce club (ré-exécutable sans doublons) ──────────

  const existingSubventions = await prisma.subvention.findMany({
    where: { assoId: asso.id },
    select: { campaignId: true },
  });
  const campaignIds = [...new Set(existingSubventions.map((s) => s.campaignId))];

  await prisma.subvention.deleteMany({ where: { assoId: asso.id } });

  for (const campaignId of campaignIds) {
    const remaining = await prisma.subvention.count({ where: { campaignId } });
    if (remaining === 0) {
      await prisma.subventionCampaign.delete({ where: { id: campaignId } });
    }
  }

  await prisma.financialMovement.deleteMany({
    where: { assoId: asso.id, origin: { in: ["MANUAL", "EXPENSE_REPORT"] } },
  });

  // ─── Campagnes de subvention (2-3 par an, plusieurs lignes chacune) ─────

  let campaignCount = 0;
  let subventionCount = 0;

  for (let year = START_YEAR; year <= now.getFullYear(); year++) {
    const isCurrentYear = year === now.getFullYear();
    const lastMonthIndex0 = isCurrentYear ? now.getMonth() : 11;
    if (isCurrentYear && lastMonthIndex0 < 0) continue;

    const campaignsThisYear = randomInt(2, 3);
    // Mois répartis à peu près régulièrement sur l'année (ou la portion
    // d'année déjà écoulée pour l'année en cours).
    const months = Array.from({ length: campaignsThisYear }, (_, i) =>
      Math.min(
        lastMonthIndex0,
        Math.round(((i + 1) / (campaignsThisYear + 1)) * 11),
      ),
    );

    for (let i = 0; i < months.length; i++) {
      const monthIndex0 = months[i];
      const day = randomInt(
        1,
        isCurrentYear && monthIndex0 === lastMonthIndex0
          ? now.getDate()
          : daysInMonth(year, monthIndex0),
      );
      const campaignDate = new Date(year, monthIndex0, day);
      if (campaignDate > now) continue;

      const type = i === 0 ? "CA_BUDGET" : pick(["CA_EVENT", "CA_EXCEPTIONNEL"] as const);
      const name = i === 0 ? `${year}` : `${seasonName(monthIndex0)} ${year}`;

      const campaign = await prisma.subventionCampaign.create({
        data: {
          type,
          name,
          date: campaignDate,
          publicationDate: campaignDate,
        },
      });
      campaignCount++;

      const linesCount = randomInt(2, 4);
      const [min, max] = AMOUNT_RANGES[type];
      const reasons = [...SUBVENTION_REASONS[type]];
      for (let l = 0; l < linesCount; l++) {
        const reasonIndex = randomInt(0, reasons.length - 1);
        const [reason] = reasons.splice(reasonIndex, 1);
        await prisma.subvention.create({
          data: {
            campaignId: campaign.id,
            assoId: asso.id,
            reason: reason ?? pick(SUBVENTION_REASONS[type]),
            amountCents: randomInt(min, max),
            commentary: `Voté en CA du ${campaignDate.toLocaleDateString("fr-FR")}`,
          },
        });
        subventionCount++;
        if (reasons.length === 0) break;
      }
    }
  }

  // ─── Historique de Solde (environ 10 dépenses/an, mois parfois vides) ───

  const movements: {
    movementType: "CREDIT" | "DEBIT";
    amountCents: number;
    category: string | null;
    description: string;
    createdAt: Date;
  }[] = [];

  const historyStart = new Date(START_YEAR, 0, 1);
  movements.push({
    movementType: "CREDIT",
    amountCents: 200_000,
    category: null,
    description: "Solde initial",
    createdAt: historyStart,
  });

  // Rentrées d'argent : peu fréquentes mais prévisibles (cotisations en
  // rentrée, buvette lors de la soirée slam de fin d'année), distinctes des
  // "dépenses" ci-dessous pour garder un Solde qui reste dans le vert sur
  // plusieurs années, comme un club réel bien tenu.
  for (let year = START_YEAR; year <= now.getFullYear(); year++) {
    const annualCredits: { monthIndex0: number; description: string; range: [number, number] }[] = [
      { monthIndex0: 8, description: "Cotisations adhérents", range: [40_000, 70_000] },
      { monthIndex0: 5, description: "Recette buvette soirée slam", range: [30_000, 90_000] },
    ];

    for (const credit of annualCredits) {
      const isCurrentYear = year === now.getFullYear();
      if (isCurrentYear && credit.monthIndex0 > now.getMonth()) continue;

      const maxDay =
        isCurrentYear && credit.monthIndex0 === now.getMonth()
          ? now.getDate()
          : daysInMonth(year, credit.monthIndex0);
      const createdAt = new Date(
        year,
        credit.monthIndex0,
        randomInt(1, maxDay),
        randomInt(8, 19),
        randomInt(0, 59),
      );

      movements.push({
        movementType: "CREDIT",
        amountCents: randomInt(credit.range[0], credit.range[1]),
        category: null,
        description: credit.description,
        createdAt,
      });
    }
  }

  // Dépenses : 1-2 par mois maximum, certains mois sans aucune (~une
  // dizaine par an sur l'ensemble de l'historique).
  for (let year = START_YEAR; year <= now.getFullYear(); year++) {
    const isCurrentYear = year === now.getFullYear();
    const lastMonthIndex0 = isCurrentYear ? now.getMonth() : 11;

    for (let monthIndex0 = 0; monthIndex0 <= lastMonthIndex0; monthIndex0++) {
      if (year === START_YEAR && monthIndex0 === 0) continue; // déjà le solde initial

      const roll = Math.random();
      const movementsThisMonth = roll < 0.4 ? 0 : roll < 0.85 ? 1 : 2;

      for (let m = 0; m < movementsThisMonth; m++) {
        const maxDay =
          isCurrentYear && monthIndex0 === lastMonthIndex0
            ? now.getDate()
            : daysInMonth(year, monthIndex0);
        const createdAt = new Date(
          year,
          monthIndex0,
          randomInt(1, maxDay),
          randomInt(8, 19),
          randomInt(0, 59),
        );
        if (createdAt > now) continue;

        movements.push({
          movementType: "DEBIT",
          amountCents: randomInt(1_500, 18_000),
          category: pick(SOLDE_DEBIT_CATEGORIES),
          description: pick(SOLDE_DEBIT_DESCRIPTIONS),
          createdAt,
        });
      }
    }
  }

  await prisma.financialMovement.createMany({
    data: movements.map((m) => ({
      assoId: asso.id,
      movementType: m.movementType,
      accountType: "CLUB_BALANCE" as const,
      origin: "MANUAL" as const,
      amountCents: m.amountCents,
      category: m.category,
      description: m.description,
      createdBy: admin.id,
      createdAt: m.createdAt,
    })),
  });

  console.log(
    `Seed OK : club "Les Mots Dits" (${asso.id}) — ${campaignCount} campagnes, ` +
      `${subventionCount} subventions, ${movements.length} mouvements de solde.`,
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
