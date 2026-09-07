import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import {
  getConventionPreparation,
  formatConventionDate,
} from "@/lib/admin/subsidy-convention";
import { getSession } from "@/lib/session";
import { SubsidyConventionDocument } from "@/pdf-lab/templates/convention/document";
import { subsidyConventionPdfDataSchema } from "@/pdf-lab/templates/convention/schema";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ campaignId: string; assoId: string }> },
) {
  const session = await getSession();
  if (!session.user) {
    return Response.json(
      { error: "Authentification requise." },
      { status: 401 },
    );
  }
  if (!session.user.isAdmin) {
    return Response.json({ error: "Ressource introuvable." }, { status: 404 });
  }

  const { campaignId, assoId } = await params;
  const preparation = await getConventionPreparation(campaignId, assoId);
  if (!preparation) {
    return Response.json({ error: "Convention introuvable." }, { status: 404 });
  }
  if (!preparation.publicationDate) {
    return Response.json(
      {
        error: "La campagne doit être publiée avant de générer la convention.",
      },
      { status: 400 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Le contenu envoyé n'est pas un JSON valide." },
      { status: 400 },
    );
  }

  const signatureDate = formatConventionDate(new Date());
  const submitted =
    body && typeof body === "object" && !Array.isArray(body)
      ? (body as Record<string, unknown>)
      : {};
  const parsed = subsidyConventionPdfDataSchema.safeParse({
    ...submitted,
    firstPartySignature: {
      ...(submitted.firstPartySignature as Record<string, unknown> | undefined),
      date: signatureDate,
    },
    secondPartySignature: {
      ...(submitted.secondPartySignature as
        Record<string, unknown> | undefined),
      date: signatureDate,
    },
  });
  if (!parsed.success) {
    return Response.json(
      {
        error:
          parsed.error.issues[0]?.message ??
          "Les données de la convention sont invalides.",
      },
      { status: 400 },
    );
  }

  try {
    const document = React.createElement(SubsidyConventionDocument, {
      data: parsed.data,
    }) as unknown as Parameters<typeof renderToBuffer>[0];
    const pdf = await renderToBuffer(document);
    const assoSlug = preparation.assoName
      .normalize("NFD")
      .replace(/\p{Mn}/gu, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase();
    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="convention-de-subvention-${assoSlug || "structure"}.pdf"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("Subsidy convention PDF generation failed", error);
    return Response.json(
      { error: "La génération de la convention a échoué." },
      { status: 500 },
    );
  }
}
