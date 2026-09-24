import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/lib/session";
import {
  DEMO_ADMIN_USERNAME,
  DEMO_ASSO_SLUG,
  DEMO_CAMPAIGN_ID,
  DEMO_USER_USERNAME,
} from "@/lib/auth/demo-config";

async function upsertDemoUser(
  username: string,
  firstname: string,
  lastname: string,
  isAdmin: boolean,
) {
  return prisma.user.upsert({
    where: { username },
    update: { isAdmin, isDemo: true },
    create: { username, firstname, lastname, isAdmin, isDemo: true },
  });
}

/**
 * Reconstruit les fixtures du mode démo : Asso + Users fictifs (upsert, id
 * stable), puis reset complet des données mutables (Notes de frais,
 * Subvention, mouvements de Solde) filtré sur l'Asso démo uniquement — jamais
 * un deleteMany non filtré, cf. docs/agents/seeds.md. Appelée à chaque entrée
 * en mode démo (reset-on-entry) : personne n'hérite des notes de frais
 * laissées par un visiteur précédent.
 */
export async function provisionDemoFixtures(): Promise<SessionUser> {
  const [asso, treasurer, admin] = await Promise.all([
    prisma.asso.upsert({
      where: { slug: DEMO_ASSO_SLUG },
      update: {
        name: "Club Démo",
        type: "CLUB",
        status: "ACTIVE",
        isDemo: true,
      },
      create: {
        slug: DEMO_ASSO_SLUG,
        name: "Club Démo",
        type: "CLUB",
        status: "ACTIVE",
        isDemo: true,
      },
    }),
    upsertDemoUser(DEMO_USER_USERNAME, "Camille", "Trésorière", false),
    // N'existe que comme référence (créateur/preneur en charge) dans les
    // Notes de frais de démo déjà traitées — jamais utilisé pour se
    // connecter, cf. décision "vue Structure uniquement" dans le plan.
    upsertDemoUser(DEMO_ADMIN_USERNAME, "Admin", "CLA (démo)", true),
  ]);

  const activeMembership = await prisma.refAssoUser.findFirst({
    where: { userId: treasurer.id, assoId: asso.id, isActive: true },
  });
  if (!activeMembership) {
    await prisma.refAssoUser.create({
      data: { userId: treasurer.id, assoId: asso.id, role: "Trésorier·ère" },
    });
  }

  await resetDemoData(asso.id, treasurer.id, admin.id);

  return {
    id: treasurer.id,
    username: treasurer.username,
    firstname: treasurer.firstname,
    lastname: treasurer.lastname,
    isAdmin: false,
    isDemo: true,
    structures: [
      {
        assoId: asso.id,
        slug: asso.slug,
        name: asso.name,
        role: "Trésorier·ère",
      },
    ],
  };
}

type DemoMovementFixture = {
  movementType: "CREDIT" | "DEBIT";
  amountCents: number;
  category?: string;
  description: string;
  createdAt: Date;
};

type DemoLineFixture = {
  amountCents: number;
  expenseName: string;
  typeLabel: string;
  fundingSource: "CLUB_BALANCE" | "SUBVENTION";
  subventionId?: string;
};

type DemoBeneficiary = { firstname: string; lastname: string };

/**
 * Toute la séquence delete-puis-recreate tourne dans une transaction : deux
 * visiteurs qui déclenchent un reset au même moment ne doivent jamais se
 * croiser avec un jeu de données partiellement reconstruit.
 */
