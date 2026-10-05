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
  {
    icon: "ExternalLink",
    visibleText: "Modèle d'attestation sur l'honneur à dupliquer",
    ariaLabel: null,
    file: "components/expense-reports/supporting-documents-panel.tsx",
    context:
      "lien vers le Google Doc modèle (lecture seule, à dupliquer), affiché quand \"Attestation sur l'honneur\" est sélectionné avant l'envoi du justificatif",
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
    context:
      "financement par le solde du club (alternative à HandCoins), dans le tableau des dépenses",
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
  {
    icon: "Download",
    visibleText: null,
    ariaLabel: null,
    file: "app/app/[assoSlug]/notes-de-frais/[reportId]/recapitulatif/page.tsx",
    context:
      "à côté du nom d'un PDF final, dans la section Documents finaux (Note Validée)",
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
    visibleText: "Changer d'Asso",
    ariaLabel: null,
    file: "app/app/[assoSlug]/layout.tsx",
    context: "pied de nav membre, ouvre le sélecteur d'association",
  },
  {
    icon: "ShieldUser",
    visibleText: "Administration",
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

  // components/demo/demo-mode-banner.tsx
  {
    icon: "Sparkles",
    visibleText: "Vous explorez Trézo avec des données fictives.",
    ariaLabel: null,
    file: "components/demo/demo-mode-banner.tsx",
  },

  // components/demo/demo-login-button.tsx
  {
    icon: "Building2",
    visibleText: "On vous crée un Club fictif…",
    ariaLabel: null,
    file: "components/demo/demo-login-button.tsx",
    context:
      "étape à venir de l'écran de chargement du mode démo, cohérent avec « Assos » dans la nav admin",
  },
  {
    icon: "Wallet",
    visibleText: "On remplit son Solde…",
    ariaLabel: null,
    file: "components/demo/demo-login-button.tsx",
    context:
      "étape à venir de l'écran de chargement du mode démo, cohérent avec « Solde en temps réel » sur la landing page",
  },
  {
    icon: "Receipt",
    visibleText: "On prépare des notes de frais et des subventions…",
    ariaLabel: null,
    file: "components/demo/demo-login-button.tsx",
    context: "étape à venir de l'écran de chargement du mode démo",
  },
  {
    icon: "Check",
    visibleText: null,
    ariaLabel: null,
    file: "components/demo/demo-login-button.tsx",
    context:
      "remplace l'icône d'une étape terminée de l'écran de chargement du mode démo",
  },

  // app/page.tsx
  {
    icon: "LogIn",
    visibleText: "Se connecter",
    ariaLabel: null,
    file: "app/page.tsx",
    context: "landing page, symétrique du LogOut utilisé pour la déconnexion",
  },
  {
    icon: "Sparkles",
    visibleText: "Essayer la démo",
    ariaLabel: null,
    file: "app/page.tsx",
    context: "landing page, icône passée en prop à DemoLoginButton",
  },
  {
    icon: "TrendingUp",
    visibleText: null,
    ariaLabel: null,
    file: "app/page.tsx",
    context:
      "à côté du montant du solde, dans la maquette illustrative de la landing page",
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
    visibleText: "Subventions",
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
    icon: "Lock",
    visibleText: "Verrouillée dès sa prise en charge",
    ariaLabel: null,
    file: "app/app/[assoSlug]/notes-de-frais/_components/expense-report-guide.tsx",
    context: 'sous l\'étape "Soumettre" en surbrillance',
  },
  {
    icon: "CheckCircle2",
    visibleText: "Validée",
    ariaLabel: null,
    file: "app/app/[assoSlug]/notes-de-frais/_components/expense-report-guide.tsx",
    context: "décision possible de l'Admin CLA (étape 4)",
  },
  {
    icon: "Pencil",
    visibleText: "Modifiée puis validée",
    ariaLabel: null,
    file: "app/app/[assoSlug]/notes-de-frais/_components/expense-report-guide.tsx",
    context: "décision possible de l'Admin CLA (étape 4)",
  },
  {
    icon: "Ban",
    visibleText: "Rejetée : à refaire de zéro",
    ariaLabel: null,
    file: "app/app/[assoSlug]/notes-de-frais/_components/expense-report-guide.tsx",
    context:
      "décision possible de l'Admin CLA (étape 4), cohérent avec reject-button.tsx",
  },

  // app/app/[assoSlug]/notes-de-frais/[reportId]/_components/reimbursements-table.tsx
  {
    icon: "TriangleAlert",
    visibleText: null,
    ariaLabel: null,
    file: "components/expense-reports/reimbursements-table.tsx",
    context:
      "badge de compte d'alertes, dans la colonne d'actions de la dépense (aria-label = liste des alertes)",
  },
  {
    icon: "Trash2",
    visibleText: null,
    ariaLabel: null,
    file: "components/expense-reports/reimbursements-table.tsx",
    context:
      'bouton icône seul sur une ligne, aria-label dynamique "Supprimer {nom de la dépense}"',
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
    visibleText:
      "dépenses comportent une alerte. Cela ne bloque pas la soumission.",
    ariaLabel: null,
    file: "components/expense-reports/reimbursements-table.tsx",
    context: "bandeau de synthèse en pied de tableau",
  },

  // app/app/[assoSlug]/subventions/_components/subventions-ledger.tsx
  {
    icon: "Clock3",
    visibleText: "Subventions de plus d'un an",
    ariaLabel: null,
    file: "app/app/[assoSlug]/subventions/_components/subventions-ledger.tsx",
    context: "aria-hidden, en-tête de section",
  },
  {
    icon: "History",
    visibleText: "Historique",
    ariaLabel: null,
    file: "app/app/[assoSlug]/subventions/_components/subventions-ledger.tsx",
    context: "aria-hidden, en-tête de section",
  },

  // app/app/[assoSlug]/subventions/_components/grant-documents-list.tsx
  {
    icon: "Download",
    visibleText: "Télécharger",
    ariaLabel: null,
    file: "app/app/[assoSlug]/subventions/_components/grant-documents-list.tsx",
    context: "télécharge un Document d'octroi de la Structure",
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
    context: "ouvre la modale de confirmation de soumission",
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
    visibleText: "dépenses renseignées",
    ariaLabel: null,
    file: "app/app/[assoSlug]/notes-de-frais/[reportId]/_components/beneficiary-form.tsx",
    context: "liste de complétude",
  },
  {
    icon: "CheckCircle2",
    visibleText: "justificatifs ajoutés",
    ariaLabel: null,
    file: "app/app/[assoSlug]/notes-de-frais/[reportId]/_components/beneficiary-form.tsx",
    context: "liste de complétude",
  },
  {
    icon: "CheckCircle2",
    visibleText:
      "IBAN enregistré pour {bénéficiaire} / Bénéficiaire et IBAN à compléter",
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

  // components/nav/sidebar-drawer.tsx
  {
    icon: "Menu",
    visibleText: null,
    ariaLabel: "Ouvrir le menu",
    file: "components/nav/sidebar-drawer.tsx",
    context: 'bouton hamburger, symétrique du "Fermer le menu" sur l\'overlay',
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
    icon: "ShieldUser",
    visibleText: "Administration",
    ariaLabel: null,
    file: "app/app/page.tsx",
    context: 'bouton d\'en-tête, à droite du "Bonjour {prénom}"',
  },
  {
    icon: "ShieldUser",
    visibleText: "Autres Assos, accessibles en vue Admin",
    ariaLabel: null,
    file: "app/app/page.tsx",
    context:
      "titre du panneau repliable listant les Assos pour un Admin sans rôle dedans ; le texte visible inclut aussi le compte entre parenthèses",
  },

  // app/app/_components/member-asso-card.tsx
  {
    icon: "Building2",
    visibleText: null,
    ariaLabel: null,
    file: "app/app/_components/member-asso-card.tsx",
    context:
      "carte d'une Asso où l'utilisateur a un rôle, à côté du badge de type",
  },

  // app/app/_components/other-asso-card.tsx
  {
    icon: "Building2",
    visibleText: null,
    ariaLabel: null,
    file: "app/app/_components/other-asso-card.tsx",
    context:
      "carte d'une Asso accessible en vue Admin sans rôle, cohérent avec member-asso-card.tsx",
  },

  // app/app/admin/subventions/[campaignId]/_components/subventions-panel.tsx
  {
    icon: "FileText",
    visibleText: null,
    ariaLabel: null,
    file: "app/app/admin/subventions/[campaignId]/_components/subventions-panel.tsx",
    context:
      "à côté du nom d'une Structure, section Documents d'octroi de la campagne, cohérent avec documents-list.tsx",
  },
  {
    icon: "Download",
    visibleText: "Télécharger",
    ariaLabel: null,
    file: "app/app/admin/subventions/[campaignId]/_components/subventions-panel.tsx",
    context: "télécharge le Document d'octroi déjà généré d'une Structure",
  },
  {
    icon: "FileCheck",
    visibleText: "Préparer le document / Régénérer",
    ariaLabel: null,
    file: "app/app/admin/subventions/[campaignId]/_components/subventions-panel.tsx",
    context:
      "ouvre la page de préparation du Document d'octroi, libellé selon qu'il a déjà été généré ; cohérent avec generate-grant-document-button.tsx",
  },

  // app/app/admin/subventions/[campaignId]/octroi/[assoId]/_components/convention-preparation-form.tsx
  {
    icon: "Plus",
    visibleText: "Ajouter un représentant",
    ariaLabel: null,
    file: "app/app/admin/subventions/[campaignId]/octroi/[assoId]/_components/convention-preparation-form.tsx",
  },
  {
    icon: "Trash2",
    visibleText: null,
    ariaLabel: null,
    file: "app/app/admin/subventions/[campaignId]/octroi/[assoId]/_components/convention-preparation-form.tsx",
    context: 'aria-label dynamique "Supprimer le représentant {n}"',
  },

  // app/app/admin/subventions/[campaignId]/octroi/[assoId]/_components/generate-grant-document-button.tsx
  {
    icon: "FileCheck",
    visibleText: "Générer / Régénérer la convention · l’ordre de financement",
    ariaLabel: null,
    file: "app/app/admin/subventions/[campaignId]/octroi/[assoId]/_components/generate-grant-document-button.tsx",
    context:
      "page de préparation d'un Document d'octroi, libellé selon le type de document et l'existence d'une génération précédente",
  },

  // app/app/admin/subventions/[campaignId]/_components/subvention-row.tsx
  {
    icon: "Pencil",
    visibleText: null,
    ariaLabel: "Modifier la Subvention",
    file: "app/app/admin/subventions/[campaignId]/_components/subvention-row.tsx",
    context:
      'bouton icône seul qui bascule vers l\'icône X en mode édition, mais garde le même aria-label "Modifier la Subvention"',
  },
  {
    icon: "Trash2",
    visibleText: null,
    ariaLabel: "Supprimer la Subvention",
    file: "app/app/admin/subventions/[campaignId]/_components/subvention-row.tsx",
    context:
      "bouton icône seul, ouvre la modale de confirmation de suppression",
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
  {
    icon: "X",
    visibleText: "Annuler",
    ariaLabel: null,
    file: "app/app/admin/subventions/[campaignId]/_components/subvention-row.tsx",
    context:
      "modale de confirmation de suppression, cohérent avec delete-campaign-button.tsx",
  },
  {
    icon: "Trash2",
    visibleText: "Supprimer définitivement",
    ariaLabel: null,
    file: "app/app/admin/subventions/[campaignId]/_components/subvention-row.tsx",
    context: "bouton de confirmation dans la modale de suppression",
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
    context: 'aria-label dynamique "Supprimer le représentant {n}"',
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
    visibleText: "Assos",
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
    icon: "FileCog",
    visibleText: "Paramètres PDF",
    ariaLabel: null,
    file: "app/app/admin/layout.tsx",
  },
  {
    icon: "Archive",
    visibleText: "Stockage",
    ariaLabel: null,
    file: "app/app/admin/layout.tsx",
  },
  {
    icon: "Tags",
    visibleText: "Types de dépense",
    ariaLabel: null,
    file: "app/app/admin/layout.tsx",
    context: "nav admin, section Outils internes",
  },
  {
    icon: "FlaskConical",
    visibleText: "Développement",
    ariaLabel: null,
    file: "app/app/admin/layout.tsx",
  },

  // app/app/admin/types-de-depense/_components/type-depenses-table.tsx
  {
    icon: "Plus",
    visibleText: "Ajouter un Type de dépense",
    ariaLabel: null,
    file: "app/app/admin/types-de-depense/_components/type-depenses-table.tsx",
    context: "cohérent avec subventions-table.tsx",
  },

  // app/app/admin/types-de-depense/_components/new-type-depense-row.tsx
  {
    icon: "Check",
    visibleText: null,
    ariaLabel: "Enregistrer le Type de dépense",
    file: "app/app/admin/types-de-depense/_components/new-type-depense-row.tsx",
  },
  {
    icon: "X",
    visibleText: null,
    ariaLabel: "Annuler l'ajout",
    file: "app/app/admin/types-de-depense/_components/new-type-depense-row.tsx",
    context: "cohérent avec new-subvention-row.tsx",
  },

  // app/app/admin/types-de-depense/_components/type-depense-row.tsx
  {
    icon: "Pencil",
    visibleText: null,
    ariaLabel: "Renommer le Type de dépense",
    file: "app/app/admin/types-de-depense/_components/type-depense-row.tsx",
    context:
      "bouton icône seul qui bascule vers l'icône X en mode édition, cohérent avec subvention-row.tsx",
  },
  {
    icon: "Trash2",
    visibleText: null,
    ariaLabel: "Supprimer le Type de dépense",
    file: "app/app/admin/types-de-depense/_components/type-depense-row.tsx",
    context: "bouton icône seul, ouvre la modale de suppression",
  },
  {
    icon: "Check",
    visibleText: null,
    ariaLabel: "Enregistrer les modifications",
    file: "app/app/admin/types-de-depense/_components/type-depense-row.tsx",
  },
  {
    icon: "X",
    visibleText: null,
    ariaLabel: "Annuler la modification",
    file: "app/app/admin/types-de-depense/_components/type-depense-row.tsx",
  },
  {
    icon: "X",
    visibleText: "Annuler",
    ariaLabel: null,
    file: "app/app/admin/types-de-depense/_components/type-depense-row.tsx",
    context: "modale de suppression",
  },
  {
    icon: "Trash2",
    visibleText: "Supprimer",
    ariaLabel: null,
    file: "app/app/admin/types-de-depense/_components/type-depense-row.tsx",
    context:
      "bouton de confirmation de la modale, avec choix d'un Type de remplacement si le Type est utilisé",
  },

  // app/app/admin/types-de-depense/_components/custom-label-row.tsx
  {
    icon: "Pencil",
    visibleText: "Modifier",
    ariaLabel: null,
    file: "app/app/admin/types-de-depense/_components/custom-label-row.tsx",
    context: "ouvre la modale de reclassement d'un libellé personnalisé",
  },
  {
    icon: "X",
    visibleText: "Annuler",
    ariaLabel: null,
    file: "app/app/admin/types-de-depense/_components/custom-label-row.tsx",
  },
  {
    icon: "Check",
    visibleText: "Appliquer",
    ariaLabel: null,
    file: "app/app/admin/types-de-depense/_components/custom-label-row.tsx",
    context: "renomme le libellé ou impose un Type existant",
  },

  // app/app/admin/stockage/_components/storage-archive-button.tsx
  {
    icon: "Download",
    visibleText: "Télécharger (.zip)",
    ariaLabel: null,
    file: "app/app/admin/stockage/_components/storage-archive-button.tsx",
    context: "bouton par Structure, ouvre la modale de confirmation d'archive",
  },
  {
    icon: "TriangleAlert",
    visibleText: null,
    ariaLabel: null,
    file: "app/app/admin/stockage/_components/storage-archive-button.tsx",
    context:
      "modale d'archive, avertissement quand des fichiers sont introuvables sur le disque",
  },
  {
    icon: "X",
    visibleText: "Annuler",
    ariaLabel: null,
    file: "app/app/admin/stockage/_components/storage-archive-button.tsx",
    context: "modale d'archive, bouton d'annulation",
  },
  {
    icon: "Download",
    visibleText: "Télécharger",
    ariaLabel: null,
    file: "app/app/admin/stockage/_components/storage-archive-button.tsx",
    context: "modale d'archive, bouton de confirmation du téléchargement",
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
    context: 'aria-label dynamique "Supprimer la ligne {n}"',
  },
  {
    icon: "Download",
    visibleText: "Télécharger le PDF",
    ariaLabel: null,
    file: "app/app/admin/developpement/pdf-lab/_components/pdf-lab-editor.tsx",
  },

  // app/app/admin/developpement/pdf-lab/_components/ndf-solde-pdf-lab-editor.tsx
  {
    icon: "Plus",
    visibleText: "Ajouter une ligne",
    ariaLabel: null,
    file: "app/app/admin/developpement/pdf-lab/_components/ndf-solde-pdf-lab-editor.tsx",
    context: "cohérent avec pdf-lab-editor.tsx",
  },
  {
    icon: "Trash2",
    visibleText: null,
    ariaLabel: null,
    file: "app/app/admin/developpement/pdf-lab/_components/ndf-solde-pdf-lab-editor.tsx",
    context: 'aria-label dynamique "Supprimer la ligne {n}"',
  },
  {
    icon: "Download",
    visibleText: "Télécharger le PDF",
    ariaLabel: null,
    file: "app/app/admin/developpement/pdf-lab/_components/ndf-solde-pdf-lab-editor.tsx",
  },

  // app/app/admin/developpement/pdf-lab/_components/financement-pdf-lab-editor.tsx
  {
    icon: "Plus",
    visibleText: "Ajouter une ligne",
    ariaLabel: null,
    file: "app/app/admin/developpement/pdf-lab/_components/financement-pdf-lab-editor.tsx",
    context: "cohérent avec pdf-lab-editor.tsx",
  },
  {
    icon: "Trash2",
    visibleText: null,
    ariaLabel: null,
    file: "app/app/admin/developpement/pdf-lab/_components/financement-pdf-lab-editor.tsx",
    context: 'aria-label dynamique "Supprimer la ligne {n}"',
  },
  {
    icon: "Download",
    visibleText: "Télécharger le PDF",
    ariaLabel: null,
    file: "app/app/admin/developpement/pdf-lab/_components/financement-pdf-lab-editor.tsx",
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
    context: 'aria-label dynamique "Supprimer le représentant {n}"',
  },
  {
    icon: "Trash2",
    visibleText: null,
    ariaLabel: null,
    file: "app/app/admin/developpement/pdf-lab/_components/convention-pdf-lab-editor.tsx",
    context: 'aria-label dynamique "Supprimer la ligne {n}"',
  },
  {
    icon: "Download",
    visibleText: "Télécharger la convention",
    ariaLabel: null,
    file: "app/app/admin/developpement/pdf-lab/_components/convention-pdf-lab-editor.tsx",
    context: "cohérent avec convention-preparation-form.tsx",
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
    context:
      "icône d'activité pour l'événement \"note_finalisee\", accolée à un texte d'événement dynamique",
  },
  {
    icon: "Send",
    visibleText: null,
    ariaLabel: null,
    file: "app/app/admin/_components/dashboard/activity-list.tsx",
    context:
      "icône d'activité pour l'événement \"note_soumise\", cohérent avec le bouton Soumettre",
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
    context:
      "à côté de la date sélectionnée ou du placeholder, dans le bouton du sélecteur",
  },
  {
    icon: "ChevronLeft",
    visibleText: null,
    ariaLabel: null,
    file: "components/ui/date-picker.tsx",
    context:
      "navigation mois précédent du calendrier (slot du Web Component Cally, pas d'aria-label)",
  },
  {
    icon: "ChevronRight",
    visibleText: null,
    ariaLabel: null,
    file: "components/ui/date-picker.tsx",
    context:
      "navigation mois suivant du calendrier (slot du Web Component Cally, pas d'aria-label)",
  },

  // app/app/admin/subventions/[campaignId]/_components/subventions-table.tsx
  {
    icon: "Plus",
    visibleText: "Ajouter une Subvention",
    ariaLabel: null,
    file: "app/app/admin/subventions/[campaignId]/_components/subventions-table.tsx",
    context:
      "(×2 dans ce fichier : état vide et pied de tableau), cohérent avec reimbursements-table.tsx",
  },

  // app/app/admin/subventions/[campaignId]/_components/asso-select.tsx
  {
    icon: "ChevronDown",
    visibleText: null,
    ariaLabel: null,
    file: "app/app/admin/subventions/[campaignId]/_components/asso-select.tsx",
    context:
      "chevron de dropdown, à côté du nom de l'asso sélectionnée ou d'un placeholder",
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
    file: "app/app/[assoSlug]/notes-de-frais/[reportId]/_components/beneficiary-form.tsx",
  },
  {
    icon: "Send",
    visibleText: "Soumettre la note",
    ariaLabel: null,
    file: "app/app/[assoSlug]/notes-de-frais/[reportId]/_components/beneficiary-form.tsx",
    context: "confirmation dans la modale, cohérent avec le bouton d'ouverture",
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
    context: "dans la modale de modification",
  },
  {
    icon: "Pencil",
    visibleText: "Modifier",
    ariaLabel: null,
    file: "app/app/admin/subventions/[campaignId]/_components/edit-campaign-form.tsx",
    context:
      "bouton déclencheur en haut de la page, ouvre la modale ; cohérent avec general-information-modal.tsx",
  },
  {
    icon: "X",
    visibleText: "Annuler",
    ariaLabel: null,
    file: "app/app/admin/subventions/[campaignId]/_components/edit-campaign-form.tsx",
    context: "dans la modale de modification",
  },
  {
    icon: "Save",
    visibleText: "Enregistrer",
    ariaLabel: null,
    file: "app/app/admin/associations/[assoSlug]/_components/manual-movement-form.tsx",
  },
  {
    icon: "ArrowLeft",
    visibleText:
      "Toutes les Notes de frais / Toutes les campagnes / Toutes les Assos / {nom de la campagne} / Accueil",
    ariaLabel: null,
    file: "components/nav/back-link.tsx",
    context:
      "BackLink, lien retour au-dessus du titre des pages de détail (Notes de frais Asso et Admin, campagne, octroi, Asso Admin, mentions légales)",
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
    context:
      'état désactivé, cohérent avec le bouton actif "Choisir le bénéficiaire"',
  },

  // components/expense-reports/pdf-field-editors.tsx
  {
    icon: "Plus",
    visibleText: "Ajouter une ligne",
    ariaLabel: null,
    file: "components/expense-reports/pdf-field-editors.tsx",
    context: "cohérent avec pdf-lab-editor.tsx",
  },
  {
    icon: "Trash2",
    visibleText: null,
    ariaLabel: null,
    file: "components/expense-reports/pdf-field-editors.tsx",
    context:
      'aria-label dynamique "Supprimer la ligne {n}", cohérent avec pdf-lab-editor.tsx',
  },

  // app/app/admin/notes-de-frais/[reportId]/valider/_components/subvention-pdf-fields.tsx
  {
    icon: "Download",
    visibleText: "Aperçu PDF",
    ariaLabel: null,
    file: "app/app/admin/notes-de-frais/[reportId]/valider/_components/subvention-pdf-fields.tsx",
    context: "télécharge un aperçu sans rien enregistrer",
  },

  // app/app/admin/notes-de-frais/[reportId]/valider/_components/solde-pdf-fields.tsx
  {
    icon: "Download",
    visibleText: "Aperçu PDF",
    ariaLabel: null,
    file: "app/app/admin/notes-de-frais/[reportId]/valider/_components/solde-pdf-fields.tsx",
    context: "télécharge un aperçu sans rien enregistrer",
  },

  // app/app/admin/notes-de-frais/[reportId]/valider/_components/validate-expense-report-editor.tsx
  {
    icon: "CheckCircle2",
    visibleText: "Valider la Note de frais",
    ariaLabel: null,
    file: "app/app/admin/notes-de-frais/[reportId]/valider/_components/validate-expense-report-editor.tsx",
    context: "ouvre la modale de confirmation",
  },
  {
    icon: "CheckCircle2",
    visibleText: "Confirmer",
    ariaLabel: null,
    file: "app/app/admin/notes-de-frais/[reportId]/valider/_components/validate-expense-report-editor.tsx",
    context:
      'bouton de confirmation dans la modale "Valider cette Note de frais ?"',
  },
  {
    icon: "Download",
    visibleText: "Solde",
    ariaLabel: null,
    file: "app/app/admin/notes-de-frais/[reportId]/valider/_components/validate-expense-report-editor.tsx",
    context:
      'modale de succès, un lien par PDF généré ; texte visible dynamique, "Solde" ou la raison de la Subvention, cohérent avec layout.tsx',
  },

  // app/app/admin/notes-de-frais/[reportId]/remboursements/page.tsx
  {
    icon: "ArrowRight",
    visibleText: "Étape suivante : Bénéficiaire",
    ariaLabel: null,
    file: "app/app/admin/notes-de-frais/[reportId]/remboursements/page.tsx",
    context:
      "renvoie vers l'étape Bénéficiaire, où se trouve le bouton de Validation",
  },

  // app/app/admin/notes-de-frais/[reportId]/beneficiaire/page.tsx
  {
    icon: "CheckCircle2",
    visibleText: "Valider la Note de frais",
    ariaLabel: null,
    file: "app/app/admin/notes-de-frais/[reportId]/beneficiaire/page.tsx",
    context: "déclenche l'aperçu de validation (/valider)",
  },

  // app/app/admin/notes-de-frais/[reportId]/_components/pdf-download-button.tsx
  {
    icon: "Download",
    visibleText: "Solde",
    ariaLabel: null,
    file: "app/app/admin/notes-de-frais/[reportId]/_components/pdf-download-button.tsx",
    context:
      'un bouton par PDF final généré ; texte visible dynamique, "Solde" ou la raison de la Subvention concernée',
  },
  {
    icon: "X",
    visibleText: "Annuler",
    ariaLabel: null,
    file: "app/app/admin/notes-de-frais/[reportId]/_components/pdf-download-button.tsx",
    context: 'modale "Fichier introuvable", bouton d\'annulation',
  },
  {
    icon: "RotateCcw",
    visibleText: "Reconstituer et télécharger",
    ariaLabel: null,
    file: "app/app/admin/notes-de-frais/[reportId]/_components/pdf-download-button.tsx",
    context:
      'modale "Fichier introuvable", régénère le PDF depuis les données conservées',
  },

  // components/ui/toast.tsx
  {
    icon: "CheckCircle2",
    visibleText: null,
    ariaLabel: null,
    file: "components/ui/toast.tsx",
    context:
      "icône du toast de type succès ; texte du message toujours dynamique (fourni par l'appelant via useToast().push)",
  },
  {
    icon: "CircleAlert",
    visibleText: null,
    ariaLabel: null,
    file: "components/ui/toast.tsx",
    context:
      "icône du toast de type erreur, cohérent avec reimbursements-table.tsx",
  },
  {
    icon: "TriangleAlert",
    visibleText: null,
    ariaLabel: null,
    file: "components/ui/toast.tsx",
    context: "icône du toast de type avertissement",
  },
  {
    icon: "Info",
    visibleText: null,
    ariaLabel: null,
    file: "components/ui/toast.tsx",
    context: "icône du toast de type info",
  },
  {
    icon: "X",
    visibleText: null,
    ariaLabel: "Fermer",
    file: "components/ui/toast.tsx",
    context: "bouton icône seul de fermeture manuelle d'un toast",
  },

  // app/app/admin/notes-de-frais/[reportId]/_components/take-over-button.tsx
  {
    icon: "ClipboardCheck",
    visibleText: "Prendre en charge",
    ariaLabel: null,
    file: "app/app/admin/notes-de-frais/[reportId]/_components/take-over-button.tsx",
    context:
      "dans l'alerte en haut d'une Note Soumise (layout du wizard Admin)",
  },

  // app/app/admin/notes-de-frais/[reportId]/_components/reject-button.tsx
  {
    icon: "Ban",
    visibleText: "Rejeter la Note de frais",
    ariaLabel: null,
    file: "app/app/admin/notes-de-frais/[reportId]/_components/reject-button.tsx",
  },
  {
    icon: "X",
    visibleText: "Annuler",
    ariaLabel: null,
    file: "app/app/admin/notes-de-frais/[reportId]/_components/reject-button.tsx",
    context: "modale de confirmation du rejet",
  },
  {
    icon: "Ban",
    visibleText: "Confirmer le rejet",
    ariaLabel: null,
    file: "app/app/admin/notes-de-frais/[reportId]/_components/reject-button.tsx",
    context: "bouton de confirmation dans la modale",
  },

  // app/app/admin/notes-de-frais/[reportId]/_components/delete-expense-report-as-admin-button.tsx
  {
    icon: "Trash2",
    visibleText: "Supprimer",
    ariaLabel: null,
    file: "app/app/admin/notes-de-frais/[reportId]/_components/delete-expense-report-as-admin-button.tsx",
    context:
      "disponible quel que soit le statut, contrairement à DeleteExpenseReportButton (Structure, Brouillon uniquement)",
  },
  {
    icon: "X",
    visibleText: "Annuler",
    ariaLabel: null,
    file: "app/app/admin/notes-de-frais/[reportId]/_components/delete-expense-report-as-admin-button.tsx",
    context: "modale de confirmation de suppression",
  },
  {
    icon: "Trash2",
    visibleText: "Supprimer définitivement",
    ariaLabel: null,
    file: "app/app/admin/notes-de-frais/[reportId]/_components/delete-expense-report-as-admin-button.tsx",
    context:
      "bouton de confirmation dans la modale, désactivé tant que la case n'est pas cochée",
  },

  // app/app/admin/subventions/[campaignId]/_components/delete-campaign-button.tsx
  {
    icon: "Trash2",
    visibleText: "Supprimer",
    ariaLabel: null,
    file: "app/app/admin/subventions/[campaignId]/_components/delete-campaign-button.tsx",
  },
  {
    icon: "X",
    visibleText: "Annuler",
    ariaLabel: null,
    file: "app/app/admin/subventions/[campaignId]/_components/delete-campaign-button.tsx",
    context: "modale de confirmation de suppression",
  },
  {
    icon: "Trash2",
    visibleText: "Supprimer définitivement",
    ariaLabel: null,
    file: "app/app/admin/subventions/[campaignId]/_components/delete-campaign-button.tsx",
    context: "bouton de confirmation dans la modale",
  },

  // app/app/_components/member-asso-card.tsx (suite)
  {
    icon: "ArrowRight",
    visibleText: "Ouvrir",
    ariaLabel: null,
    file: "app/app/_components/member-asso-card.tsx",
    context: "faux bouton décoratif dans la carte d'une Asso membre, accueil",
  },

  // components/solde/solde-card.tsx
  {
    icon: "ChevronDown",
    visibleText: "Charger 10 mouvements de plus",
    ariaLabel: null,
    file: "components/solde/solde-card.tsx",
  },
  {
    icon: "ChevronUp",
    visibleText: "Réduire",
    ariaLabel: null,
    file: "components/solde/solde-card.tsx",
    context: "symétrique du ChevronDown ci-dessus",
  },

  // components/ui/date-picker.tsx (suite)
  {
    icon: "X",
    visibleText: "Vider",
    ariaLabel: null,
    file: "components/ui/date-picker.tsx",
    context:
      "bouton d'effacement de la date sélectionnée, popover du calendrier",
  },

  // app/app/admin/notes-de-frais/[reportId]/valider/_components/validate-expense-report-editor.tsx
  {
    icon: "X",
    visibleText: "Annuler",
    ariaLabel: null,
    file: "app/app/admin/notes-de-frais/[reportId]/valider/_components/validate-expense-report-editor.tsx",
    context: "modale de confirmation de validation",
  },
  {
    icon: "CheckCircle2",
    visibleText: "Terminer",
    ariaLabel: null,
    file: "app/app/admin/notes-de-frais/[reportId]/valider/_components/validate-expense-report-editor.tsx",
    context: "modale de succès après validation",
  },

  // components/asso/member-login-badge.tsx
  {
    icon: "LogIn",
    visibleText: null,
    ariaLabel: null,
    file: "components/asso/member-login-badge.tsx",
    context:
      'texte visible dynamique "Connecté·e le {date}" ; badge neutre affiché quand la dernière connexion du Membre est récente (cf. lib/asso/member-login.ts)',
  },
  {
    icon: "TriangleAlert",
    visibleText: null,
    ariaLabel: null,
    file: "components/asso/member-login-badge.tsx",
    context:
      'texte visible dynamique "Vu·e le {date}" ; badge orange avec tooltip explicatif quand la dernière connexion dépasse STALE_LOGIN_DAYS',
  },

  // app/app/admin/associations/[assoSlug]/_components/documents-list.tsx
  {
    icon: "FileText",
    visibleText: null,
    ariaLabel: null,
    file: "app/app/admin/associations/[assoSlug]/_components/documents-list.tsx",
    context:
      "aria-hidden, à côté du libellé du document (Convention de subvention ou Ordre de financement)",
  },

  // app/app/admin/associations/[assoSlug]/_components/subventions-tab.tsx
  {
    icon: "Clock3",
    visibleText: "Subventions de plus d'un an",
    ariaLabel: null,
    file: "app/app/admin/associations/[assoSlug]/_components/subventions-tab.tsx",
    context:
      "aria-hidden, en-tête de section, cohérent avec subventions-ledger.tsx",
  },

  // components/ui/empty-state.tsx (icône passée en prop)
  {
    icon: "Receipt",
    visibleText: "Aucune Note de frais pour l'instant",
    ariaLabel: null,
    file: "app/app/[assoSlug]/notes-de-frais/page.tsx",
    context: "état vide de la liste, avec le bouton Nouvelle Note de frais",
  },
  {
    icon: "Receipt",
    visibleText: "Aucune Note de frais soumise",
    ariaLabel: null,
    file: "app/app/admin/notes-de-frais/page.tsx",
    context: "état vide de la liste Admin",
  },
  {
    icon: "HandCoins",
    visibleText: "Aucune campagne de subvention",
    ariaLabel: null,
    file: "app/app/admin/subventions/page.tsx",
    context: "état vide de la liste des campagnes",
  },
  {
    icon: "Building2",
    visibleText: "Vous n'êtes membre d'aucune Asso pour le moment",
    ariaLabel: null,
    file: "app/app/page.tsx",
    context: "état vide de « Mes Assos », avec le bouton Déconnexion",
  },

  // app/login/page.tsx
  {
    icon: "TriangleAlert",
    visibleText: "La connexion avec votre compte CLA n'a pas abouti…",
    ariaLabel: null,
    file: "app/login/page.tsx",
    context: "alerte d'échec du SSO CLA",
  },
  {
    icon: "RotateCcw",
    visibleText: "Réessayer avec CLA",
    ariaLabel: null,
    file: "app/login/page.tsx",
  },
  {
    icon: "ArrowLeft",
    visibleText: "Retour à l'accueil",
    ariaLabel: null,
    file: "app/login/page.tsx",
  },

  // components/ui/route-error.tsx
  {
    icon: "TriangleAlert",
    visibleText: "Une erreur est survenue",
    ariaLabel: null,
    file: "components/ui/route-error.tsx",
    context: "pastille au-dessus du titre des pages d'erreur (error.tsx)",
  },
  {
    icon: "RotateCcw",
    visibleText: "Réessayer",
    ariaLabel: null,
    file: "components/ui/route-error.tsx",
    context: "relance le rendu de la page en erreur",
  },
  {
    icon: "ArrowLeft",
    visibleText: "Retour à l'accueil / Retour au Dashboard",
    ariaLabel: null,
    file: "components/ui/route-error.tsx",
    context: "libellé selon la section (racine, admin, Asso)",
  },

  // app/app/[assoSlug]/notes-de-frais/[reportId]/layout.tsx
  {
    icon: "Ban",
    visibleText: "Cette Note de frais a été rejetée par l'Admin CLA.",
    ariaLabel: null,
    file: "app/app/[assoSlug]/notes-de-frais/[reportId]/layout.tsx",
    context: "alerte d'une Note Rejetée, avec le motif du rejet",
  },

  // app/app/admin/notes-de-frais/[reportId]/layout.tsx
  {
    icon: "Ban",
    visibleText: "Note de frais rejetée.",
    ariaLabel: null,
    file: "app/app/admin/notes-de-frais/[reportId]/layout.tsx",
    context: "alerte d'une Note Rejetée, avec le motif du rejet",
  },

  // app/app/admin/associations/_components/associations-list.tsx
  {
    icon: "Search",
    visibleText: "Rechercher une Asso…",
    ariaLabel: null,
    file: "app/app/admin/associations/_components/associations-list.tsx",
    context: "aria-hidden, champ de recherche de la barre de filtres",
  },
  {
    icon: "X",
    visibleText: "Réinitialiser",
    ariaLabel: null,
    file: "app/app/admin/associations/_components/associations-list.tsx",
    context: "aria-hidden, bouton qui efface recherche et filtres",
  },
  {
    icon: "ArrowDownUp",
    visibleText: null,
    ariaLabel: "Trier par",
    file: "app/app/admin/associations/_components/associations-list.tsx",
    context: "aria-hidden, devant le menu de tri de la liste des Assos",
  },

  // app/app/admin/stockage/_components/storage-list.tsx
  {
    icon: "Search",
    visibleText: "Rechercher une Asso…",
    ariaLabel: null,
    file: "app/app/admin/stockage/_components/storage-list.tsx",
    context: "aria-hidden, champ de recherche de la barre de filtres",
  },
  {
    icon: "X",
    visibleText: "Réinitialiser",
    ariaLabel: null,
    file: "app/app/admin/stockage/_components/storage-list.tsx",
    context: "aria-hidden, bouton qui efface recherche et filtres",
  },
  {
    icon: "ArrowDownUp",
    visibleText: null,
    ariaLabel: "Trier par",
    file: "app/app/admin/stockage/_components/storage-list.tsx",
    context: "aria-hidden, devant le menu de tri de la liste du Stockage",
  },

  // app/app/[assoSlug]/notes-de-frais/_components/expense-reports-list.tsx
  {
    icon: "Search",
    visibleText: null,
    ariaLabel: null,
    file: "app/app/[assoSlug]/notes-de-frais/_components/expense-reports-list.tsx",
    context:
      "devant le champ de recherche de la barre de filtres, cohérent avec associations-list.tsx",
  },
  {
    icon: "X",
    visibleText: "Réinitialiser",
    ariaLabel: null,
    file: "app/app/[assoSlug]/notes-de-frais/_components/expense-reports-list.tsx",
    context: "efface recherche et filtres, cohérent avec associations-list.tsx",
  },
  {
    icon: "History",
    visibleText: "Historique — avant {année} ({n}) / Masquer l'historique",
    ariaLabel: null,
    file: "app/app/[assoSlug]/notes-de-frais/_components/expense-reports-list.tsx",
    context: "bouton qui affiche ou masque les éléments des années précédentes",
  },

  // app/app/admin/notes-de-frais/_components/expense-reports-list.tsx
  {
    icon: "Search",
    visibleText: null,
    ariaLabel: null,
    file: "app/app/admin/notes-de-frais/_components/expense-reports-list.tsx",
    context:
      "devant le champ de recherche de la barre de filtres, cohérent avec associations-list.tsx",
  },
  {
    icon: "X",
    visibleText: "Réinitialiser",
    ariaLabel: null,
    file: "app/app/admin/notes-de-frais/_components/expense-reports-list.tsx",
    context: "efface recherche et filtres, cohérent avec associations-list.tsx",
  },
  {
    icon: "History",
    visibleText: "Historique — avant {année} ({n}) / Masquer l'historique",
    ariaLabel: null,
    file: "app/app/admin/notes-de-frais/_components/expense-reports-list.tsx",
    context: "bouton qui affiche ou masque les éléments des années précédentes",
  },

  // app/app/admin/subventions/_components/campaigns-list.tsx
  {
    icon: "Search",
    visibleText: null,
    ariaLabel: null,
    file: "app/app/admin/subventions/_components/campaigns-list.tsx",
    context:
      "devant le champ de recherche de la barre de filtres, cohérent avec associations-list.tsx",
  },
  {
    icon: "X",
    visibleText: "Réinitialiser",
    ariaLabel: null,
    file: "app/app/admin/subventions/_components/campaigns-list.tsx",
    context: "efface recherche et filtres, cohérent avec associations-list.tsx",
  },
  {
    icon: "History",
    visibleText: "Historique — avant {année} ({n}) / Masquer l'historique",
    ariaLabel: null,
    file: "app/app/admin/subventions/_components/campaigns-list.tsx",
    context: "bouton qui affiche ou masque les éléments des années précédentes",
  },

  // app/app/[assoSlug]/notes-de-frais/[reportId]/_components/beneficiary-form.tsx
  {
    icon: "TriangleAlert",
    visibleText: "{n} alerte(s) non bloquante(s)",
    ariaLabel: null,
    file: "app/app/[assoSlug]/notes-de-frais/[reportId]/_components/beneficiary-form.tsx",
    context: "alerte avant soumission, cohérent avec reimbursements-table.tsx",
  },
];
