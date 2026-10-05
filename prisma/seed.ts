import { prisma } from "../lib/prisma";

const DEFAULT_TYPE_DEPENSE_LABELS = [
  "Nourriture",
  "Transport",
  "Matériel",
  "Événement",
  "Communication",
  "Autre",
];

async function main() {
  // Une fois la liste gérée par l'Admin (/app/admin/types-de-depense), le
  // seed ne doit plus recréer un Type par défaut qu'il a renommé ou supprimé :
  // il ne remplit qu'une table vide.
  if ((await prisma.typeDepense.count()) > 0) return;

  await prisma.typeDepense.createMany({
    data: DEFAULT_TYPE_DEPENSE_LABELS.map((label) => ({ label })),
    skipDuplicates: true,
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