async function resetDemoData(
  assoId: string,
  creatorId: string,
  adminId: string,
) {
  // Données de référence, pas de fixtures démo : pas besoin de cohérence
  // transactionnelle avec le reset, autant l'interroger avant d'ouvrir la
  // transaction plutôt que de garder la connexion transactionnelle occupée.
  const typeDepenses = await prisma.typeDepense.findMany({
    select: { id: true, label: true },
  });
  const typeDepenseIdByLabel = new Map(
    typeDepenses.map((type) => [type.label, type.id]),
  );

  const now = new Date();
  const daysAgo = (days: number) => {
    const date = new Date(now);
    date.setDate(date.getDate() - days);
    return date;
  };

  const treasurerName: DemoBeneficiary = {
    firstname: "Camille",
    lastname: "Trésorière",
  };

  await prisma.$transaction(
    async (tx) => {
      await tx.supportingDocument.deleteMany({
        where: { expenseReport: { assoId } },
      });
      await tx.expenseReportLine.deleteMany({
        where: { expenseReport: { assoId } },
      });
      await tx.expenseReport.deleteMany({ where: { assoId } });
      await tx.grantDocument.deleteMany({ where: { assoId } });
      await tx.subvention.deleteMany({ where: { assoId } });
      await tx.financialMovement.deleteMany({ where: { assoId } });

      const demoMovements: DemoMovementFixture[] = [
        {
          movementType: "CREDIT",
          amountCents: 150_000,
          description: "Solde initial",
          createdAt: daysAgo(60),
        },
        {
          movementType: "CREDIT",
          amountCents: 35_000,
          description: "Cotisations adhérents",
          createdAt: daysAgo(45),
        },
        {
          movementType: "DEBIT",
          amountCents: 8_200,
          category: "Matériel",
          description: "Achat fournitures atelier",
          createdAt: daysAgo(30),
        },
        {
          movementType: "CREDIT",
          amountCents: 22_000,
          description: "Recette buvette",
          createdAt: daysAgo(20),
        },
        {
          movementType: "DEBIT",
          amountCents: 15_000,
          category: "Événement",
          description: "Location salle soirée",
          createdAt: daysAgo(12),
        },
        {
          movementType: "DEBIT",
          amountCents: 4_500,
          category: "Communication",
          description: "Impression affiches",
          createdAt: daysAgo(3),
        },
      ];

      await tx.financialMovement.createMany({
        data: demoMovements.map((movement) => ({
          ...movement,
          assoId,
          origin: "MANUAL" as const,
          accountType: "CLUB_BALANCE" as const,
          createdBy: creatorId,
        })),
      });

      // upsert plutôt que delete+create : avec un id fixe, deux resets
      // concurrents (double-clic, deux visiteurs à la fois) recréant la même
      // ligne en même temps se percuteraient sur la clé primaire.
      const campaign = await tx.subventionCampaign.upsert({
        where: { id: DEMO_CAMPAIGN_ID },
        update: {
          type: "CA_BUDGET",
          name: "CA Budget 2026 (démo)",
          date: daysAgo(15),
          publicationDate: daysAgo(10),
        },
        create: {
          id: DEMO_CAMPAIGN_ID,
          type: "CA_BUDGET",
          name: "CA Budget 2026 (démo)",
          date: daysAgo(15),
          publicationDate: daysAgo(10),
        },
      });

      const subvention = await tx.subvention.create({
        data: {
          campaignId: campaign.id,
          assoId,
          reason: "Achat de matériel pédagogique",
          amountCents: 50_000,
          commentary:
            "Voté en CA du " + daysAgo(15).toLocaleDateString("fr-FR"),
        },
      });

      const expenseType = (label: string) => {
        const id = typeDepenseIdByLabel.get(label) ?? null;
        return { typeDepenseId: id, customLabel: id ? null : label };
      };

      const createDemoReport = (params: {
        title: string;
        description?: string;
        status: "DRAFT" | "SUBMITTED" | "TAKEN_OVER" | "FINALIZED" | "REJECTED";
        beneficiary: DemoBeneficiary;
        createdAt?: Date;
        submittedAt?: Date;
        takenAt?: Date;
        finalizedAt?: Date;
        takenByAdminId?: string;
        lines: DemoLineFixture[];
      }) =>
        tx.expenseReport.create({
          data: {
            assoId,
            createdBy: creatorId,
            title: params.title,
            description: params.description,
            status: params.status,
            createdAt: params.createdAt,
            submittedAt: params.submittedAt,
            takenAt: params.takenAt,
            finalizedAt: params.finalizedAt,
            takenByAdminId: params.takenByAdminId,
            beneficiaryFirstname: params.beneficiary.firstname,
            beneficiaryLastname: params.beneficiary.lastname,
            lines: {
              create: params.lines.map((line) => ({
                amountCents: line.amountCents,
                expenseName: line.expenseName,
                ...expenseType(line.typeLabel),
                fundingSource: line.fundingSource,
                subventionId: line.subventionId,
              })),
            },
          },
        });

      // Brouillon : en cours de saisie, pas encore soumise.
      await createDemoReport({
        title: "Weekend d'intégration",
        description: "Frais de transport et de restauration du weekend",
        status: "DRAFT",
        beneficiary: treasurerName,
        lines: [
          {
            amountCents: 6_400,
            expenseName: "Location minibus",
            typeLabel: "Transport",
            fundingSource: "CLUB_BALANCE",
          },
        ],
      });

      // Soumise : en attente de traitement Admin, financée moitié Solde
      // moitié Subvention pour montrer les deux sources sur une même note.
      await createDemoReport({
        title: "Achats fournitures bureau",
        status: "SUBMITTED",
        submittedAt: daysAgo(2),
        beneficiary: { firstname: "Julien", lastname: "Petit" },
        lines: [
          {
            amountCents: 3_200,
            expenseName: "Ramette de papier et stylos",
            typeLabel: "Matériel",
            fundingSource: "CLUB_BALANCE",
          },
          {
            amountCents: 12_000,
            expenseName: "Vidéoprojecteur",
            typeLabel: "Matériel",
            fundingSource: "SUBVENTION",
            subventionId: subvention.id,
          },
        ],
      });

      // Prise en charge par l'Admin (démo) : plus modifiable côté Structure.
      await createDemoReport({
        title: "Frais de déplacement séminaire",
        status: "TAKEN_OVER",
        submittedAt: daysAgo(6),
        takenAt: daysAgo(4),
        takenByAdminId: adminId,
        beneficiary: treasurerName,
        lines: [
          {
            amountCents: 9_800,
            expenseName: "Trajet train aller-retour",
            typeLabel: "Transport",
            fundingSource: "CLUB_BALANCE",
          },
        ],
      });

      // Rejetée : statut terminal, pour montrer le badge correspondant.
      await createDemoReport({
        title: "Location sono soirée",
        status: "REJECTED",
        submittedAt: daysAgo(20),
        takenAt: daysAgo(18),
        takenByAdminId: adminId,
        beneficiary: treasurerName,
        lines: [
          {
            amountCents: 25_000,
            expenseName: "Location sono + éclairage",
            typeLabel: "Événement",
            fundingSource: "CLUB_BALANCE",
          },
        ],
      });

      // Notes anciennes (années précédentes), pour donner un vrai historique
      // à parcourir sur les pages qui étalent la liste sur plusieurs années
      // (au lieu des seules notes "du jour" ci-dessus).
      await createDemoReport({
        title: "Séminaire de rentrée",
        status: "FINALIZED",
        createdAt: daysAgo(350),
        submittedAt: daysAgo(347),
        takenAt: daysAgo(344),
        finalizedAt: daysAgo(343),
        takenByAdminId: adminId,
        beneficiary: { firstname: "Julien", lastname: "Petit" },
        lines: [
          {
            amountCents: 14_500,
            expenseName: "Location salle et pause café",
            typeLabel: "Événement",
            fundingSource: "CLUB_BALANCE",
          },
        ],
      });

      await createDemoReport({
        title: "Achat matériel sportif",
        status: "FINALIZED",
        createdAt: daysAgo(660),
        submittedAt: daysAgo(657),
        takenAt: daysAgo(654),
        finalizedAt: daysAgo(653),
        takenByAdminId: adminId,
        beneficiary: treasurerName,
        lines: [
          {
            amountCents: 18_900,
            expenseName: "Ballons, plots et chasubles",
            typeLabel: "Matériel",
            fundingSource: "CLUB_BALANCE",
          },
        ],
      });

      await createDemoReport({
        title: "Location salle d'assemblée générale",
        status: "FINALIZED",
        createdAt: daysAgo(700),
        submittedAt: daysAgo(697),
        takenAt: daysAgo(694),
        finalizedAt: daysAgo(693),
        takenByAdminId: adminId,
        beneficiary: { firstname: "Julien", lastname: "Petit" },
        lines: [
          {
            amountCents: 22_000,
            expenseName: "Location amphithéâtre + traiteur",
            typeLabel: "Événement",
            fundingSource: "CLUB_BALANCE",
          },
        ],
      });

      await createDemoReport({
        title: "Mission bureau national",
        status: "REJECTED",
        createdAt: daysAgo(730),
        submittedAt: daysAgo(727),
        takenAt: daysAgo(724),
        takenByAdminId: adminId,
        beneficiary: treasurerName,
        lines: [
          {
            amountCents: 31_000,
            expenseName: "Billets de train + hôtel",
            typeLabel: "Transport",
            fundingSource: "CLUB_BALANCE",
          },
        ],
      });

      await createDemoReport({
        title: "Weekend ski associatif",
        status: "FINALIZED",
        createdAt: daysAgo(1050),
        submittedAt: daysAgo(1047),
        takenAt: daysAgo(1044),
        finalizedAt: daysAgo(1043),
        takenByAdminId: adminId,
        beneficiary: { firstname: "Julien", lastname: "Petit" },
        lines: [
          {
            amountCents: 42_000,
            expenseName: "Location minibus + forfaits",
            typeLabel: "Transport",
            fundingSource: "CLUB_BALANCE",
          },
        ],
      });

      await createDemoReport({
        title: "Impression flyers forum des associations",
        status: "FINALIZED",
        createdAt: daysAgo(1230),
        submittedAt: daysAgo(1227),
        takenAt: daysAgo(1224),
        finalizedAt: daysAgo(1223),
        takenByAdminId: adminId,
        beneficiary: treasurerName,
        lines: [
          {
            amountCents: 5_600,
            expenseName: "Impression flyers et affiches",
            typeLabel: "Communication",
            fundingSource: "CLUB_BALANCE",
          },
        ],
      });

      await createDemoReport({
        title: "Achat banderole association",
        status: "FINALIZED",
        createdAt: daysAgo(1370),
        submittedAt: daysAgo(1367),
        takenAt: daysAgo(1364),
        finalizedAt: daysAgo(1363),
        takenByAdminId: adminId,
        beneficiary: { firstname: "Julien", lastname: "Petit" },
        lines: [
          {
            amountCents: 9_200,
            expenseName: "Banderole grand format",
            typeLabel: "Communication",
            fundingSource: "CLUB_BALANCE",
          },
        ],
      });
    },
    { timeout: 15_000, maxWait: 10_000 },
  );
}
