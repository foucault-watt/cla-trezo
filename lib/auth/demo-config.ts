// Constantes pures (pas de dépendance à Prisma) pour que proxy.ts puisse les
// utiliser sans tirer de connexion base dans le proxy, cf. lib/auth/dev-config.ts.

export const DEMO_ASSO_SLUG = "club-demo";
export const DEMO_USER_USERNAME = "demo-tresorier";
export const DEMO_ADMIN_USERNAME = "demo-admin";

// Id fixe pour que la Campagne de subvention démo reste la même ligne d'un
// reset à l'autre (SubventionCampaign n'a pas d'autre champ unique).
export const DEMO_CAMPAIGN_ID = "10000000-0000-4000-8000-000000000001";

// À merger dans le `where` de tout listing Admin portant directement sur
// Asso, pour ne jamais faire apparaître l'Asso démo aux vrais Admin CLA.
export const EXCLUDE_DEMO_ASSO = { isDemo: false } as const;

// Même exclusion, pour un listing qui porte sur un modèle relié à Asso par
// une relation `asso` (Subvention, FinancialMovement, ExpenseReport...).
export const EXCLUDE_DEMO_ASSO_RELATION = { asso: EXCLUDE_DEMO_ASSO } as const;

// SubventionCampaign n'a pas de relation directe vers Asso (elle regroupe des
// Subventions de plusieurs Structures) : on exclut la Campagne démo par son
// id fixe plutôt que par une relation imbriquée.
export const EXCLUDE_DEMO_CAMPAIGN = { id: { not: DEMO_CAMPAIGN_ID } } as const;
