/** Premier élément d'un en-tête pouvant lister plusieurs proxies ("a, b"). */
function firstHeaderValue(request: Request, name: string): string | null {
  return request.headers.get(name)?.split(",")[0]?.trim() || null;
}

/**
 * Origine publique de la requête. Derrière le reverse proxy (Coolify),
 * request.url porte l'adresse interne du serveur Next (localhost:3000) :
 * on reconstruit l'origine à partir des en-têtes X-Forwarded-*, et on ne
 * retombe sur request.url qu'en leur absence (dev local, tests).
 */
export function getPublicOrigin(request: Request): string {
  const proto = firstHeaderValue(request, "x-forwarded-proto");
  const host = firstHeaderValue(request, "x-forwarded-host");

  if (proto && host) {
    return `${proto}://${host}`;
  }

  return new URL(request.url).origin;
}
