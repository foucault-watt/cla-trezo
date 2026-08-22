---
name: Trézo
description: Application de gestion financière de Centrale Lille Associations — soldes, subventions et notes de frais.
colors:
  jaune-bourdon: "oklch(85% 0.199 91.936)"
  jaune-bourdon-content: "oklch(42% 0.095 57.708)"
  terracotta: "oklch(75% 0.183 55.934)"
  terracotta-content: "oklch(40% 0.123 38.172)"
  noir-absolu: "oklch(0% 0 0)"
  noir-absolu-content: "oklch(100% 0 0)"
  neutre-chaud: "oklch(37% 0.01 67.558)"
  neutre-chaud-content: "oklch(92% 0.003 48.717)"
  papier-blanc: "oklch(100% 0 0)"
  gris-perle: "oklch(97% 0 0)"
  gris-bordure: "oklch(92% 0 0)"
  encre: "oklch(20% 0 0)"
  bleu-info: "oklch(74% 0.16 232.661)"
  bleu-info-content: "oklch(39% 0.09 240.876)"
  vert-succes: "oklch(76% 0.177 163.223)"
  vert-succes-content: "oklch(37% 0.077 168.94)"
  orange-avertissement: "oklch(82% 0.189 84.429)"
  orange-avertissement-content: "oklch(41% 0.112 45.904)"
  rouge-erreur: "oklch(70% 0.191 22.216)"
  rouge-erreur-content: "oklch(39% 0.141 25.723)"
typography:
  headline:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.3
  title:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 700
    lineHeight: 1.4
  body:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.4
rounded:
  field: "0.5rem"
  box: "1rem"
  selector: "2rem"
spacing:
  sm: "0.5rem"
  md: "1rem"
  lg: "1.5rem"
components:
  button-primary:
    backgroundColor: "{colors.jaune-bourdon}"
    textColor: "{colors.jaune-bourdon-content}"
    rounded: "{rounded.field}"
    padding: "0.5rem 1rem"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.encre}"
    rounded: "{rounded.field}"
    padding: "0.5rem 1rem"
  card:
    backgroundColor: "{colors.papier-blanc}"
    rounded: "{rounded.box}"
    padding: "1.5rem"
  badge-status-outline:
    backgroundColor: "transparent"
    textColor: "{colors.encre}"
    rounded: "{rounded.selector}"
    padding: "0.125rem 0.5rem"
---

# Design System: Trézo

## Overview

**Creative North Star: "Le Grand Livre Doré"**

Trézo est le registre de trésorerie d'une fédération d'associations étudiantes : un dégradé de miel et d'or (hérité du thème DaisyUI « bumblebee ») pose une identité chaleureuse et digne de confiance sur un fond quasiment blanc, pour un outil qui traite des sujets sérieux (soldes, subventions, justificatifs) sans jamais se donner des airs de logiciel comptable austère. Les responsables de club qui l'utilisent changent chaque année et n'ont souvent aucune formation financière : chaque écran privilégie donc la clarté et la prévisibilité — net et rassurant, sans fioritures — plutôt que l'expressivité visuelle. La cartes légèrement soulevées (bordure fine + ombre douce), les statuts codés par couleur sémantique et la continuité du doré chaud entre thème clair et sombre forment un langage cohérent que même un nouvel utilisateur reconnaît instantanément.

**Key Characteristics:**

- Fond quasiment neutre (blanc/gris très clairs) qui laisse le Jaune Bourdon jouer son rôle de signal, jamais de fond.
- Cartes sobres, délimitées par une bordure fine et une ombre douce plutôt que par des aplats de couleur.
- Un unique système de couleur pour coder l'état d'une Note de frais, réutilisé partout (badge, pastille, liste).
- Le doré/miel de l'identité claire est délibérément reconduit en thème sombre plutôt que remplacé par la palette « dim » standard de DaisyUI.

## Colors

Palette resserrée autour d'un doré chaud dominant, avec un usage volontairement rare des couleurs sémantiques (réservées aux signaux d'état).

### Primary

- **Jaune Bourdon** (`oklch(85% 0.199 91.936)`): couleur d'action principale — boutons primaires, liens de mise en avant, focus sur l'étape courante d'un parcours (stepper de Note de frais). Texte porté par **Jaune Bourdon Content** (`oklch(42% 0.095 57.708)`, brun ambré foncé) pour rester lisible sur le fond doré.

