import { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { summarizeVisits, type VisitSummary } from "./visits";

/*
 * Lectures des pages Admin cachées /app/admin/stats (cf. décisions de suivi
 * dans les mentions légales). Agrégats en SQL : un compte par utilisateur
 * reste rapide même avec tout le catalogue SSO en base.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

const n = (value: bigint | number | null | undefined) => Number(value ?? 0);

/** Borne « il y a `days` jours », castée pour les colonnes TIMESTAMP UTC. */
function since(now: Date, days: number) {
  return Prisma.sql`${new Date(now.getTime() - days * DAY_MS).toISOString()}::timestamp`;
}

export type StatsFilter = { includeAdmins: boolean };

function pageViewAdminFilter({ includeAdmins }: StatsFilter, alias = "pv") {
  return includeAdmins
    ? Prisma.empty
    : Prisma.sql`AND NOT ${Prisma.raw(alias)}.is_admin`;
}

function auditAdminFilter({ includeAdmins }: StatsFilter) {
  return includeAdmins ? Prisma.empty : Prisma.sql`AND NOT al.actor_is_admin`;
}

// ─── Vue d'ensemble ──────────────────────────────────────────────────────────

export type UsageOverview = Awaited<ReturnType<typeof getUsageOverview>>;

export async function getUsageOverview(filter: StatsFilter, now = new Date()) {
  const pvFilter = pageViewAdminFilter(filter);
  const alFilter = auditAdminFilter(filter);

  const [
    [activity],
    daily,
    routes,
    assos,
    features,
    [adoption],
    devices,
    archive,
  ] = await Promise.all([
    prisma.$queryRaw<
      { d1: bigint; d7: bigint; d30: bigint; d90: bigint; views30: bigint }[]
    >`
      SELECT
        count(DISTINCT user_id) FILTER (WHERE created_at >= ${since(now, 1)}) AS d1,
        count(DISTINCT user_id) FILTER (WHERE created_at >= ${since(now, 7)}) AS d7,
        count(DISTINCT user_id) FILTER (WHERE created_at >= ${since(now, 30)}) AS d30,
        count(DISTINCT user_id) AS d90,
        count(*) FILTER (WHERE created_at >= ${since(now, 30)}) AS views30
      FROM page_view pv
      WHERE created_at >= ${since(now, 90)} ${pvFilter}`,
    prisma.$queryRaw<{ day: string; users: bigint; views: bigint }[]>`
      SELECT to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS day,
             count(DISTINCT user_id) AS users, count(*) AS views
      FROM page_view pv
      WHERE created_at >= ${since(now, 30)} ${pvFilter}
      GROUP BY 1 ORDER BY 1`,
    prisma.$queryRaw<{ route: string; views: bigint; users: bigint }[]>`
      SELECT route, count(*) AS views, count(DISTINCT user_id) AS users
      FROM page_view pv
      WHERE created_at >= ${since(now, 30)} ${pvFilter}
      GROUP BY route ORDER BY views DESC LIMIT 15`,
    prisma.$queryRaw<
      {
        id: string;
        name: string;
        users: bigint;
        views: bigint;
        actions: bigint;
      }[]
    >`
      SELECT a.id, a.name,
             count(DISTINCT pv.user_id) AS users, count(pv.id) AS views,
             (SELECT count(*) FROM audit_log al
               WHERE al.asso_id = a.id AND al.created_at >= ${since(now, 30)}
               ${alFilter}) AS actions
      FROM asso a
      JOIN page_view pv ON pv.asso_id = a.id
      WHERE pv.created_at >= ${since(now, 30)} ${pvFilter}
      GROUP BY a.id, a.name ORDER BY users DESC, views DESC LIMIT 20`,
    prisma.$queryRaw<{ action: string; count: bigint; users: bigint }[]>`
      SELECT action, count(*) AS count, count(DISTINCT actor_id) AS users
      FROM audit_log al
      WHERE created_at >= ${since(now, 30)} ${alFilter}
      GROUP BY action ORDER BY count DESC`,
    // Adoption : Membres d'au moins une Structure (jamais les Admins).
    prisma.$queryRaw<
      { total: bigint; never: bigint; dormant: bigint; active30: bigint }[]
    >`
      WITH members AS (
        SELECT DISTINCT u.id FROM "user" u
        JOIN ref_asso_user r ON r.user_id = u.id
        WHERE NOT u.is_demo AND NOT u."isAdmin"
      ), seen AS (
        SELECT m.id, GREATEST(
          (SELECT max(created_at) FROM page_view WHERE user_id = m.id),
          (SELECT max(connected_at) FROM user_log WHERE user_id = m.id)
        ) AS last_seen
        FROM members m
      )
      SELECT count(*) AS total,
             count(*) FILTER (WHERE last_seen IS NULL) AS never,
             count(*) FILTER (WHERE last_seen < ${since(now, 90)}) AS dormant,
             count(*) FILTER (WHERE last_seen >= ${since(now, 30)}) AS active30
      FROM seen`,
    prisma.$queryRaw<{ device: string; users: bigint }[]>`
      SELECT device, count(DISTINCT user_id) AS users
      FROM page_view pv
      WHERE created_at >= ${since(now, 30)} ${pvFilter}
      GROUP BY device ORDER BY users DESC`,
    prisma.$queryRaw<{ month: string; metric: string; value: bigint }[]>`
      SELECT to_char(month, 'YYYY-MM') AS month, metric, sum(value) AS value
      FROM usage_monthly_stat
      WHERE metric IN ('page_views', 'active_users', 'logins')
      GROUP BY 1, 2 ORDER BY 1 DESC`,
  ]);

  const dailyByDay = new Map(daily.map((row) => [row.day, row]));
  const days = Array.from({ length: 30 }, (_, index) => {
    const day = new Date(now.getTime() - (29 - index) * DAY_MS)
      .toISOString()
      .slice(0, 10);
    const row = dailyByDay.get(day);
    return { day, users: n(row?.users), views: n(row?.views) };
  });

  const archiveByMonth = new Map<
    string,
    { month: string; pageViews: number; activeUsers: number; logins: number }
  >();
  for (const row of archive) {
    const entry = archiveByMonth.get(row.month) ?? {
      month: row.month,
      pageViews: 0,
      activeUsers: 0,
      logins: 0,
    };
    if (row.metric === "page_views") entry.pageViews = n(row.value);
    if (row.metric === "active_users") entry.activeUsers = n(row.value);
    if (row.metric === "logins") entry.logins = n(row.value);
    archiveByMonth.set(row.month, entry);
  }

  return {
    activeUsers: {
      d1: n(activity?.d1),
      d7: n(activity?.d7),
      d30: n(activity?.d30),
      d90: n(activity?.d90),
    },
    pageViews30: n(activity?.views30),
    days,
    routes: routes.map((row) => ({
      route: row.route,
      views: n(row.views),
      users: n(row.users),
    })),
    assos: assos.map((row) => ({
      id: row.id,
      name: row.name,
      users: n(row.users),
      views: n(row.views),
      actions: n(row.actions),
    })),
    features: features.map((row) => ({
      action: row.action,
      count: n(row.count),
      users: n(row.users),
    })),
    adoption: {
      members: n(adoption?.total),
      neverSeen: n(adoption?.never),
      dormant: n(adoption?.dormant),
      active30: n(adoption?.active30),
    },
    devices: devices.map((row) => ({
      device: row.device,
      users: n(row.users),
    })),
    archive: [...archiveByMonth.values()],
  };
}

// ─── Liste des utilisateurs ──────────────────────────────────────────────────

export const USERS_PAGE_SIZE = 50;

export type UserActivityRow = {
  id: string;
  firstname: string;
  lastname: string;
  username: string;
  isAdmin: boolean;
  assos: string | null;
  lastSeen: Date | null;
  lastLogin: Date | null;
  views30: number;
  days30: number;
  actions30: number;
};

export async function listUserActivity(
  filter: StatsFilter & { query: string; page: number },
  now = new Date(),
): Promise<{ rows: UserActivityRow[]; total: number }> {
  const conditions = [Prisma.sql`NOT u.is_demo`];
  if (!filter.includeAdmins) conditions.push(Prisma.sql`NOT u."isAdmin"`);
  const query = filter.query.trim();
  if (query) {
    const pattern = `%${query.replace(/[\\%_]/g, "\\$&")}%`;
    conditions.push(
      Prisma.sql`(u.firstname || ' ' || u.lastname || ' ' || u.username) ILIKE ${pattern}`,
    );
  }
  const where = Prisma.join(conditions, " AND ");
  const offset = Math.max(0, filter.page - 1) * USERS_PAGE_SIZE;

  const [rows, [{ total }]] = await Promise.all([
    prisma.$queryRaw<
      (Omit<UserActivityRow, "views30" | "days30" | "actions30" | "isAdmin"> & {
        is_admin: boolean;
        last_seen: Date | null;
        last_login: Date | null;
        views30: bigint;
        days30: bigint;
        actions30: bigint;
      })[]
    >`
      SELECT u.id, u.firstname, u.lastname, u.username, u."isAdmin" AS is_admin,
        (SELECT max(created_at) FROM page_view WHERE user_id = u.id) AS last_seen,
        (SELECT max(connected_at) FROM user_log WHERE user_id = u.id) AS last_login,
        (SELECT count(*) FROM page_view
          WHERE user_id = u.id AND created_at >= ${since(now, 30)}) AS views30,
        (SELECT count(DISTINCT date_trunc('day', created_at)) FROM page_view
          WHERE user_id = u.id AND created_at >= ${since(now, 30)}) AS days30,
        (SELECT count(*) FROM audit_log
          WHERE actor_id = u.id AND created_at >= ${since(now, 30)}) AS actions30,
        (SELECT string_agg(a.name, ', ' ORDER BY a.name)
          FROM ref_asso_user r JOIN asso a ON a.id = r.asso_id
          WHERE r.user_id = u.id) AS assos
      FROM "user" u
      WHERE ${where}
      ORDER BY GREATEST(
        (SELECT max(created_at) FROM page_view WHERE user_id = u.id),
        (SELECT max(connected_at) FROM user_log WHERE user_id = u.id)
      ) DESC NULLS LAST, u.lastname, u.firstname
      LIMIT ${USERS_PAGE_SIZE} OFFSET ${offset}`,
    prisma.$queryRaw<{ total: bigint }[]>`
      SELECT count(*) AS total FROM "user" u WHERE ${where}`,
  ]);

  return {
    total: n(total),
    rows: rows.map((row) => ({
      id: row.id,
      firstname: row.firstname,
      lastname: row.lastname,
      username: row.username,
      isAdmin: row.is_admin,
      assos: row.assos,
      lastSeen: row.last_seen,
      lastLogin: row.last_login,
      views30: n(row.views30),
      days30: n(row.days30),
      actions30: n(row.actions30),
    })),
  };
}

// ─── Fiche d'un utilisateur ──────────────────────────────────────────────────

export type TimelineEntry =
  | { kind: "page"; at: Date; path: string; device: string }
  | { kind: "login"; at: Date }
  | {
      kind: "action";
      at: Date;
      action: string;
      entityId: string | null;
      assoName: string | null;
      fromAdminSpace: boolean;
    };

export type UserActivityDetail = NonNullable<
  Awaited<ReturnType<typeof getUserActivity>>
>;

/** Fenêtres de la fiche : 7, 30 et 90 jours. */
const WINDOWS = [7, 30, 90] as const;

export async function getUserActivity(userId: string, now = new Date()) {
  const user = await prisma.user.findFirst({
    where: { id: userId, isDemo: false },
    select: {
      id: true,
      firstname: true,
      lastname: true,
      username: true,
      isAdmin: true,
      createdAt: true,
      memberships: {
        select: {
          role: true,
          createdAt: true,
          asso: { select: { id: true, name: true, slug: true } },
        },
        orderBy: { asso: { name: "asc" } },
      },
    },
  });
  if (!user) return null;

  const from90 = new Date(now.getTime() - 90 * DAY_MS);
  const [pageViews, lastPageView, logins, loginCount, actionCounts, actions] =
    await Promise.all([
      prisma.pageView.findMany({
        where: { userId, createdAt: { gte: from90 } },
        select: { createdAt: true, path: true, route: true, device: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.pageView.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      }),
      prisma.userLog.findMany({
        where: { userId },
        orderBy: { connectedAt: "desc" },
        take: 20,
        select: { connectedAt: true },
      }),
      prisma.userLog.count({ where: { userId } }),
      prisma.auditLog.groupBy({
        by: ["action"],
        where: { actorId: userId },
        _count: { _all: true },
        orderBy: { _count: { action: "desc" } },
      }),
      prisma.auditLog.findMany({
        where: { actorId: userId },
        orderBy: { createdAt: "desc" },
        take: 100,
        select: {
          createdAt: true,
          action: true,
          entityId: true,
          assoId: true,
          fromAdminSpace: true,
        },
      }),
    ]);

  const assoIds = [
    ...new Set(actions.map((a) => a.assoId).filter((id): id is string => !!id)),
  ];
  const assoNames = new Map(
    (
      await prisma.asso.findMany({
        where: { id: { in: assoIds } },
        select: { id: true, name: true },
      })
    ).map((asso) => [asso.id, asso.name]),
  );

  const windows = Object.fromEntries(
    WINDOWS.map((days) => {
      const from = now.getTime() - days * DAY_MS;
      const inWindow = pageViews.filter((pv) => pv.createdAt.getTime() >= from);
      return [
        days,
        {
          pageViews: inWindow.length,
          ...summarizeVisits(inWindow.map((pv) => pv.createdAt)),
        },
      ];
    }),
  ) as Record<(typeof WINDOWS)[number], VisitSummary & { pageViews: number }>;

  const countBy = (values: string[]) =>
    [
      ...values
        .reduce(
          (acc, value) => acc.set(value, (acc.get(value) ?? 0) + 1),
          new Map<string, number>(),
        )
        .entries(),
    ]
      .map(([key, count]) => ({ key, count }))
      .sort((a, b) => b.count - a.count);

  const timeline: TimelineEntry[] = [
    ...pageViews.slice(0, 100).map((pv): TimelineEntry => ({
      kind: "page",
      at: pv.createdAt,
      path: pv.path,
      device: pv.device,
    })),
    ...logins.map((log): TimelineEntry => ({
      kind: "login",
      at: log.connectedAt,
    })),
    ...actions.map((action): TimelineEntry => ({
      kind: "action",
      at: action.createdAt,
      action: action.action,
      entityId: action.entityId,
      assoName: action.assoId ? (assoNames.get(action.assoId) ?? null) : null,
      fromAdminSpace: action.fromAdminSpace,
    })),
  ]
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, 150);

  return {
    user,
    lastSeen: lastPageView?.createdAt ?? null,
    lastLogin: logins[0]?.connectedAt ?? null,
    loginCount,
    windows,
    devices: countBy(pageViews.map((pv) => pv.device)),
    routes: countBy(pageViews.map((pv) => pv.route)).slice(0, 10),
    actionCounts: actionCounts.map((row) => ({
      action: row.action,
      count: row._count._all,
    })),
    timeline,
  };
}

// ─── Journal d'audit ─────────────────────────────────────────────────────────

export const AUDIT_PAGE_SIZE = 100;

export async function listAuditLog(filter: {
  actorId?: string;
  assoId?: string;
  action?: string;
  page: number;
}) {
  const where: Prisma.AuditLogWhereInput = {
    ...(filter.actorId ? { actorId: filter.actorId } : {}),
    ...(filter.assoId ? { assoId: filter.assoId } : {}),
    ...(filter.action ? { action: filter.action } : {}),
  };

  const [entries, total, actions] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: AUDIT_PAGE_SIZE,
      skip: Math.max(0, filter.page - 1) * AUDIT_PAGE_SIZE,
    }),
    prisma.auditLog.count({ where }),
    prisma.auditLog.groupBy({ by: ["action"], orderBy: { action: "asc" } }),
  ]);

  const actorIds = [...new Set(entries.map((entry) => entry.actorId))];
  const assoIds = [
    ...new Set(entries.map((e) => e.assoId).filter((id): id is string => !!id)),
  ];
  const [actors, assos] = await Promise.all([
    prisma.user.findMany({
      where: { id: { in: actorIds } },
      select: { id: true, firstname: true, lastname: true },
    }),
    prisma.asso.findMany({
      where: { id: { in: assoIds } },
      select: { id: true, name: true },
    }),
  ]);
  const actorNames = new Map(
    actors.map((actor) => [actor.id, `${actor.firstname} ${actor.lastname}`]),
  );
  const assoNames = new Map(assos.map((asso) => [asso.id, asso.name]));

  return {
    total,
    actions: actions.map((row) => row.action),
    entries: entries.map((entry) => ({
      ...entry,
      actorName: actorNames.get(entry.actorId) ?? null,
      assoName: entry.assoId ? (assoNames.get(entry.assoId) ?? null) : null,
    })),
  };
}

// ─── Mes données ─────────────────────────────────────────────────────────────

/** Ce que le suivi conserve sur l'utilisateur connecté (page « Mes données »). */
export async function getOwnTrackingData(userId: string) {
  const [pageViewCount, pageViews, logins, auditCount, actions] =
    await Promise.all([
      prisma.pageView.count({ where: { userId } }),
      prisma.pageView.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: { createdAt: true, path: true, device: true },
      }),
      prisma.userLog.findMany({
        where: { userId },
        orderBy: { connectedAt: "desc" },
        take: 20,
        select: { connectedAt: true },
      }),
      prisma.auditLog.count({ where: { actorId: userId } }),
      prisma.auditLog.findMany({
        where: { actorId: userId },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: { createdAt: true, action: true },
      }),
    ]);

  return { pageViewCount, pageViews, logins, auditCount, actions };
}
