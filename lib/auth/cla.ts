import { z } from "zod";
import { prisma } from "@/lib/prisma";
import type { SessionStructure, SessionUser } from "@/lib/session";
import type { AssoModel } from "@/app/generated/prisma/models/Asso";

const claAuthHost = process.env.CLA_AUTH_HOST;
const claAuthIdentifier = process.env.CLA_AUTH_IDENTIFIER;

export class ClaAuthError extends Error {}

const claAssociationRoleSchema = z.object({
  associationSlug: z.string().min(1),
  associationName: z.string().min(1),
  role: z.string().min(1),
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

/**
 * Crée ou met à jour l'utilisateur et remplace intégralement ses rôles de
 * Structure par ceux renvoyés par CLA : un rôle qui n'est plus renvoyé
 * (départ, changement) est supprimé plutôt que laissé en base.
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

    const slugs = payload.associationRoles.map((r) => r.associationSlug);
    const knownAssos = slugs.length
      ? await tx.asso.findMany({ where: { slug: { in: slugs } } })
      : [];
    const assoBySlug = new Map(knownAssos.map((asso) => [asso.slug, asso]));

    const currentRoles = payload.associationRoles.reduce<
      { role: string; asso: AssoModel }[]
    >((acc, entry) => {
      const asso = assoBySlug.get(entry.associationSlug);
      if (!asso) {
        console.warn(
          `[CLA] Structure inconnue ignorée lors de la synchro des rôles : ${entry.associationSlug}`,
        );
        return acc;
      }
      acc.push({ role: entry.role, asso });
      return acc;
    }, []);

    await tx.refAssoUser.deleteMany({
      where: {
        userId: user.id,
        assoId: { notIn: currentRoles.map(({ asso }) => asso.id) },
      },
    });

    for (const { role, asso } of currentRoles) {
      await tx.refAssoUser.upsert({
        where: { userId_assoId: { userId: user.id, assoId: asso.id } },
        update: { role },
        create: { userId: user.id, assoId: asso.id, role },
      });
    }

    const structures: SessionStructure[] = currentRoles.map(
      ({ role, asso }) => ({
        assoId: asso.id,
        slug: asso.slug,
        name: asso.name,
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