### Secondary

- **Terracotta** (`oklch(75% 0.183 55.934)`): accent chaud secondaire, même famille de teinte que le Jaune Bourdon mais plus orangée — utilisée avec parcimonie, en dehors du système de statut sémantique.

### Tertiary

- **Noir Absolu** (`oklch(0% 0 0)`) en thème clair / **Violet Profond** (`oklch(74.229% 0.133 311.379)`) en thème sombre : troisième accent, peu employé dans l'implémentation actuelle. Sa bascule du noir pur au violet entre les deux thèmes n'est pas retravaillée par le projet (valeurs par défaut du thème « dim » de DaisyUI) — à traiter comme un signal faible plutôt qu'une règle affirmée.

### Neutral

- **Papier Blanc** (`oklch(100% 0 0)`) : fond de page et de carte en thème clair (`--color-base-100`).
- **Gris Perle** (`oklch(97% 0 0)`) : fond de section, zébrage de lignes de liste (`--color-base-200`).
- **Gris Bordure** (`oklch(92% 0 0)`) : bordures de carte, séparateurs (`--color-base-300`).
- **Encre** (`oklch(20% 0 0)`) : texte principal (`--color-base-content`) ; le texte secondaire dérive systématiquement de cette même valeur assouplie en opacité (`text-base-content/70`, `/60`, `/50`), jamais d'un gris indépendant.
- **Neutre Chaud** (`oklch(37% 0.01 67.558)`) : rôle neutre DaisyUI, disponible mais peu sollicité dans les écrans actuels.

### Semantic (status)

Ces quatre couleurs ne décorent jamais l'interface : elles signalent exclusivement un état, toujours par la même paire badge + pastille.

- **Bleu Info** (`oklch(74% 0.16 232.661)`) : Note de frais Soumise.
- **Orange Avertissement** (`oklch(82% 0.189 84.429)`) : Note de frais Prise en charge ; aussi les avertissements non bloquants (solde négatif, dépassement de Subvention).
- **Vert Succès** (`oklch(76% 0.177 163.223)`) : Note de frais Validée.
- **Rouge Erreur** (`oklch(70% 0.191 22.216)`) : Note de frais Rejetée.

### Named Rules

**The Status Color Contract Rule.** Chaque statut de Note de frais a une couleur et une seule, appliquée identiquement à son badge et à sa pastille, dans tout le produit (vue Structure et vue Admin) : Brouillon = neutre (`badge-ghost`), Soumise = Bleu Info, Prise en charge = Orange Avertissement, Validée = Vert Succès, Rejetée = Rouge Erreur. N'introduire aucune variation locale de cette table.

**The Honey Continuity Rule.** Le thème sombre (« dim ») ne reprend pas la palette DaisyUI standard : le Primary et le Warning y sont retravaillés vers la même famille de teinte chaude (doré/ambre, teintes ~38–49°) que le thème clair, pour que l'identité « Jaune Bourdon » survive au changement de thème plutôt que de céder la place à un vert générique.

## Typography

**Body Font:** pile système par défaut de Tailwind (`ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`).

**Character:** neutre et lisible, sans personnalité typographique affirmée — la hiérarchie se fait par taille et graisse, jamais par changement de famille.

> Note d'implémentation : Geist Sans et Geist Mono sont chargés via `next/font/google` et exposés comme variables CSS (`--font-geist-sans`, `--font-geist-mono`) sur `<html>`, mais aucune règle CSS ni configuration Tailwind ne les branche à `font-family` — le rendu actuel utilise donc la pile système par défaut, pas Geist. À corriger si l'usage de Geist est intentionnel, ou à retirer sinon.

### Hierarchy

- **Headline** (600, 1.5rem `text-2xl`, line-height ~1.3) : titre de page (« Associations », « Tableau de bord »), toujours suivi d'un sous-titre `text-sm text-base-content/70`.
- **Title** (700, 1.125rem `text-lg`, composant `card-title` DaisyUI) : titre de carte (« Solde »).
- **Body** (400, 0.875rem `text-sm`) : texte courant, libellés de formulaire, contenu de liste.
- **Label** (500, 0.75rem `text-xs`) : métadonnées (dates, descriptions secondaires, `stat-title`), quasi toujours en `text-base-content/50` à `/70`.

