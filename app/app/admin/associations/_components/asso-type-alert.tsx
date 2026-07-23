import { TriangleAlert } from "lucide-react";
import type { AssoType } from "@/app/generated/prisma/enums";

export function AssoTypeAlert({ type }: { type: AssoType | null }) {
  if (type !== null) {
    return null;
  }

  return (
    <span className="badge badge-error badge-soft gap-1 whitespace-nowrap">
      <TriangleAlert size={12} />
      Type à définir
    </span>
  );
}
