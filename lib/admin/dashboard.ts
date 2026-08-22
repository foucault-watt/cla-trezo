import {
  EXCLUDE_DEMO_ASSO,
  EXCLUDE_DEMO_ASSO_RELATION,
  EXCLUDE_DEMO_CAMPAIGN,
} from "@/lib/auth/demo-config";
import { prisma } from "@/lib/prisma";
import { getCampaignStatus } from "@/lib/subventions/status";

const DAY_MS = 24 * 60 * 60 * 1000;
const YEAR_MS = 365 * DAY_MS;

export type RollingWindow = { currentStart: Date; previousStart: Date };

/**
 * Fenêtre glissante de 365 jours vs les 365 jours précédents (pas année
 * civile) : borne haute implicite = `now` pour la période courante, et
 * `currentStart` pour la période précédente.
 */
export function rollingWindow(now: Date): RollingWindow {
  return {
    currentStart: new Date(now.getTime() - YEAR_MS),
    previousStart: new Date(now.getTime() - 2 * YEAR_MS),
  };
}

export function startOfMonth(now: Date): Date {
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

export function daysSince(date: Date, now: Date): number {
  return Math.floor((now.getTime() - date.getTime()) / DAY_MS);
}

/**
 * Répartit des lignes datées entre la période courante et la précédente
 * d'une RollingWindow. Les lignes plus anciennes que `previousStart` sont
 * ignorées (le caller ne les récupère normalement pas en base).
 */
export function sumInWindow(
  rows: { amountCents: number; createdAt: Date }[],
  window: RollingWindow,
): { current: number; previous: number } {
  return rows.reduce(
    (acc, row) => {
      if (row.createdAt >= window.currentStart) {
        acc.current += row.amountCents;
      } else if (row.createdAt >= window.previousStart) {
        acc.previous += row.amountCents;
      }
      return acc;
    },
    { current: 0, previous: 0 },
  );
}

export type CampaignInfo =
  | { kind: "pending"; name: string; publicationDate: Date | null }
  | { kind: "published"; name: string; publicationDate: Date };

/**
 * Un seul repère sur les Campagnes de subvention : priorité à la prochaine
 * Programmée (cf. lib/subventions/status.ts — pas de notion de "retard",
 * juste Programmée/Publiée), sinon la dernière Publiée à titre indicatif,
 * sinon rien s'il n'existe aucune Campagne.
 */
export function selectCampaignInfo(
  campaigns: { name: string; publicationDate: Date | null }[],
  now: Date,
): CampaignInfo | null {
  const pending = campaigns.filter(
    (c) => getCampaignStatus(c.publicationDate, now) === "PROGRAMMEE",
  );
  if (pending.length > 0) {
    const withDate = pending.filter(
      (c): c is { name: string; publicationDate: Date } =>
        c.publicationDate !== null,
    );
    const next = withDate.sort(
      (a, b) => a.publicationDate.getTime() - b.publicationDate.getTime(),
    )[0];
    const chosen = next ?? pending[0];
    return {
      kind: "pending",
      name: chosen.name,
      publicationDate: chosen.publicationDate,
    };
  }

  const published = campaigns.filter(
    (c): c is { name: string; publicationDate: Date } =>
      c.publicationDate !== null &&
      getCampaignStatus(c.publicationDate, now) === "PUBLIEE",
  );
  if (published.length > 0) {
    const last = published.sort(
      (a, b) => b.publicationDate.getTime() - a.publicationDate.getTime(),
    )[0];
    return {
      kind: "published",
      name: last.name,
      publicationDate: last.publicationDate,
    };
  }

  return null;
}

export type ActivityEventType =
  "note_finalisee" | "note_soumise" | "subvention_creee" | "mouvement";

export type ActivityEvent = {
  id: string;
  type: ActivityEventType;
  assoName: string;
  label: string;
  amountCents?: number;
  date: Date;
};

export function buildActivityFeed(
  events: ActivityEvent[],
  limit: number,
): ActivityEvent[] {
  return [...events]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, limit);
}

type ReportForActivity = {
  id: string;
  createdAt: Date;
  asso: { name: string };
  lines: { amountCents: number }[];
};

/**
 * Notes de frais Validées et Soumises partagent la même forme d'événement
 * (somme des Lignes, date de la transition) ; seuls le préfixe d'id, le
 * type, le libellé et le champ de date diffèrent selon l'appelant.
 */
function reportActivity(
  report: ReportForActivity,
  options: {
    idPrefix: string;
    type: ActivityEventType;
    label: string;
    date: Date | null;
  },
): ActivityEvent {
  return {
    id: `${options.idPrefix}-${report.id}`,
    type: options.type,
    assoName: report.asso.name,
    label: options.label,
    amountCents: report.lines.reduce((sum, line) => sum + line.amountCents, 0),
    date: options.date ?? report.createdAt,
  };
}

export type QueueItem = {
  id: string;
  assoName: string;
  title: string;
  amountCents: number;
  daysWaiting: number;
};

export type DashboardData = {
  assosActives: number;
  subventionsAccordeesCents365j: number;
  subventionsAccordeesCents365jPrecedents: number;
  montantRembourseCents365j: number;
  montantRembourseCents365jPrecedents: number;
  notesTraiteesCeMois: number;
  queue: QueueItem[];
  campaignInfo: CampaignInfo | null;
  recentActivity: ActivityEvent[];
};

/**
 * Vue d'ensemble Admin du dashboard : file d'attente, activité récente,
 * chiffres clés sur une fenêtre glissante de 365 jours (cf. rollingWindow).
 * "Notes de frais traitées ce mois-ci" compte les Prises en charge du mois
 * (`takenAt`), pas les Validations : la Validation (statut FINALIZED) n'est
 * pas encore implémentée dans l'app, seul "Prendre en charge" existe.
 */