Le hero de la page publique (`text-3xl sm:text-4xl font-semibold`) est la seule occurrence d'un niveau « Display » plus grand ; il n'est pas réemployé ailleurs dans le produit.

## Layout

Densité confortable, orientée traitement de dossiers plutôt que vitrine : conteneurs `max-w-3xl`/`max-w-5xl` centrés sur la page publique, contenu applicatif en pleine largeur du panneau (`flex-1 p-6`). Grilles de cartes en 1/2/3 colonnes (`grid-cols-1 sm:grid-cols-2 md:grid-cols-3`) pour les vues « grille » (associations, campagnes) ; listes tabulaires denses (`px-4 py-2.5`, zébrage `bg-base-200/60` une ligne sur deux) pour les vues « liste » — la bascule entre les deux est laissée à l'utilisateur via `ViewToggle`.

Navigation en tiroir latéral (`drawer`) : barre fixe de 16rem (`w-64`) à partir du breakpoint `lg` (1024px), repliée derrière un bouton hamburger en dessous. Espacements internes réguliers par paliers de 0.5rem/1rem/1.5rem (`gap-2`/`gap-4`/`gap-6`, `p-4`/`p-6`).

## Elevation & Depth

**The Bordered-Lift Rule.** Chaque carte combine systématiquement une bordure fine (`border border-base-300`) et une ombre douce (`shadow-md` ou `shadow-sm`) — jamais l'une sans l'autre, jamais d'ombre profonde ni de superposition tonale seule. C'est une sobriété assumée et à conserver : un outil de gestion (Operate), pas une vitrine (Persuade). Les boutons et champs portent en plus un léger relief natif à DaisyUI 5 (jeton `--depth: 1`), qui donne un discret dégradé de surbrillance — actif en thème clair comme en thème sombre (le thème sombre relève ce jeton au-dessus de sa valeur par défaut DaisyUI pour rester cohérent avec le clair).

### Shadow Vocabulary

- **`shadow-sm`** : cartes secondaires, badges de rappel de contexte.
- **`shadow-md`** : carte principale d'une page (solde, stats, liste), la valeur par défaut du système.
- **`shadow-lg`** : éléments flottants ponctuels (popover du sélecteur de date).

## Shapes

Coins généreusement arrondis, cohérents avec la chaleur de la palette : `rounded-box` (1rem) pour cartes, listes et popovers, `rounded-field` (0.5rem) pour boutons et champs de saisie. Les éléments « sélecteurs » (badges, puces, cases à cocher) vont jusqu'au plein arrondi en thème clair (`--radius-selector: 2rem`, quasi-pilule) mais restent à 1rem en thème sombre — une asymétrie héritée de la personnalisation du thème clair, non répercutée côté sombre ; à traiter comme un fait observé, pas encore comme une règle voulue des deux côtés.

## Components

Le vocabulaire de composants est presque entièrement DaisyUI 5 non surchargé (`btn`, `card`, `badge`, `stats`, `steps`, `alert`, `drawer`, `menu`, `breadcrumbs`) : la personnalité du produit vient des jetons de thème, pas de composants réinventés.

### Buttons

- **Shape:** coins `rounded-field` (0.5rem).
- **Primary:** `btn btn-primary` — fond Jaune Bourdon, texte Jaune Bourdon Content ; réservé à l'action principale d'un écran.
- **Outline / Ghost:** `btn btn-outline` / `btn btn-ghost` pour les actions secondaires (« Charger plus », « Réduire », fermeture de modale) ; `btn-square`/`btn-circle` pour les boutons icône seule (bascule de thème, hamburger).
- **Tailles:** `btn-sm` quasi systématique dans les barres d'outils et cartes denses ; taille par défaut réservée aux actions de page (CTA « Se connecter »).

### Cards / Containers

- **Corner Style:** `rounded-box` (1rem).
- **Background:** Papier Blanc (`bg-base-100`).
- **Border:** `border border-base-300`, toujours présente (cf. Bordered-Lift Rule).
- **Shadow Strategy:** voir Elevation & Depth.
- **Internal Padding:** `card-body` par défaut DaisyUI, titre en `card-title`.

