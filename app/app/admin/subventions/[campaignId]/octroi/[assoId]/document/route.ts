import { prisma } from "@/lib/prisma";
import { adminFileRoute } from "@/lib/storage/stored-file-route";
import { buildGrantDocumentFilename } from "@/lib/subventions/grant-documents";

/** Sert le Document d'octroi stocké d'une Structure pour une Campagne, à l'Admin (cf. adminFileRoute). */
export const GET = adminFileRoute<{ campaignId: string; assoId: string }>(
  async ({ params }) => {
    const document = await prisma.grantDocument.findUnique({
      where: {
        campaignId_assoId: {
          campaignId: params.campaignId,
          assoId: params.assoId,
        },
      },
      select: {
        kind: true,
        filePath: true,
        asso: { select: { name: true } },
        campaign: { select: { name: true } },
      },
    });
    if (!document) {
      return null;
    }

    return {
      filePath: document.filePath,
      mimeType: "application/pdf",
      filename: buildGrantDocumentFilename({
        kind: document.kind,
        campaignName: document.campaign.name,
        assoName: document.asso.name,
      }),
      disposition: "attachment",
    };
  },
);