export async function getDashboardData(
  now: Date = new Date(),
): Promise<DashboardData> {
  const window = rollingWindow(now);
  const monthStart = startOfMonth(now);

  const [
    assosActives,
    subventionRows,
    movementRows,
    notesTraiteesCeMois,
    queueReports,
    campaigns,
    finalizedReports,
    submittedReports,
    subventionsForActivity,
    manualMovements,
  ] = await Promise.all([
    prisma.asso.count({ where: { status: "ACTIVE", ...EXCLUDE_DEMO_ASSO } }),
    prisma.subvention.findMany({
      where: {
        createdAt: { gte: window.previousStart },
        ...EXCLUDE_DEMO_ASSO_RELATION,
      },
      select: { amountCents: true, createdAt: true },
    }),
    prisma.financialMovement.findMany({
      where: {
        origin: "EXPENSE_REPORT",
        createdAt: { gte: window.previousStart },
        ...EXCLUDE_DEMO_ASSO_RELATION,
      },
      select: { amountCents: true, createdAt: true },
    }),
    prisma.expenseReport.count({
      where: { takenAt: { gte: monthStart }, ...EXCLUDE_DEMO_ASSO_RELATION },
    }),
    prisma.expenseReport.findMany({
      where: {
        status: { in: ["SUBMITTED", "TAKEN_OVER"] },
        ...EXCLUDE_DEMO_ASSO_RELATION,
      },
      orderBy: { submittedAt: "asc" },
      take: 8,
      select: {
        id: true,
        title: true,
        createdAt: true,
        submittedAt: true,
        asso: { select: { name: true } },
        lines: { select: { amountCents: true } },
      },
    }),
    prisma.subventionCampaign.findMany({
      where: EXCLUDE_DEMO_CAMPAIGN,
      orderBy: { date: "desc" },
      take: 20,
      select: { name: true, publicationDate: true },
    }),
    prisma.expenseReport.findMany({
      // Jamais FINALIZED côté démo (cf. lib/auth/demo.ts) : pas besoin du
      // filtre isDemo ici, mais gardé si un jour la démo génère ce statut.
      where: { finalizedAt: { not: null }, ...EXCLUDE_DEMO_ASSO_RELATION },
      orderBy: { finalizedAt: "desc" },
      take: 5,
      select: {
        id: true,
        createdAt: true,
        finalizedAt: true,
        asso: { select: { name: true } },
        lines: { select: { amountCents: true } },
      },
    }),
    prisma.expenseReport.findMany({
      where: { submittedAt: { not: null }, ...EXCLUDE_DEMO_ASSO_RELATION },
      orderBy: { submittedAt: "desc" },
      take: 5,
      select: {
        id: true,
        createdAt: true,
        submittedAt: true,
        asso: { select: { name: true } },
        lines: { select: { amountCents: true } },
      },
    }),
    prisma.subvention.findMany({
      where: EXCLUDE_DEMO_ASSO_RELATION,
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        createdAt: true,
        reason: true,
        amountCents: true,
        asso: { select: { name: true } },
      },
    }),
    prisma.financialMovement.findMany({
      where: { origin: "MANUAL", ...EXCLUDE_DEMO_ASSO_RELATION },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        createdAt: true,
        movementType: true,
        amountCents: true,
        asso: { select: { name: true } },
      },
    }),
  ]);

  const subventionsSum = sumInWindow(subventionRows, window);
  const movementsSum = sumInWindow(movementRows, window);

  const queue: QueueItem[] = queueReports.map((report) => ({
    id: report.id,
    assoName: report.asso.name,
    title: report.title,
    amountCents: report.lines.reduce((sum, line) => sum + line.amountCents, 0),
    daysWaiting: daysSince(report.submittedAt ?? report.createdAt, now),
  }));

  const campaignInfo = selectCampaignInfo(campaigns, now);

  const recentActivity = buildActivityFeed(
    [
      ...finalizedReports.map((report) =>
        reportActivity(report, {
          idPrefix: "finalized",
          type: "note_finalisee",
          label: "Note de frais validée",
          date: report.finalizedAt,
        }),
      ),
      ...submittedReports.map((report) =>
        reportActivity(report, {
          idPrefix: "submitted",
          type: "note_soumise",
          label: "Note de frais soumise",
          date: report.submittedAt,
        }),
      ),
      ...subventionsForActivity.map((subvention): ActivityEvent => ({
        id: `subvention-${subvention.id}`,
        type: "subvention_creee",
        assoName: subvention.asso.name,
        label: `Subvention accordée — ${subvention.reason}`,
        amountCents: subvention.amountCents,
        date: subvention.createdAt,
      })),
      ...manualMovements.map((movement): ActivityEvent => ({
        id: `movement-${movement.id}`,
        type: "mouvement",
        assoName: movement.asso.name,
        label:
          movement.movementType === "CREDIT"
            ? "Entrée manuelle sur le solde"
            : "Sortie manuelle sur le solde",
        amountCents: movement.amountCents,
        date: movement.createdAt,
      })),
    ],
    6,
  );

  return {
    assosActives,
    subventionsAccordeesCents365j: subventionsSum.current,
    subventionsAccordeesCents365jPrecedents: subventionsSum.previous,
    montantRembourseCents365j: movementsSum.current,
    montantRembourseCents365jPrecedents: movementsSum.previous,
    notesTraiteesCeMois,
    queue,
    campaignInfo,
    recentActivity,
  };
}
