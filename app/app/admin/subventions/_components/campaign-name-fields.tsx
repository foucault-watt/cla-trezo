import type { SubventionType } from "@/app/generated/prisma/enums";
import { subventionTypeOptions } from "@/lib/subventions/labels";

/**
 * Le Type de campagne est toujours la première partie du nom affiché (ex :
 * "CA Budget 2026") : ce composant présente les deux comme un seul champ
 * visuel, même si `type` et `name` restent deux colonnes distinctes en base.
 */
export function CampaignNameFields({
  defaultType,
  defaultName,
}: {
  defaultType?: SubventionType;
  defaultName?: string;
}) {
  return (
    <fieldset className="fieldset">
      <legend className="fieldset-legend">Nom de la campagne</legend>
      <div className="flex gap-2">
        <select
          name="type"
          className="select w-40 shrink-0"
          defaultValue={defaultType ?? ""}
          required
        >
          <option value="" disabled>
            Type
          </option>
          {subventionTypeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <input
          type="text"
          name="name"
          className="input flex-1"
          placeholder="2026"
          defaultValue={defaultName}
          required
        />
      </div>
    </fieldset>
  );
}
