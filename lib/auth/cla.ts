import { z } from "zod";
import { prisma } from "@/lib/prisma";
import type { SessionStructure, SessionUser } from "@/lib/session";
import type { AssoModel } from "@/app/generated/prisma/models/Asso";

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

/**
 * Crée ou met à jour l'utilisateur et synchronise ses rôles de Structure
 * avec ceux renvoyés par CLA. Une Structure inconnue en base est créée à la
 * volée (Type et Status par défaut, à corriger ensuite par un Admin). Un
 * rôle qui n'est plus renvoyé (départ, changement) n'est pas supprimé : la
 * ligne ref_asso_user est conservée pour l'historique, avec isActive à
 * false.
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

    const currentRoles: { role: string; asso: AssoModel }[] = [];
    for (const entry of payload.associationRoles) {
      const asso = await tx.asso.upsert({
        where: { slug: entry.associationSlug },
        update: { name: entry.associationName },
        create: {
          slug: entry.associationSlug,
          name: entry.associationName,
          // type volontairement absent : CLA SSO ne dit pas si c'est un
          // Club, une Commission ou une Association loi 1901, un Admin doit
          // le classifier (cf. lib/admin/asso-type.ts).
          status: "ACTIVE",
          createdAt: new Date(),
        },
      });
      currentRoles.push({ role: entry.role, asso });
    }

    await tx.refAssoUser.updateMany({
      where: {
        userId: user.id,
        isActive: true,
        assoId: { notIn: currentRoles.map(({ asso }) => asso.id) },
      },
      data: { isActive: false, endedAt: new Date() },
    });

    for (const { role, asso } of currentRoles) {
      const active = await tx.refAssoUser.findFirst({
        where: { userId: user.id, assoId: asso.id, isActive: true },
      });

      if (!active) {
        await tx.refAssoUser.create({
          data: { userId: user.id, assoId: asso.id, role },
        });
      } else if (active.role !== role) {
        await tx.refAssoUser.update({
          where: { id: active.id },
          data: { isActive: false, endedAt: new Date() },
        });
        await tx.refAssoUser.create({
          data: { userId: user.id, assoId: asso.id, role },
        });
      }
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
