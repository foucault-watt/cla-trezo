"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileCheck } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { generateGrantDocumentAction } from "@/lib/admin/generate-grant-document-action";

export function GenerateGrantDocumentButton({
  campaignId,
  assoId,
  data,
  label,
  validationError,
}: {
  campaignId: string;
  assoId: string;
  data: unknown;
  label: string;
  validationError: () => string | null;
}) {
  const [pending, setPending] = useState(false);
  const { push: pushToast } = useToast();
  const router = useRouter();

  async function generate() {
    const invalid = validationError();
    if (invalid) {
      pushToast({ type: "error", message: invalid });
      return;
    }

    setPending(true);
    try {
      const result = await generateGrantDocumentAction(
        campaignId,
        assoId,
        data,
      );
      if (!result.ok) {
        pushToast({ type: "error", message: result.error });
        return;
      }
      const toastParams = new URLSearchParams({
        toast: "Document d'octroi généré.",
        toastType: "success",
      });
      router.push(`/app/admin/subventions/${campaignId}?${toastParams}`);
    } catch {
      pushToast({
        type: "error",
        message: "La génération du document a échoué.",
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex justify-end">
      <button
        type="button"
        className="btn btn-primary"
        disabled={pending}
        onClick={generate}
      >
        {pending ? (
          <span className="loading loading-spinner loading-sm" />
        ) : (
          <FileCheck size={18} />
        )}
        {pending ? "Génération…" : label}
      </button>
    </div>
  );
}
