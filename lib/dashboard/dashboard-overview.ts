import { requireStructureAccess } from "@/lib/auth/guards";
import {
  groupByYear,
  mergeActivityEvents,
  type YearGroup,
} from "@/lib/dashboard/activity-feed";
import {
  listExpenseReports,
  type ExpenseReportOverview,
} from "@/lib/expense-reports/expense-reports";
import { formatCents } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { getClubSolde } from "@/lib/solde/actions";
import type { SoldeMovement, SoldeView } from "@/lib/solde/solde";
import {
  listVisibleSubventions,
  type VisibleSubvention,
} from "@/lib/subventions/visible-subventions";

/**
 * L'application vit sur plusieurs années : sommer les Notes de frais ou les
 * Subventions depuis l'origine donnerait des montants qui grossissent sans
 * fin et perdent leur sens sur le Dashboard. Ces indicateurs sont donc
 * scopés aux 365 derniers jours ; seul le Solde reste une vraie somme
 * cumulée (cf. lib/solde/solde.ts), puisque c'est un solde bancaire réel,
 * pas un compteur d'activité.
 */
const WINDOW_DAYS = 365;

export type { YearGroup };

export type DashboardActivity = {
  id: string;
  date: Date;
  kind: "note-de-frais" | "subvention";
  label: string;
  detail: string;
};

export type DashboardOverview = {
  solde: SoldeView;
  soldeMovementsByYear: YearGroup<SoldeMovement>[];
  notesDeFrais: {
    enAttente: number;
    totalLast365Days: number;
    montantTotalLast365DaysCents: number;
  };
  subventions: {
    activesLast365Days: number;
    montantRestantLast365DaysCents: number;
    montantTotalLast365DaysCents: number;
  };
  recentActivityByYear: YearGroup<DashboardActivity>[];
};

function beneficiaryLabel(report: {
  beneficiaryFirstname: string | null;
  beneficiaryLastname: string | null;
}): string {
  const name = [report.beneficiaryFirstname, report.beneficiaryLastname]
    .filter(Boolean)
    .join(" ");
  return name || "Bénéficiaire";
}

function reportsWithinWindow(
  reports: ExpenseReportOverview[],
  cutoff: Date,
): ExpenseReportOverview[] {
  return reports.filter((r) => r.createdAt >= cutoff);
}

type ActivityReportRow = {
  id: string;
  submittedAt: Date | null;
  finalizedAt: Date | null;
  beneficiaryFirstname: string | null;
  beneficiaryLastname: string | null;
  lines: { amountCents: number }[];
};

/**
 * Notes de frais soumises/validées et Subventions publiées, fusionnées en un
 * seul fil chronologique pour l'Activité récente d'une Structure sans Solde
 * (Commission/Association, cf. CONTEXT.md). `visibleSubventions` est déjà
 * chargée par l'appelant (getDashboardOverview) pour les stats Subventions ;
 * on la réutilise ici plutôt que d'interroger deux fois la même Structure.
 */
function buildRecentActivity(
  reports: ActivityReportRow[],
  visibleSubventions: VisibleSubvention[],
): DashboardActivity[] {
  const reportEvents: DashboardActivity[] = reports.flatMap((report) => {
    const amount = formatCents(
      report.lines.reduce((sum, line) => sum + line.amountCents, 0),
    );
    const events: DashboardActivity[] = [];
    if (report.submittedAt) {
      events.push({
        id: `${report.id}-submitted`,
        date: report.submittedAt,
        kind: "note-de-frais",
        label: "Note de frais soumise",
        detail: `${beneficiaryLabel(report)} — ${amount}`,
      });
    }
    if (report.finalizedAt) {
      events.push({
        id: `${report.id}-finalized`,
        date: report.finalizedAt,
        kind: "note-de-frais",
        label: "Note de frais validée",
        detail: `${beneficiaryLabel(report)} — ${amount}`,
      });
    }
    return events;
  });

  const seenCampaigns = new Set<string>();
  const subventionEvents: DashboardActivity[] = [];
  for (const s of visibleSubventions) {
    if (seenCampaigns.has(s.campaignId)) continue;
    seenCampaigns.add(s.campaignId);
    subventionEvents.push({
      id: `campaign-${s.campaignId}`,
      date: s.publicationDate,
      kind: "subvention",
      label: "Subvention publiée",
      detail: s.campaignName,
    });
  }

  return mergeActivityEvents([...reportEvents, ...subventionEvents]);
}

export async function getDashboardOverview(
  assoSlug: string,
): Promise<DashboardOverview> {
  const { structure } = await requireStructureAccess(assoSlug);
  const cutoff = new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000);

  const [solde, reports, visibleSubventions, activityReports] =
    await Promise.all([
      getClubSolde(assoSlug),
      listExpenseReports(assoSlug),
      listVisibleSubventions(assoSlug),
      prisma.expenseReport.findMany({
        where: { assoId: structure.assoId },
        select: {
          id: true,
          submittedAt: true,
          finalizedAt: true,
          beneficiaryFirstname: true,
          beneficiaryLastname: true,
          lines: { select: { amountCents: true } },
        },
      }),
    ]);

  const recentActivity = buildRecentActivity(
    activityReports,
    visibleSubventions,
  );

  const soldeMovementsByYear =
    solde.status === "ready"
      ? groupByYear(solde.movements, (m) => m.createdAt)
      : [];

  const enAttente = reports.filter(
    (r) => r.status === "SUBMITTED" || r.status === "TAKEN_OVER",
  ).length;
  const reportsLast365Days = reportsWithinWindow(reports, cutoff);

  const subventionsLast365Days = visibleSubventions.filter(
    (s) => s.campaignDate >= cutoff,
  );
  const activeCampaignIds = new Set(
    subventionsLast365Days.map((s) => s.campaignId),
  );

  return {
    solde,
    soldeMovementsByYear,
    notesDeFrais: {
      enAttente,
      totalLast365Days: reportsLast365Days.length,
      montantTotalLast365DaysCents: reportsLast365Days.reduce(
        (sum, r) => sum + r.totalAmountCents,
        0,
      ),
    },
    subventions: {
      activesLast365Days: activeCampaignIds.size,
      montantRestantLast365DaysCents: subventionsLast365Days.reduce(
        (sum, s) => sum + s.remainingAmountCents,
        0,
      ),
      montantTotalLast365DaysCents: subventionsLast365Days.reduce(
        (sum, s) => sum + s.totalAmountCents,
        0,
      ),
    },
    recentActivityByYear: groupByYear(recentActivity, (a) => a.date),
  };
}