### Badges (statut)

- **Style:** `badge` plein pour les statuts de Note de frais (voir Status Color Contract Rule) ; `badge-outline badge-sm` pour les montants par source de financement (Solde / Subvention) sur un bénéficiaire.
- **Pastille compagnon:** un point de 0.625rem (`size-2.5 rounded-full`) porte la même couleur que le badge dans les vues liste — redondance délibérée pour un balayage visuel plus rapide qu'un badge texte seul.

### Stats

- **Style:** `stats` DaisyUI (`stats-vertical` mobile → `sm:stats-horizontal`), toujours dans une carte bordée. Valeur en `stat-value text-2xl`, viré en Rouge Erreur uniquement quand elle signale une anomalie à traiter (ex. « Types à définir »).

### Steps (signature)

Composant `steps` DaisyUI utilisé pour le parcours de Note de frais (Remboursements → Justificatifs → Bénéficiaire → Récapitulatif). L'étape active passe en Jaune Bourdon (`step-primary`, texte `font-semibold text-primary`) ; les étapes non encore accessibles restent en `text-base-content/40`. Toute la zone rond + trait est cliquable (lien invisible superposé), pas seulement le libellé.

### Modal (signature)

Basée sur l'élément natif `<dialog>` (recommandé DaisyUI) rendu via portail, jamais un composant de modale maison : fermeture par Échap et clic sur fond gérée nativement. Bouton de fermeture systématique en haut à droite (`btn btn-sm btn-circle btn-ghost`), titre en `text-lg font-bold`.

### Inputs / Fields

- **Style:** `input` DaisyUI, `rounded-field`.
- **Sélecteur de date (signature):** composant maison au-dessus du web component `cally`, en remplacement de l'`<input type="date">` natif pour un rendu cohérent avec le thème — jamais l'input natif du navigateur ailleurs dans le produit.

### Navigation

- **Style:** tiroir latéral fixe (`w-64`, `border-r border-base-300`, `bg-base-100`) contenant un `menu` DaisyUI ; l'item actif est signalé par `menu-active`, pas par une couleur ad hoc. En dessous du breakpoint `lg`, la même navigation devient un tiroir masqué déclenché par un bouton hamburger dans une barre supérieure compacte.

### Alerts

- **Style:** `alert` DaisyUI avec variante `alert-soft` pour les messages informatifs non bloquants (ex. solde non initialisé) — jamais un message d'erreur pour un état qui n'est qu'informatif (cf. le terme « Warning » de [CONTEXT.md](CONTEXT.md) : un warning n'est jamais un blocage).

## Do's and Don'ts

### Do:

- **Do** garder la table Statut → Couleur identique partout (Status Color Contract Rule) ; toute nouvelle vue de Note de frais doit la réutiliser telle quelle, sans redéfinir localement une couleur de statut.
- **Do** toujours coupler bordure fine et ombre douce sur une carte (Bordered-Lift Rule) ; ne jamais utiliser l'une sans l'autre.
- **Do** dériver le texte secondaire/tertiaire de `base-content` par opacité (`/70`, `/60`, `/50`) plutôt que d'introduire un gris indépendant.
- **Do** faire porter au thème sombre la même famille de teinte chaude que le thème clair pour Primary/Warning (Honey Continuity Rule), plutôt que d'accepter les couleurs par défaut du thème « dim » de DaisyUI.
- **Do** utiliser le composant `DatePicker` (`cally`) pour toute saisie de date, jamais l'`<input type="date">` natif.

### Don't:

- **Don't** empiler les ombres profondes ou les effets de profondeur marqués — Trézo est un outil de gestion sobre (Operate), pas une vitrine.
- **Don't** introduire une nouvelle couleur d'accent hors de la famille Jaune Bourdon / Terracotta / Noir Absolu-Violet Profond sans raison fonctionnelle documentée.
- **Don't** réserver les couleurs sémantiques (info/succès/avertissement/erreur) à autre chose qu'un signal d'état réel — elles ne sont jamais décoratives.
- **Don't** fabriquer une modale maison : passer par l'élément `<dialog>` natif comme le fait déjà `Modal`.
