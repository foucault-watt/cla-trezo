import { z } from "zod";
import { prisma } from "@/lib/prisma";
import type { SessionStructure, SessionUser } from "@/lib/session";
import { planClaSync, type ClaSyncPlan } from "@/lib/auth/cla-sync-plan";
import type { AssoType } from "@/app/generated/prisma/enums";

export class ClaAuthError extends Error {}

// Type SSO → Type de Structure : le BDX est assimilé à une Association loi
// 1901 (cf. CONTEXT.md). Un Type inconnu fait échouer la validation.
const claAssociationTypes = {
  club: "CLUB",
  commission: "COMMISSION",
  asso_1901: "ASSOCIATION_1901",
  bdx: "ASSOCIATION_1901",
} as const satisfies Record<string, AssoType>;

const claAssociationTypeSchema = z
  .enum(Object.keys(claAssociationTypes) as [keyof typeof claAssociationTypes])
  .transform((type): AssoType => claAssociationTypes[type]);

const claAssociationRoleSchema = z.object({
  associationSlug: z.string().min(1),
  associationName: z.string().min(1),
  role: z.string().min(1),
  // Optionnel : seuls les services autorisés côté SSO le reçoivent.
  associationType: claAssociationTypeSchema.optional(),
});

const claPayloadSchema = z.object({
  username: z.string().min(1),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  cursus: z.string().optional(),
  isAdmin: z.boolean(),
  associationRoles: z.array(claAssociationRoleSchema).default([]),
});

const claResponseSchema = z.object({
  success: z.literal(true),
  payload: claPayloadSchema,
});

export type ClaAuthPayload = z.infer<typeof claPayloadSchema>;

function requireClaConfig() {
  const claAuthHost = process.env.CLA_AUTH_HOST;
  const claAuthIdentifier = process.env.CLA_AUTH_IDENTIFIER;
  if (!claAuthHost || !claAuthIdentifier) {
    throw new ClaAuthError("CLA_AUTH_HOST ou CLA_AUTH_IDENTIFIER manquant.");
  }
  return { claAuthHost, claAuthIdentifier };
}

export function getClaLoginUrl(): string {
  const { claAuthHost, claAuthIdentifier } = requireClaConfig();
  return `${claAuthHost}/authentification/${claAuthIdentifier}`;
}

export async function validateClaTicket(
  ticket: string,
): Promise<ClaAuthPayload> {
  const { claAuthHost, claAuthIdentifier } = requireClaConfig();
  const validationUrl = `${claAuthHost}/authentification/${claAuthIdentifier}/${encodeURIComponent(ticket)}`;

  const response = await fetch(validationUrl, { cache: "no-store" });
  if (!response.ok) {
    throw new ClaAuthError(
      `Le serveur d'authentification CLA a répondu ${response.status}.`,
    );
  }

  const parsed = claResponseSchema.safeParse(await response.json());
  if (!parsed.success) {
    throw new ClaAuthError(
      "La réponse du serveur d'authentification CLA est invalide.",
    );
  }
  return parsed.data.payload;
}

/** Un updateMany par libellé de poste plutôt qu'un update par ligne. */
function groupIdsByRole(
  updates: ClaSyncPlan["rolesToUpdate"],
): Map<string, string[]> {
  const idsByRole = new Map<string, string[]>();
  for (const { id, role } of updates) {
    idsByRole.set(role, [...(idsByRole.get(role) ?? []), id]);
  }
  return idsByRole;
}

function requireAssoId(
  assoIdBySlug: Map<string, string>,
  slug: string,
): string {
  const assoId = assoIdBySlug.get(slug);
  if (!assoId) {
    throw new Error(`Structure introuvable après synchro CLA : ${slug}`);
  }
  return assoId;
}

const syncAssoSelect = {
  id: true,
  slug: true,
  name: true,
  status: true,
  isDemo: true,
  type: true,
} as const;

