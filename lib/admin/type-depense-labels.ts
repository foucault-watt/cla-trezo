/**
 * Clé de comparaison d'un libellé de Type de dépense : insensible à la
 * casse, aux accents et aux espaces superflus, pour que « materiel » et
 * « Matériel » ne coexistent jamais comme deux Types distincts.
 */
export function typeDepenseLabelKey(label: string): string {
  return label
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export type TypeDepenseRef = { id: string; label: string };

/** Type de dépense existant dont le libellé équivaut à `label`, s'il y en a un. */
export function findTypeDepenseByLabel<T extends TypeDepenseRef>(
  types: T[],
  label: string,
  excludeId?: string,
): T | undefined {
  const key = typeDepenseLabelKey(label);
  return types.find(
    (type) => type.id !== excludeId && typeDepenseLabelKey(type.label) === key,
  );
}

export type CustomLabelLine = {
  customLabel: string;
  expenseReportId: string;
  assoName: string;
};

export type CustomLabelUsage = {
  label: string;
  reimbursementCount: number;
  expenseReportCount: number;
  assoNames: string[];
  /** Type de dépense existant au libellé équivalent, à proposer en priorité. */
  matchingType: TypeDepenseRef | null;
};

/**
 * Regroupe les Remboursements saisis avec un libellé personnalisé par
 * libellé exact : deux orthographes différentes restent deux lignes, à
 * l'Admin de les fusionner en renommant l'une vers l'autre.
 */
export function groupCustomLabels(
  lines: CustomLabelLine[],
  types: TypeDepenseRef[],
): CustomLabelUsage[] {
  const byLabel = new Map<
    string,
    { count: number; reportIds: Set<string>; assoNames: Set<string> }
  >();

  for (const line of lines) {
    const group = byLabel.get(line.customLabel) ?? {
      count: 0,
      reportIds: new Set<string>(),
      assoNames: new Set<string>(),
    };
    group.count += 1;
    group.reportIds.add(line.expenseReportId);
    group.assoNames.add(line.assoName);
    byLabel.set(line.customLabel, group);
  }

  return [...byLabel.entries()]
    .map(([label, group]) => {
      const matchingType = findTypeDepenseByLabel(types, label);
      return {
        label,
        reimbursementCount: group.count,
        expenseReportCount: group.reportIds.size,
        assoNames: [...group.assoNames].sort((a, b) => a.localeCompare(b, "fr")),
        matchingType: matchingType
          ? { id: matchingType.id, label: matchingType.label }
          : null,
      };
    })
    .sort(
      (a, b) =>
        b.reimbursementCount - a.reimbursementCount ||
        a.label.localeCompare(b.label, "fr"),
    );
}
