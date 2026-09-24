import { Download } from "lucide-react";
import type { StructureGrantDocument } from "@/lib/subventions/grant-documents";

const kindLabel = {
  CONVENTION: "Convention de subvention",
  ORDRE_DE_FINANCEMENT: "Ordre de financement",
} as const;

const generatedAtFormatter = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "long",
  timeZone: "Europe/Paris",
});

export function GrantDocumentsList({
  assoSlug,
  documents,
}: {
  assoSlug: string;
  documents: StructureGrantDocument[];
}) {
  return (
    <section>
      <h2 className="text-lg font-semibold">Documents d’octroi</h2>
      <p className="mt-1 text-sm text-base-content/70">
        Convention de subvention ou Ordre de financement émis par CLA pour
        chaque campagne. La dernière version générée fait foi.
      </p>

      {documents.length === 0 ? (
        <p className="mt-4 rounded-box border border-dashed border-base-300 bg-base-100 px-5 py-8 text-center text-sm text-base-content/60">
          Aucun document d’octroi pour le moment.
        </p>
      ) : (
        <ul className="list mt-4 rounded-box border border-base-300 bg-base-100">
          {documents.map((document) => (
            <li className="list-row items-center" key={document.id}>
              <div className="list-col-grow min-w-0">
                <p className="font-medium">{document.campaignName}</p>
                <p className="text-xs text-base-content/60">
                  {kindLabel[document.kind]} · généré le{" "}
                  {generatedAtFormatter.format(document.generatedAt)}
                </p>
              </div>
              <a
                href={`/app/${assoSlug}/subventions/octroi/${document.id}`}
                className="btn btn-sm"
              >
                <Download size={16} />
                Télécharger
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