/**
 * Crée ou met à jour l'utilisateur et aligne ses rôles de Structure sur ceux
 * renvoyés par CLA, qui fait foi : un rôle qui n'est plus renvoyé est
 * supprimé, un poste changé met à jour la ligne existante, sans historique.
 * Une Structure inconnue en base est créée à la volée en ACTIVE, avec le nom
 * et le Type du SSO, qui les impose aussi aux Structures existantes.
 * Les règles vivent dans planClaSync (lib/auth/cla-sync-plan.ts) ; ici on lit
 * l'existant et on applique le plan en écritures groupées.
 */
export async function syncUserFromCla(
  payload: ClaAuthPayload,
): Promise<SessionUser> {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.upsert({
      where: { username: payload.username },
      update: {
        firstname: payload.firstName,
        lastname: payload.lastName,
        isAdmin: payload.isAdmin,
        group: payload.cursus ?? null,
      },
      create: {
        username: payload.username,
        firstname: payload.firstName,
        lastname: payload.lastName,
        isAdmin: payload.isAdmin,
        group: payload.cursus ?? null,
        createdAt: new Date(),
      },
    });

    const ssoSlugs = [
      ...new Set(
        payload.associationRoles.map((entry) => entry.associationSlug),
      ),
    ];
    const ssoAssos = await tx.asso.findMany({
      where: { slug: { in: ssoSlugs } },
      select: syncAssoSelect,
    });
    const memberships = await tx.refAssoUser.findMany({
      where: { userId: user.id },
      select: { id: true, role: true, asso: { select: syncAssoSelect } },
    });

    const existingAssos = new Map(ssoAssos.map((asso) => [asso.slug, asso]));
    for (const { asso } of memberships) existingAssos.set(asso.slug, asso);

    const plan = planClaSync(
      {
        assos: [...existingAssos.values()],
        roles: memberships.map((membership) => ({
          id: membership.id,
          username: user.username,
          assoSlug: membership.asso.slug,
          role: membership.role,
        })),
      },
      { username: user.username, associationRoles: payload.associationRoles },
      "user",
    );

    const now = new Date();
    if (plan.assosToCreate.length > 0) {
      await tx.asso.createMany({
        data: plan.assosToCreate.map((asso) => ({ ...asso, createdAt: now })),
        skipDuplicates: true,
      });
    }
    for (const { id, ...data } of plan.assosToUpdate) {
      await tx.asso.update({ where: { id }, data });
    }

    const assoIdBySlug = new Map(
      [...existingAssos.values()].map((asso) => [asso.slug, asso.id]),
    );
    if (plan.assosToCreate.length > 0) {
      const created = await tx.asso.findMany({
        where: { slug: { in: plan.assosToCreate.map((asso) => asso.slug) } },
        select: { id: true, slug: true },
      });
      for (const asso of created) assoIdBySlug.set(asso.slug, asso.id);
    }

    if (plan.roleIdsToDelete.length > 0) {
      await tx.refAssoUser.deleteMany({
        where: { id: { in: plan.roleIdsToDelete } },
      });
    }
    for (const [role, ids] of groupIdsByRole(plan.rolesToUpdate)) {
      await tx.refAssoUser.updateMany({
        where: { id: { in: ids } },
        data: { role, createdAt: now },
      });
    }
    if (plan.rolesToCreate.length > 0) {
      await tx.refAssoUser.createMany({
        data: plan.rolesToCreate.map(({ assoSlug, role }) => ({
          userId: user.id,
          assoId: requireAssoId(assoIdBySlug, assoSlug),
          role,
          createdAt: now,
        })),
      });
    }

    const structures: SessionStructure[] = plan.userRoles.map(
      ({ assoSlug, assoName, role }) => ({
        assoId: requireAssoId(assoIdBySlug, assoSlug),
        slug: assoSlug,
        name: assoName,
        role,
      }),
    );

    return {
      id: user.id,
      username: user.username,
      firstname: user.firstname,
      lastname: user.lastname,
      isAdmin: user.isAdmin,
      structures,
    };
  });
}
