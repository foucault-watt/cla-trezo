import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { getSession } from "@/lib/session";
import { ExpenseReportDocument } from "@/pdf-lab/templates/ndf-fn-sb/document";
import { expenseReportPdfDataSchema } from "@/pdf-lab/templates/ndf-fn-sb/schema";

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

  const parsed = expenseReportPdfDataSchema.safeParse(body);
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
    const document = React.createElement(ExpenseReportDocument, {
      data: parsed.data,
    }) as unknown as Parameters<typeof renderToBuffer>[0];
    const pdf = await renderToBuffer(document);
    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="note-de-frais-fn-sb.pdf"',
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("PDF generation failed", error);
    return Response.json(
      { error: "La génération du PDF a échoué." },
      { status: 500 },
    );
  }
}
