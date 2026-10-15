import { unauditedPrisma as db } from "@/lib/prisma";
import { analyticsCutoff, auditCutoff } from "./retention";

/*
 * Purge des données de suivi (cf. retention.ts). L'image Docker ne contient
 * pas de quoi lancer un script planifié : la maintenance tourne donc dans le
 * serveur, déclenchée au plus une fois par jour par une page vue (cf.
 * app/api/analytics/page-view/route.ts). Chaque étape est idempotente.
 */

// Les colonnes sont des TIMESTAMP sans fuseau, remplies en UTC par Prisma :
// on compare à une chaîne ISO castée, jamais à un timestamptz local.
const ts = (date: Date) => date.toISOString();

export async function runAnalyticsMaintenance(now = new Date()) {
  const cutoff = ts(analyticsCutoff(now));
  const auditLimit = ts(auditCutoff(now));

  // UserLog garde, hors purge, la dernière connexion de chacun : elle
  // alimente « dernière connexion » des Membres (cf. lib/asso/members.ts).
  await db.$transaction([
    // Agrégats anonymes, hors Admins : la tendance d'usage réel des Assos.
    db.$executeRaw`
      INSERT INTO usage_monthly_stat (id, month, metric, asso_id, route, value)
      SELECT gen_random_uuid(), date_trunc('month', created_at)::date,
             'page_views', asso_id, route, count(*)::int
      FROM page_view
      WHERE created_at < ${cutoff}::timestamp AND NOT is_admin
      GROUP BY 2, 4, 5`,
    db.$executeRaw`
      INSERT INTO usage_monthly_stat (id, month, metric, asso_id, route, value)
      SELECT gen_random_uuid(), date_trunc('month', created_at)::date,
             'active_users', NULL, '', count(DISTINCT user_id)::int
      FROM page_view
      WHERE created_at < ${cutoff}::timestamp AND NOT is_admin
      GROUP BY 2`,
    db.$executeRaw`
      INSERT INTO usage_monthly_stat (id, month, metric, asso_id, route, value)
      SELECT gen_random_uuid(), date_trunc('month', created_at)::date,
             'active_users_by_asso', asso_id, '', count(DISTINCT user_id)::int
      FROM page_view
      WHERE created_at < ${cutoff}::timestamp AND NOT is_admin
        AND asso_id IS NOT NULL
      GROUP BY 2, 4`,
    db.$executeRaw`
      INSERT INTO usage_monthly_stat (id, month, metric, asso_id, route, value)
      SELECT gen_random_uuid(), date_trunc('month', l.connected_at)::date,
             'logins', NULL, '', count(*)::int
      FROM user_log l
      JOIN "user" u ON u.id = l.user_id
      WHERE l.connected_at < ${cutoff}::timestamp AND NOT u.is_admin
        AND l.id NOT IN (
          SELECT DISTINCT ON (user_id) id FROM user_log
          ORDER BY user_id, connected_at DESC
        )
      GROUP BY 2`,
    db.$executeRaw`
      DELETE FROM page_view WHERE created_at < ${cutoff}::timestamp`,
    db.$executeRaw`
      DELETE FROM user_log
      WHERE connected_at < ${cutoff}::timestamp
        AND id NOT IN (
          SELECT DISTINCT ON (user_id) id FROM user_log
          ORDER BY user_id, connected_at DESC
        )`,
    // Utilisateur sortant (plus aucun rôle dans une Structure, et pas
    // Admin) : son détail de navigation est supprimé. Le journal d'audit,
    // lui, reste : il ne contient aucun nom.
    db.$executeRaw`
      DELETE FROM page_view pv
      WHERE NOT EXISTS (SELECT 1 FROM ref_asso_user r WHERE r.user_id = pv.user_id)
        AND NOT EXISTS (
          SELECT 1 FROM "user" u WHERE u.id = pv.user_id AND u.is_admin
        )`,
    db.$executeRaw`
      DELETE FROM audit_log WHERE created_at < ${auditLimit}::timestamp`,
  ]);
}

const DAY_MS = 24 * 60 * 60 * 1000;
const RETRY_MS = 60 * 60 * 1000;
let nextRunAt = 0;

/** Lance la maintenance si elle n'a pas tourné depuis 24 h dans ce process. */
export async function maybeRunAnalyticsMaintenance(now = Date.now()) {
  if (now < nextRunAt) return;
  nextRunAt = now + DAY_MS;
  try {
    await runAnalyticsMaintenance(new Date(now));
  } catch (error) {
    nextRunAt = now + RETRY_MS;
    console.error("[analytics] Échec de la maintenance :", error);
  }
}
