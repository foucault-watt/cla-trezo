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
