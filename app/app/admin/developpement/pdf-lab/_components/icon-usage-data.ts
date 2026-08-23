export type IconUsage = {
  icon: string;
  visibleText: string | null;
  ariaLabel: string | null;
  file: string;
  context?: string;
};

export const iconUsages: IconUsage[] = [
  // app/app/admin/notes-de-frais/[reportId]/_components/admin-beneficiary-form.tsx
  {
    icon: "User",
    visibleText: null,
    ariaLabel: null,
    file: "app/app/admin/notes-de-frais/[reportId]/_components/admin-beneficiary-form.tsx",
    context: "à côté du nom d'un membre sélectionnable (bouton bénéficiaire)",
  },
  {
    icon: "UserPlus",
    visibleText: "Autre bénéficiaire",
    ariaLabel: null,
    file: "app/app/admin/notes-de-frais/[reportId]/_components/admin-beneficiary-form.tsx",
  },
  {
    icon: "CheckCircle2",
    visibleText: "Enregistré.",
    ariaLabel: null,
    file: "app/app/admin/notes-de-frais/[reportId]/_components/admin-beneficiary-form.tsx",
  },

  // app/app/[assoSlug]/notes-de-frais/[reportId]/remboursements/page.tsx
  {
    icon: "ArrowRight",
    visibleText: "Choisir le bénéficiaire",
    ariaLabel: null,
    file: "app/app/[assoSlug]/notes-de-frais/[reportId]/remboursements/page.tsx",
  },

  // app/app/[assoSlug]/notes-de-frais/[reportId]/_components/supporting-documents-panel.tsx
  {
    icon: "Trash2",
    visibleText: null,
    ariaLabel: "Supprimer ce Justificatif",
    file: "components/expense-reports/supporting-documents-panel.tsx",
    context: "bouton icône seul, sur chaque ligne de document",
  },
  {
    icon: "X",
    visibleText: "Annuler",
    ariaLabel: null,
    file: "components/expense-reports/supporting-documents-panel.tsx",
    context: "modale de suppression d'un justificatif",
  },
  {
    icon: "Trash2",
    visibleText: "Supprimer",
    ariaLabel: null,
    file: "components/expense-reports/supporting-documents-panel.tsx",
    context: "modale de suppression d'un justificatif, bouton de confirmation",
  },
  {
    icon: "FileText",
    visibleText: null,
    ariaLabel: null,
    file: "components/expense-reports/supporting-documents-panel.tsx",
    context: "icône générique à côté du nom d'un document non-image",
  },
  {
    icon: "UploadCloud",
    visibleText: null,
    ariaLabel: null,
    file: "components/expense-reports/supporting-documents-panel.tsx",
    context:
      "icône de la zone de dépôt de fichiers (drag & drop) ; le texte d'instructions est affiché à côté mais seulement quand aucun fichier n'est encore sélectionné",
  },
  {
    icon: "Receipt",
    visibleText: "Facture",
    ariaLabel: null,
    file: "components/expense-reports/supporting-documents-panel.tsx",
    context: "carte radio de choix du type de justificatif",
  },
  {
    icon: "ScrollText",
    visibleText: "Attestation sur l'honneur",
    ariaLabel: null,
    file: "components/expense-reports/supporting-documents-panel.tsx",
    context: "carte radio de choix du type de justificatif",
  },
  {
    icon: "ScrollText",
    visibleText: "Je n'ai pas de facture",
    ariaLabel: null,
    file: "components/expense-reports/supporting-documents-panel.tsx",
    context:
      "lien discret ouvrant la modale d'attestation sur l'honneur, cohérent avec le bouton de confirmation dans la modale",
  },
  {
    icon: "ScrollText",
    visibleText: "Je n'ai pas de facture",
    ariaLabel: null,
    file: "components/expense-reports/supporting-documents-panel.tsx",
    context:
      "bouton de confirmation dans la modale d'attestation, cohérent avec l'icône de la carte \"Attestation sur l'honneur\" plus haut dans ce fichier",
  },

  // app/app/[assoSlug]/notes-de-frais/[reportId]/recapitulatif/page.tsx
  {
    icon: "Pencil",
    visibleText: "Modifier",
    ariaLabel: null,
    file: "app/app/[assoSlug]/notes-de-frais/[reportId]/recapitulatif/page.tsx",
    context:
      "(×3 dans ce fichier : sections Bénéficiaire, Dépenses, Justificatifs)",
  },
  {
    icon: "HandCoins",
    visibleText: null,
    ariaLabel: null,
    file: "app/app/[assoSlug]/notes-de-frais/[reportId]/recapitulatif/page.tsx",
    context: "financement par subvention, dans le tableau des dépenses",
  },
  {
    icon: "Wallet",
    visibleText: null,
    ariaLabel: null,
    file: "app/app/[assoSlug]/notes-de-frais/[reportId]/recapitulatif/page.tsx",
    context: "financement par le solde du club (alternative à HandCoins), dans le tableau des dépenses",
  },
  {
    icon: "TriangleAlert",
    visibleText: null,
    ariaLabel: null,
    file: "app/app/[assoSlug]/notes-de-frais/[reportId]/recapitulatif/page.tsx",
    context: "en-tête d'une liste d'avertissements sur les dépenses",
  },
  {
    icon: "FileText",
    visibleText: null,
    ariaLabel: null,
    file: "app/app/[assoSlug]/notes-de-frais/[reportId]/recapitulatif/page.tsx",
    context: "à côté du nom d'un justificatif (lien de téléchargement)",
  },

  // app/app/[assoSlug]/notes-de-frais/[reportId]/_components/general-information-modal.tsx
  {
    icon: "Pencil",
    visibleText: "Modifier",
    ariaLabel: null,
    file: "components/expense-reports/general-information-modal.tsx",
  },

  // app/app/[assoSlug]/layout.tsx
  {
    icon: "LayoutDashboard",
    visibleText: "Dashboard",
    ariaLabel: null,
    file: "app/app/[assoSlug]/layout.tsx",
    context: "nav membre",
  },
  {
    icon: "Receipt",
    visibleText: "Notes de frais",
    ariaLabel: null,
    file: "app/app/[assoSlug]/layout.tsx",
    context: "nav membre",
  },
  {
    icon: "HandCoins",
    visibleText: "Subventions",
    ariaLabel: null,
    file: "app/app/[assoSlug]/layout.tsx",
    context: "nav membre",
  },
  {
    icon: "ArrowLeftRight",
    visibleText: "Changer d'association",
    ariaLabel: null,
    file: "app/app/[assoSlug]/layout.tsx",
    context: "pied de nav membre, ouvre le sélecteur d'association",
  },
  {
    icon: "ShieldUser",
    visibleText: "Vue admin",
    ariaLabel: null,
    file: "app/app/[assoSlug]/layout.tsx",
  },
  {
    icon: "LogOut",
    visibleText: null,
    ariaLabel: null,
    file: "app/app/[assoSlug]/layout.tsx",
    context:
      "icône construite ici et passée en prop à DemoLogoutButton ; le texte du bouton n'est pas visible dans ce fichier",
  },
  {
    icon: "Sparkles",
    visibleText: null,
    ariaLabel: null,
    file: "app/app/[assoSlug]/layout.tsx",
    context:
      "icône construite ici et passée en prop à DemoLoginButton ; le texte du bouton n'est pas visible dans ce fichier",
  },

  // components/demo/demo-mode-banner.tsx
  {
    icon: "Sparkles",
    visibleText: "Vous explorez Trézo avec des données fictives.",
    ariaLabel: null,
    file: "components/demo/demo-mode-banner.tsx",
  },

  // app/page.tsx
  {
    icon: "TrendingUp",
    visibleText: null,
    ariaLabel: null,
    file: "app/page.tsx",
    context: "à côté du montant du solde, dans la maquette illustrative de la landing page",
  },
  {
    icon: "Wallet",
    visibleText: "Solde en temps réel",
    ariaLabel: null,
    file: "app/page.tsx",
    context: "carte de mise en avant, landing page",
  },
  {
    icon: "HandCoins",
    visibleText: "Demandes de subvention",
    ariaLabel: null,
    file: "app/page.tsx",
    context: "carte de mise en avant, landing page",
  },
  {
    icon: "Receipt",
    visibleText: "Notes de frais",
    ariaLabel: null,
    file: "app/page.tsx",
    context: "carte de mise en avant, landing page",
  },

  // app/app/[assoSlug]/notes-de-frais/_components/expense-report-guide.tsx
  {
    icon: "Info",
    visibleText: "Comment fonctionne une Note de frais ?",
    ariaLabel: null,
    file: "app/app/[assoSlug]/notes-de-frais/_components/expense-report-guide.tsx",
    context: "titre du panneau repliable",
  },
  {
    icon: "ChevronDown",
    visibleText: null,
    ariaLabel: null,
    file: "app/app/[assoSlug]/notes-de-frais/_components/expense-report-guide.tsx",
    context: "connecteur décoratif entre étapes (version mobile)",
  },
  {
    icon: "ChevronRight",
    visibleText: null,
    ariaLabel: null,
    file: "app/app/[assoSlug]/notes-de-frais/_components/expense-report-guide.tsx",
    context: "connecteur décoratif entre étapes (version desktop)",
  },
  {
    icon: "Lock",
    visibleText: null,
    ariaLabel: null,
    file: "app/app/[assoSlug]/notes-de-frais/_components/expense-report-guide.tsx",
    context: "à côté de l'étape \"Soumettre\" en surbrillance",
  },

  // app/app/[assoSlug]/notes-de-frais/[reportId]/_components/reimbursements-table.tsx
  {
    icon: "TriangleAlert",
    visibleText: null,
    ariaLabel: null,
    file: "components/expense-reports/reimbursements-table.tsx",
    context: "badge de compte d'alertes sur une ligne (aria-label = liste des alertes)",
  },
  {
    icon: "Trash2",
    visibleText: null,
    ariaLabel: null,
    file: "components/expense-reports/reimbursements-table.tsx",
    context: "bouton icône seul sur une ligne, aria-label dynamique \"Supprimer {nom de la dépense}\"",
  },
  {
    icon: "X",
    visibleText: null,
    ariaLabel: "Annuler l'ajout",
    file: "components/expense-reports/reimbursements-table.tsx",
    context: "bouton icône seul, annule l'ajout d'une nouvelle ligne",
  },
  {
    icon: "CircleAlert",
    visibleText: null,
    ariaLabel: "Échec de l'enregistrement",
    file: "components/expense-reports/reimbursements-table.tsx",
    context: "icône de statut seule, fin de ligne",
  },
  {
    icon: "TriangleAlert",
    visibleText: null,
    ariaLabel: "Ligne à compléter",
    file: "components/expense-reports/reimbursements-table.tsx",
    context: "icône de statut seule, fin de ligne",
  },
  {
    icon: "CheckCircle2",
    visibleText: null,
    ariaLabel: "Ligne enregistrée",
    file: "components/expense-reports/reimbursements-table.tsx",
    context: "icône de statut seule, fin de ligne",
  },
  {
    icon: "Plus",
    visibleText: "Ajouter une dépense",
    ariaLabel: null,
    file: "components/expense-reports/reimbursements-table.tsx",
    context: "(×2 dans ce fichier : état vide et pied de tableau)",
  },
  {
    icon: "Trash2",
    visibleText: "Supprimer",
    ariaLabel: null,
    file: "components/expense-reports/reimbursements-table.tsx",
    context: "modale de suppression d'une dépense, bouton de confirmation",
  },
  {
    icon: "X",
    visibleText: "Annuler",
    ariaLabel: null,
    file: "components/expense-reports/reimbursements-table.tsx",
    context: "modale de suppression d'une dépense",
  },
  {
    icon: "TriangleAlert",
    visibleText: "dépense(s) comportent une alerte. Cela ne bloque pas la soumission.",
    ariaLabel: null,
    file: "components/expense-reports/reimbursements-table.tsx",
    context: "bandeau de synthèse en pied de tableau",
  },

  // app/app/[assoSlug]/subventions/_components/subventions-ledger.tsx
  {
    icon: "CalendarDays",
    visibleText: null,
    ariaLabel: null,
    file: "app/app/[assoSlug]/subventions/_components/subventions-ledger.tsx",
    context: "aria-hidden, à côté de la date de publication d'une campagne",
  },
  {
    icon: "TriangleAlert",
    visibleText: "Subventions anciennes",
    ariaLabel: null,
    file: "app/app/[assoSlug]/subventions/_components/subventions-ledger.tsx",
    context: "aria-hidden, en-tête de section",
  },
  {
    icon: "CircleCheck",
    visibleText: "Moins de 365 jours",
    ariaLabel: null,
    file: "app/app/[assoSlug]/subventions/_components/subventions-ledger.tsx",
    context: "aria-hidden, panneau \"Règle d'usage\"",
  },
  {
    icon: "Clock3",
    visibleText: "Entre 1 et 2 ans",
    ariaLabel: null,
    file: "app/app/[assoSlug]/subventions/_components/subventions-ledger.tsx",
    context: "aria-hidden, panneau \"Règle d'usage\"",
  },
  {
    icon: "Archive",
    visibleText: "Plus de 2 ans",
    ariaLabel: null,
    file: "app/app/[assoSlug]/subventions/_components/subventions-ledger.tsx",
    context: "aria-hidden, panneau \"Règle d'usage\"",
  },
  {
    icon: "History",
    visibleText: "Historique",
    ariaLabel: null,
    file: "app/app/[assoSlug]/subventions/_components/subventions-ledger.tsx",
    context: "aria-hidden, en-tête de section",
  },
  {
    icon: "Info",
    visibleText: "À ne plus utiliser pour une nouvelle dépense.",
    ariaLabel: null,
    file: "app/app/[assoSlug]/subventions/_components/subventions-ledger.tsx",
    context: "aria-hidden, note dans la section Historique",
  },

  // app/app/[assoSlug]/notes-de-frais/[reportId]/_components/delete-expense-report-button.tsx
  {
    icon: "Trash2",
    visibleText: "Supprimer",
    ariaLabel: null,
    file: "app/app/[assoSlug]/notes-de-frais/[reportId]/_components/delete-expense-report-button.tsx",
    context: "bouton d'ouverture de la modale",
  },
  {
    icon: "X",
    visibleText: "Annuler",
    ariaLabel: null,
    file: "app/app/[assoSlug]/notes-de-frais/[reportId]/_components/delete-expense-report-button.tsx",
    context: "modale de confirmation",
  },
  {
    icon: "Trash2",
    visibleText: "Supprimer définitivement",
    ariaLabel: null,
    file: "app/app/[assoSlug]/notes-de-frais/[reportId]/_components/delete-expense-report-button.tsx",
    context: "modale de confirmation, bouton final",
  },

  // app/app/[assoSlug]/notes-de-frais/[reportId]/_components/submit-expense-report-form.tsx
  {
    icon: "CheckCircle2",
    visibleText: "La Note de frais a bien été soumise à l'Admin CLA.",
    ariaLabel: null,
    file: "app/app/[assoSlug]/notes-de-frais/[reportId]/_components/submit-expense-report-form.tsx",
    context: "bandeau de statut après succès",
  },
  {
    icon: "Send",
    visibleText: "Soumettre la Note de frais",
    ariaLabel: null,
    file: "app/app/[assoSlug]/notes-de-frais/[reportId]/_components/submit-expense-report-form.tsx",
  },
  {
    icon: "TriangleAlert",
    visibleText: "alerte(s) non bloquante(s)",
    ariaLabel: null,
    file: "app/app/[assoSlug]/notes-de-frais/[reportId]/_components/submit-expense-report-form.tsx",
    context: "modale de confirmation de soumission",
  },

  // app/app/[assoSlug]/notes-de-frais/[reportId]/_components/beneficiary-form.tsx
  {
    icon: "ArrowLeft",
    visibleText: "Retour aux dépenses",
    ariaLabel: null,
    file: "app/app/[assoSlug]/notes-de-frais/[reportId]/_components/beneficiary-form.tsx",
  },
  {
    icon: "CheckCircle2",
    visibleText: "Enregistré automatiquement",
    ariaLabel: null,
    file: "app/app/[assoSlug]/notes-de-frais/[reportId]/_components/beneficiary-form.tsx",
  },
  {
    icon: "Send",
    visibleText: "Soumettre la Note de frais",
    ariaLabel: null,
    file: "app/app/[assoSlug]/notes-de-frais/[reportId]/_components/beneficiary-form.tsx",
    context: "cohérent avec submit-expense-report-form.tsx",
  },
  {
    icon: "User",
    visibleText: null,
    ariaLabel: null,
    file: "app/app/[assoSlug]/notes-de-frais/[reportId]/_components/beneficiary-form.tsx",
    context:
      "à côté du nom d'un membre sélectionnable — cohérent avec admin-beneficiary-form.tsx",
  },
  {
    icon: "UserPlus",
    visibleText: "Autre bénéficiaire",
    ariaLabel: null,
    file: "app/app/[assoSlug]/notes-de-frais/[reportId]/_components/beneficiary-form.tsx",
    context: "cohérent avec admin-beneficiary-form.tsx",
  },
  {
    icon: "CheckCircle2",
    visibleText: "dépense(s) renseignée(s)",
    ariaLabel: null,
    file: "app/app/[assoSlug]/notes-de-frais/[reportId]/_components/beneficiary-form.tsx",
    context: "liste de complétude",
  },
  {
    icon: "CheckCircle2",
    visibleText: "justificatif(s) ajouté(s)",
    ariaLabel: null,
    file: "app/app/[assoSlug]/notes-de-frais/[reportId]/_components/beneficiary-form.tsx",
    context: "liste de complétude",
  },
  {
    icon: "CheckCircle2",
    visibleText: "IBAN enregistré pour {bénéficiaire} / Bénéficiaire et IBAN à compléter",
    ariaLabel: null,
    file: "app/app/[assoSlug]/notes-de-frais/[reportId]/_components/beneficiary-form.tsx",
    context: "liste de complétude, texte conditionnel",
  },
  {
    icon: "CheckCircle2",
    visibleText:
      "Cette Note de frais a été soumise. Vous pouvez encore la modifier tant que l'Admin CLA ne l'a pas prise en charge.",
    ariaLabel: null,
    file: "app/app/[assoSlug]/notes-de-frais/[reportId]/_components/beneficiary-form.tsx",
  },

  // app/app/[assoSlug]/notes-de-frais/[reportId]/_components/expense-report-stepper.tsx
  {
    icon: "Check",
    visibleText: null,
    ariaLabel: null,
    file: "app/app/[assoSlug]/notes-de-frais/[reportId]/_components/expense-report-stepper.tsx",
    context: "remplace le numéro d'étape une fois celle-ci complétée",
  },

  // components/theme/theme-toggle.tsx
  {
    icon: "Sun",
    visibleText: null,
    ariaLabel: "Passer au thème clair",
    file: "components/theme/theme-toggle.tsx",
    context: "bouton icône seul, aria-label ET title identiques",
  },
  {
    icon: "Moon",
    visibleText: null,
    ariaLabel: "Passer au thème sombre",
    file: "components/theme/theme-toggle.tsx",
    context: "bouton icône seul, aria-label ET title identiques",
  },

  // components/nav/view-toggle.tsx
  {
    icon: "List",
    visibleText: "Liste",
    ariaLabel: null,
    file: "components/nav/view-toggle.tsx",
  },
  {
    icon: "LayoutGrid",
    visibleText: "Grille",
    ariaLabel: null,
    file: "components/nav/view-toggle.tsx",
  },

  // components/nav/sidebar-drawer.tsx
  {
    icon: "Menu",
    visibleText: null,
    ariaLabel: "Ouvrir le menu",
    file: "components/nav/sidebar-drawer.tsx",
    context: "bouton hamburger, symétrique du \"Fermer le menu\" sur l'overlay",
  },

  // components/nav/back-to-app-link.tsx
  {
    icon: "ArrowLeftRight",
    visibleText: "Retour à l'application",
    ariaLabel: null,
    file: "components/nav/back-to-app-link.tsx",
    context: "pied de nav admin, repasse en mode membre",
  },

  // components/auth/logout-button.tsx
  {
    icon: "LogOut",
    visibleText: "Déconnexion",
    ariaLabel: null,
    file: "components/auth/logout-button.tsx",
  },

  // app/not-found.tsx
  {
    icon: "Compass",
    visibleText: null,
    ariaLabel: null,
    file: "app/not-found.tsx",
    context: "icône illustrative dans un cercle, page 404",
  },

  // app/mentions-legales/page.tsx
  {
    icon: "Building2",
    visibleText: "Éditeur",
    ariaLabel: null,
    file: "app/mentions-legales/page.tsx",
    context: "(×2 dans ce fichier : badge de navigation + titre de section)",
  },
  {
    icon: "Code2",
    visibleText: "Développement",
    ariaLabel: null,
    file: "app/mentions-legales/page.tsx",
    context: "(×2 dans ce fichier : badge de navigation + titre de section)",
  },
  {
    icon: "Server",
    visibleText: "Hébergement",
    ariaLabel: null,
    file: "app/mentions-legales/page.tsx",
    context: "(×2 dans ce fichier : badge de navigation + titre de section)",
  },
  {
    icon: "ShieldCheck",
    visibleText: "Données personnelles",
    ariaLabel: null,
    file: "app/mentions-legales/page.tsx",
    context: "(×2 dans ce fichier : badge de navigation + titre de section)",
  },
  {
    icon: "Cookie",
    visibleText: "Cookies",
    ariaLabel: null,
    file: "app/mentions-legales/page.tsx",
    context: "(×2 dans ce fichier : badge de navigation + titre de section)",
  },

  // app/app/page.tsx
  {
    icon: "Building2",
    visibleText: null,
    ariaLabel: null,
    file: "app/app/page.tsx",
    context: "dans une carte de sélection de structure, à côté du nom de la structure",
  },

  // app/app/admin/subventions/[campaignId]/page.tsx
  {
    icon: "FileDown",
    visibleText: null,
    ariaLabel: null,
    file: "app/app/admin/subventions/[campaignId]/page.tsx",
    context: "à côté du nom d'une association, liste des conventions à préparer",
  },

  // app/app/admin/subventions/[campaignId]/conventions/[assoId]/_components/convention-preparation-form.tsx
  {
    icon: "Plus",
    visibleText: "Ajouter un représentant",
    ariaLabel: null,
    file: "app/app/admin/subventions/[campaignId]/conventions/[assoId]/_components/convention-preparation-form.tsx",
  },
  {
    icon: "Trash2",
    visibleText: null,
    ariaLabel: null,
    file: "app/app/admin/subventions/[campaignId]/conventions/[assoId]/_components/convention-preparation-form.tsx",
    context: "aria-label dynamique \"Supprimer le représentant {n}\"",
  },
  {
    icon: "Download",
    visibleText: "Télécharger la convention",
    ariaLabel: null,
    file: "app/app/admin/subventions/[campaignId]/conventions/[assoId]/_components/convention-preparation-form.tsx",
  },

  // app/app/admin/subventions/[campaignId]/_components/subvention-row.tsx
  {
    icon: "Pencil",
    visibleText: null,
    ariaLabel: "Modifier la Subvention",
    file: "app/app/admin/subventions/[campaignId]/_components/subvention-row.tsx",
    context:
      "bouton icône seul qui bascule vers l'icône X en mode édition, mais garde le même aria-label \"Modifier la Subvention\"",
  },
  {
    icon: "Trash2",
    visibleText: null,
    ariaLabel: "Supprimer la Subvention",
    file: "app/app/admin/subventions/[campaignId]/_components/subvention-row.tsx",
  },
  {
    icon: "Check",
    visibleText: null,
    ariaLabel: "Enregistrer les modifications",
    file: "app/app/admin/subventions/[campaignId]/_components/subvention-row.tsx",
  },
  {
    icon: "X",
    visibleText: null,
    ariaLabel: "Annuler la modification",
    file: "app/app/admin/subventions/[campaignId]/_components/subvention-row.tsx",
  },

  // app/app/admin/subventions/[campaignId]/_components/new-subvention-row.tsx
  {
    icon: "Check",
    visibleText: null,
    ariaLabel: "Enregistrer la Subvention",
    file: "app/app/admin/subventions/[campaignId]/_components/new-subvention-row.tsx",
  },
  {
    icon: "X",
    visibleText: null,
    ariaLabel: "Annuler l'ajout",
    file: "app/app/admin/subventions/[campaignId]/_components/new-subvention-row.tsx",
    context: "cohérent avec reimbursements-table.tsx",
  },

  // app/app/admin/parametres-pdf/_components/convention-settings-form.tsx
  {
    icon: "Plus",
    visibleText: "Ajouter un représentant",
    ariaLabel: null,
    file: "app/app/admin/parametres-pdf/_components/convention-settings-form.tsx",
    context: "cohérent avec convention-preparation-form.tsx",
  },
  {
    icon: "Trash2",
    visibleText: null,
    ariaLabel: null,
    file: "app/app/admin/parametres-pdf/_components/convention-settings-form.tsx",
    context: "aria-label dynamique \"Supprimer le représentant {n}\"",
  },
  {
    icon: "Save",
    visibleText: "Enregistrer les paramètres",
    ariaLabel: null,
    file: "app/app/admin/parametres-pdf/_components/convention-settings-form.tsx",
  },

  // app/app/admin/layout.tsx
  {
    icon: "LayoutDashboard",
    visibleText: "Dashboard",
    ariaLabel: null,
    file: "app/app/admin/layout.tsx",
    context: "nav admin, cohérent avec le nav membre",
  },
  {
    icon: "Building2",
    visibleText: "Associations",
    ariaLabel: null,
    file: "app/app/admin/layout.tsx",
  },
  {
    icon: "Receipt",
    visibleText: "Notes de frais",
    ariaLabel: null,
    file: "app/app/admin/layout.tsx",
    context: "cohérent avec le nav membre",
  },
  {
    icon: "HandCoins",
    visibleText: "Subventions",
    ariaLabel: null,
    file: "app/app/admin/layout.tsx",
    context: "cohérent avec le nav membre",
  },
  {
    icon: "FileText",
    visibleText: "Rapports",
    ariaLabel: null,
    file: "app/app/admin/layout.tsx",
  },
  {
    icon: "FileCog",
    visibleText: "Paramètres PDF",
    ariaLabel: null,
    file: "app/app/admin/layout.tsx",
  },
  {
    icon: "FlaskConical",
    visibleText: "Développement",
    ariaLabel: null,
    file: "app/app/admin/layout.tsx",
  },

  // app/app/admin/developpement/pdf-lab/_components/pdf-lab-editor.tsx
  {
    icon: "Plus",
    visibleText: "Ajouter une ligne",
    ariaLabel: null,
    file: "app/app/admin/developpement/pdf-lab/_components/pdf-lab-editor.tsx",
  },
  {
    icon: "Trash2",
    visibleText: null,
    ariaLabel: null,
    file: "app/app/admin/developpement/pdf-lab/_components/pdf-lab-editor.tsx",
    context: "aria-label dynamique \"Supprimer la ligne {n}\"",
  },
  {
    icon: "Download",
    visibleText: "Télécharger le PDF",
    ariaLabel: null,
    file: "app/app/admin/developpement/pdf-lab/_components/pdf-lab-editor.tsx",
  },

  // app/app/admin/developpement/pdf-lab/_components/convention-pdf-lab-editor.tsx
  {
    icon: "Plus",
    visibleText: "Ajouter un représentant",
    ariaLabel: null,
    file: "app/app/admin/developpement/pdf-lab/_components/convention-pdf-lab-editor.tsx",
  },
  {
    icon: "Plus",
    visibleText: "Ajouter une ligne",
    ariaLabel: null,
    file: "app/app/admin/developpement/pdf-lab/_components/convention-pdf-lab-editor.tsx",
    context: "table des dépenses de la convention",
  },
  {
    icon: "Trash2",
    visibleText: null,
    ariaLabel: null,
    file: "app/app/admin/developpement/pdf-lab/_components/convention-pdf-lab-editor.tsx",
    context: "aria-label dynamique \"Supprimer le représentant {n}\"",
  },
  {
    icon: "Trash2",
    visibleText: null,
    ariaLabel: null,
    file: "app/app/admin/developpement/pdf-lab/_components/convention-pdf-lab-editor.tsx",
    context: "aria-label dynamique \"Supprimer la ligne {n}\"",
  },
  {
    icon: "Download",
    visibleText: "Télécharger la convention",
    ariaLabel: null,
    file: "app/app/admin/developpement/pdf-lab/_components/convention-pdf-lab-editor.tsx",
    context: "cohérent avec convention-preparation-form.tsx",
  },

  // app/app/admin/associations/_components/asso-type-alert.tsx
  {
    icon: "TriangleAlert",
    visibleText: "Type à définir",
    ariaLabel: null,
    file: "app/app/admin/associations/_components/asso-type-alert.tsx",
  },

  // app/app/admin/associations/[assoSlug]/_components/asso-type-picker.tsx
  {
    icon: "Building2 / Landmark / Scale",
    visibleText: null,
    ariaLabel: null,
    file: "app/app/admin/associations/[assoSlug]/_components/asso-type-picker.tsx",
    context:
      "une icône par type d'asso (CLUB/COMMISSION/ASSOCIATION_1901), texte fourni dynamiquement par assoTypeOptions (lib/admin/asso-labels)",
  },

  // app/app/admin/_components/dashboard/queue-list.tsx
  {
    icon: "Clock",
    visibleText: null,
    ariaLabel: null,
    file: "app/app/admin/_components/dashboard/queue-list.tsx",
    context: "à côté du titre d'une note de frais en attente, dans une liste",
  },
  {
    icon: "CalendarClock",
    visibleText: null,
    ariaLabel: null,
    file: "app/app/admin/_components/dashboard/queue-list.tsx",
    context: "à côté d'une phrase sur la prochaine/dernière campagne publiée",
  },

  // app/app/admin/_components/dashboard/activity-list.tsx
  {
    icon: "CheckCircle2",
    visibleText: null,
    ariaLabel: null,
    file: "app/app/admin/_components/dashboard/activity-list.tsx",
    context: "icône d'activité pour l'événement \"note_finalisee\", accolée à un texte d'événement dynamique",
  },
  {
    icon: "FileText",
    visibleText: null,
    ariaLabel: null,
    file: "app/app/admin/_components/dashboard/activity-list.tsx",
    context: "icône d'activité pour l'événement \"note_soumise\"",
  },
  {
    icon: "HandCoins",
    visibleText: null,
    ariaLabel: null,
    file: "app/app/admin/_components/dashboard/activity-list.tsx",
    context: "icône d'activité pour l'événement \"subvention_creee\"",
  },
  {
    icon: "Wallet",
    visibleText: null,
    ariaLabel: null,
    file: "app/app/admin/_components/dashboard/activity-list.tsx",
    context: "icône d'activité pour l'événement \"mouvement\"",
  },

  // components/ui/date-picker.tsx
  {
    icon: "CalendarDays",
    visibleText: null,
    ariaLabel: null,
    file: "components/ui/date-picker.tsx",
    context: "à côté de la date sélectionnée ou du placeholder, dans le bouton du sélecteur",
  },
  {
    icon: "ChevronLeft",
    visibleText: null,
    ariaLabel: null,
    file: "components/ui/date-picker.tsx",
    context: "navigation mois précédent du calendrier (slot du Web Component Cally, pas d'aria-label)",
  },
  {
    icon: "ChevronRight",
    visibleText: null,
    ariaLabel: null,
    file: "components/ui/date-picker.tsx",
    context: "navigation mois suivant du calendrier (slot du Web Component Cally, pas d'aria-label)",
  },

  // app/app/admin/subventions/[campaignId]/_components/subventions-table.tsx
  {
    icon: "Plus",
    visibleText: "Ajouter une ligne",
    ariaLabel: null,
    file: "app/app/admin/subventions/[campaignId]/_components/subventions-table.tsx",
    context: "cohérent avec pdf-lab-editor.tsx et convention-pdf-lab-editor.tsx",
  },

  // app/app/admin/subventions/[campaignId]/_components/asso-select.tsx
  {
    icon: "ChevronDown",
    visibleText: null,
    ariaLabel: null,
    file: "app/app/admin/subventions/[campaignId]/_components/asso-select.tsx",
    context: "chevron de dropdown, à côté du nom de l'asso sélectionnée ou d'un placeholder",
  },

  // app/app/[assoSlug]/notes-de-frais/_components/admin-outcomes-popover.tsx
  {
    icon: "Info",
    visibleText: null,
    ariaLabel: "Voir les décisions possibles de l'Admin CLA",
    file: "app/app/[assoSlug]/notes-de-frais/_components/admin-outcomes-popover.tsx",
    context: "bouton icône seul, déclenche le popover",
  },
  {
    icon: "CheckCircle2",
    visibleText: null,
    ariaLabel: null,
    file: "app/app/[assoSlug]/notes-de-frais/_components/admin-outcomes-popover.tsx",
    context: "dans la liste des décisions possibles (\"La valide telle quelle.\")",
  },
  {
    icon: "Pencil",
    visibleText: null,
    ariaLabel: null,
    file: "app/app/[assoSlug]/notes-de-frais/_components/admin-outcomes-popover.tsx",
    context: "dans la liste des décisions possibles (\"La modifie, puis la valide.\")",
  },
  {
    icon: "XCircle",
    visibleText: null,
    ariaLabel: null,
    file: "app/app/[assoSlug]/notes-de-frais/_components/admin-outcomes-popover.tsx",
    context: "dans la liste des décisions possibles (\"La rejette...\")",
  },

  // Boutons complétés le 2026-08-23 pour homogénéiser avec le reste du site
  // (voir section "Audit boutons sans icône")
  {
    icon: "X",
    visibleText: "Annuler",
    ariaLabel: null,
    file: "components/expense-reports/general-information-modal.tsx",
  },
  {
    icon: "Save",
    visibleText: "Enregistrer",
    ariaLabel: null,
    file: "components/expense-reports/general-information-modal.tsx",
  },
  {
    icon: "X",
    visibleText: "Annuler",
    ariaLabel: null,
    file: "app/app/[assoSlug]/notes-de-frais/[reportId]/_components/submit-expense-report-form.tsx",
  },
  {
    icon: "Send",
    visibleText: "Soumettre la note",
    ariaLabel: null,
    file: "app/app/[assoSlug]/notes-de-frais/[reportId]/_components/submit-expense-report-form.tsx",
    context: "confirmation dans la modale, cohérent avec le bouton d'ouverture",
  },
  {
    icon: "X",
    visibleText: "Annuler",
    ariaLabel: null,
    file: "app/app/[assoSlug]/notes-de-frais/[reportId]/_components/beneficiary-form.tsx",
  },
  {
    icon: "Send",
    visibleText: "Soumettre la note",
    ariaLabel: null,
    file: "app/app/[assoSlug]/notes-de-frais/[reportId]/_components/beneficiary-form.tsx",
    context: "confirmation dans la modale, cohérent avec submit-expense-report-form.tsx",
  },
  {
    icon: "Pencil",
    visibleText: "Modifier",
    ariaLabel: null,
    file: "app/app/[assoSlug]/notes-de-frais/[reportId]/_components/edit-expense-report-form.tsx",
    context: "bouton toggle, bascule vers X + \"Annuler\" en édition",
  },
  {
    icon: "X",
    visibleText: "Annuler",
    ariaLabel: null,
    file: "app/app/[assoSlug]/notes-de-frais/[reportId]/_components/edit-expense-report-form.tsx",
    context: "bouton toggle, même bouton que Pencil + \"Modifier\" hors édition",
  },
  {
    icon: "Save",
    visibleText: "Enregistrer",
    ariaLabel: null,
    file: "app/app/[assoSlug]/notes-de-frais/[reportId]/_components/edit-expense-report-form.tsx",
  },
  {
    icon: "Save",
    visibleText: "Enregistrer",
    ariaLabel: null,
    file: "app/app/admin/notes-de-frais/[reportId]/_components/admin-beneficiary-form.tsx",
  },
  {
    icon: "Save",
    visibleText: "Enregistrer",
    ariaLabel: null,
    file: "app/app/admin/subventions/[campaignId]/_components/edit-campaign-form.tsx",
  },
  {
    icon: "Save",
    visibleText: "Enregistrer",
    ariaLabel: null,
    file: "app/app/admin/associations/[assoSlug]/_components/manual-movement-form.tsx",
  },
  {
    icon: "ArrowLeft",
    visibleText: "Retour à l'accueil",
    ariaLabel: null,
    file: "app/mentions-legales/page.tsx",
  },
  {
    icon: "Plus",
    visibleText: "Nouvelle Note de frais",
    ariaLabel: null,
    file: "app/app/[assoSlug]/notes-de-frais/_components/new-expense-report-modal-button.tsx",
  },
  {
    icon: "Plus",
    visibleText: "Nouvelle campagne",
    ariaLabel: null,
    file: "app/app/admin/subventions/_components/new-campaign-modal-button.tsx",
  },
  {
    icon: "ArrowRight",
    visibleText: "Ajoutez une dépense et un justificatif pour continuer",
    ariaLabel: null,
    file: "app/app/[assoSlug]/notes-de-frais/[reportId]/remboursements/page.tsx",
    context: "état désactivé, cohérent avec le bouton actif \"Choisir le bénéficiaire\"",
  },
];
