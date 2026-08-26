"use client";

import { useActionState, useEffect } from "react";
import { Building2, Landmark, Scale } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import {
  setAssoTypeAction,
  type SetAssoTypeState,
} from "@/lib/admin/asso-type";
import { assoTypeOptions } from "@/lib/admin/asso-labels";
import type { AssoType } from "@/app/generated/prisma/enums";

const initialState: SetAssoTypeState = { ok: false };

const icons: Record<AssoType, typeof Building2> = {
  CLUB: Building2,
  COMMISSION: Landmark,
  ASSOCIATION_1901: Scale,
};

function AssoTypeCard({
  assoId,
  assoSlug,
  value,
  label,
  description,
  current,
}: {
  assoId: string;
  assoSlug: string;
  value: AssoType;
  label: string;
  description: string;
  current: AssoType | null;
}) {
  const { push: pushToast } = useToast();
  const [state, formAction, pending] = useActionState(
    setAssoTypeAction,
    initialState,
  );
  const Icon = icons[value];
  const isCurrent = current === value;

  useEffect(() => {
    if (!state.ok && state.error) {
      pushToast({ type: "error", message: state.error });
    }
  }, [state, pushToast]);

  return (
    <div
      className={`card border bg-base-100 shadow-md ${isCurrent ? "border-primary" : "border-base-300"}`}
    >
      <div className="card-body">
        <div className="flex items-center gap-2">
          <Icon size={20} className="text-primary" />
          <h3 className="card-title text-base">{label}</h3>
        </div>
        <p className="text-sm whitespace-pre-line text-base-content/70">
          {description}
        </p>

        <form action={formAction} className="card-actions justify-end">
          <input type="hidden" name="assoId" value={assoId} />
          <input type="hidden" name="assoSlug" value={assoSlug} />
          <input type="hidden" name="type" value={value} />
          <button
            type="submit"
            className={`btn btn-sm ${isCurrent ? "btn-primary" : "btn-outline"}`}
            disabled={pending || isCurrent}
          >
            {isCurrent ? "Type actuel" : pending ? "…" : "Choisir ce type"}
          </button>
        </form>
      </div>
    </div>
  );
}

export function AssoTypePicker({
  assoId,
  assoSlug,
  current,
}: {
  assoId: string;
  assoSlug: string;
  current: AssoType | null;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {assoTypeOptions.map((option) => (
        <AssoTypeCard
          key={option.value}
          assoId={assoId}
          assoSlug={assoSlug}
          value={option.value}
          label={option.label}
          description={option.description}
          current={current}
        />
      ))}
    </div>
  );
}
