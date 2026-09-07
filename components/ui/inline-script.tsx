// cf. node_modules/next/dist/docs/01-app/02-guides/preventing-flash-before-hydration.md :
// React avertit en dev dès qu'un rendu produit un <script> brut. On bascule
// son `type` en "text/plain" côté client pour que React ne le considère plus
// comme un script à exécuter/avertir au hydrate ; le script a de toute façon
// déjà tourné pendant le parsing HTML côté serveur.
export function InlineScript({ html }: { html: string }) {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
