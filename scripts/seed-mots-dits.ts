/**
 * Script de seed manuel (hors `prisma db seed`) pour peupler le Club
 * "Les Mots Dits" (slug: mots-dits) avec un mois de mouvements de Solde
 * variés. Sert à tester l'UI/UX de l'historique des mouvements à volume
 * réaliste (cf. discussion sur la pagination/le regroupement).
 *
 * Usage: npx tsx scripts/seed-mots-dits.ts
 */
import "dotenv/config";
import { prisma } from "../lib/prisma";

/**
 * Garde-fou : ce script supprime puis recrée des mouvements de Solde. Il ne
 * doit jamais tourner par accident contre une base qui n'est pas un
 * environnement de dev/démo jetable (cf. docs/agents/seeds.md).
 */
if (process.env.ALLOW_DEV_SEED !== "true") {
  console.error(
    "Refusé : ALLOW_DEV_SEED=true doit être défini dans l'environnement " +
      "(ex: .env) pour autoriser ce script à écrire dans la base. " +
      "Voir docs/agents/seeds.md.",
  );
  process.exit(1);
}

const CATEGORIES_DEBIT = [
  "Nourriture",
  "Transport",
  "Matériel",
  "Événement",
  "Communication",
  "Autre",
];

const DESCRIPTIONS_CREDIT = [
  "Cotisations adhérents",
  "Recette buvette",
  "Vente billetterie soirée",
  "Remboursement caution salle",
  "Subvention exceptionnelle mairie",
];

const DESCRIPTIONS_DEBIT = [
  "Achat fournitures atelier écriture",
  "Location salle pour lecture publique",
  "Impression recueil de poèmes",
  "Buffet soirée slam",
  "Affiches et flyers",
  "Défraiement intervenant",
  "Achat de livres pour la bibliothèque du club",
  "Frais de déplacement festival",
  "Remboursement note de frais - Justine Renard",
  "Remboursement note de frais - Karim Belkacem",
];

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[randomInt(0, arr.length - 1)];
}

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

  // Repart d'un solde à zéro pour ce script (ré-exécutable sans doublons
  // qui s'accumulent à l'infini).
  await prisma.financialMovement.deleteMany({
    where: { assoId: asso.id, origin: { in: ["MANUAL", "EXPENSE_REPORT"] } },
  });

  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - 30);

  const movements: {
    movementType: "CREDIT" | "DEBIT";
    origin: "MANUAL" | "EXPENSE_REPORT";
    amountCents: number;
    category: string | null;
    description: string | null;
    createdAt: Date;
  }[] = [];

  // Solde initial (obligatoire pour que le Solde soit "initialisé", cf.
  // lib/solde/solde.ts).
  movements.push({
    movementType: "CREDIT",
    origin: "MANUAL",
    amountCents: 150_000,
    category: null,
    description: "Solde initial",
    createdAt: start,
  });

  const movementCount = 45;
  for (let i = 0; i < movementCount; i++) {
    const dayOffset = randomInt(0, 30);
    const createdAt = new Date(start);
    createdAt.setDate(createdAt.getDate() + dayOffset);
    createdAt.setHours(randomInt(8, 19), randomInt(0, 59));

    const isCredit = Math.random() < 0.25;
    const isExpenseReport = !isCredit && Math.random() < 0.4;

    if (isCredit) {
      movements.push({
        movementType: "CREDIT",
        origin: "MANUAL",
        amountCents: randomInt(2000, 40000),
        category: null,
        description: pick(DESCRIPTIONS_CREDIT),
        createdAt,
      });
    } else if (isExpenseReport) {
      movements.push({
        movementType: "DEBIT",
        origin: "EXPENSE_REPORT",
        amountCents: randomInt(1000, 15000),
        category: pick(CATEGORIES_DEBIT),
        description: pick(DESCRIPTIONS_DEBIT),
        createdAt,
      });
    } else {
      movements.push({
        movementType: "DEBIT",
        origin: "MANUAL",
        amountCents: randomInt(500, 12000),
        category: null,
        description: pick(DESCRIPTIONS_DEBIT),
        createdAt,
      });
    }
  }

  await prisma.financialMovement.createMany({
    data: movements.map((m) => ({
      assoId: asso.id,
      movementType: m.movementType,
      accountType: "CLUB_BALANCE",
      origin: m.origin,
      amountCents: m.amountCents,
      category: m.category,
      description: m.description,
      createdBy: admin.id,
      createdAt: m.createdAt,
    })),
  });

  console.log(
    `Seed OK : ${movements.length} mouvements créés pour le Club "Les Mots Dits" (${asso.id}).`,
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
