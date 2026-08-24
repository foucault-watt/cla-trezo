import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { getSession } from "@/lib/session";
import { FinancementDocument } from "@/pdf-lab/templates/financement/document";
import { financementPdfDataSchema } from "@/pdf-lab/templates/financement/schema";

export const runtime = "nodejs";

export async function POST(request: Request) {
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Le contenu envoyé n’est pas un JSON valide." },
      { status: 400 },
    );
  }

  const parsed = financementPdfDataSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      {
        error:
          parsed.error.issues[0]?.message ??
          "Les données du PDF sont invalides.",
      },
      { status: 400 },
    );
  }

  try {
    const document = React.createElement(FinancementDocument, {
      data: parsed.data,
    }) as unknown as Parameters<typeof renderToBuffer>[0];
    const pdf = await renderToBuffer(document);
    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition":
          'attachment; filename="ordre-de-financement.pdf"',
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("Financement PDF generation failed", error);
    return Response.json(
      { error: "La génération du PDF a échoué." },
      { status: 500 },
    );
  }
}
