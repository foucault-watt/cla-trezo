import { structureFileRoute } from "@/lib/storage/stored-file-route";
import { findGrantDocumentForAsso } from "@/lib/subventions/grant-documents";

/** Sert un Document d'octroi (ADR-0007) à sa Structure bénéficiaire (cf. structureFileRoute). */
export const GET = structureFileRoute<{ assoSlug: string; documentId: string }>(
  async ({ params, structure }) => {
    const document = await findGrantDocumentForAsso(
      params.documentId,
      structure.assoId,
    );
    if (!document) {
      return null;
    }

    return {
      filePath: document.filePath,
      mimeType: "application/pdf",
      filename: document.filename,
      disposition: "attachment",
    };
  },
);
