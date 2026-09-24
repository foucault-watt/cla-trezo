/**
 * Accorde un mot (ou un groupe de mots) au nombre, à la française : 0 et 1
 * restent au singulier. Sans `plural`, ajoute un « s » au singulier — à
 * fournir explicitement pour les groupes de mots (« fichier prêt ») et les
 * pluriels irréguliers.
 */
export function agree(count: number, singular: string, plural = `${singular}s`) {
  return count > 1 ? plural : singular;
}

/** Le nombre suivi du mot accordé : « 1 note », « 3 notes ». */
export function pluralize(
  count: number,
  singular: string,
  plural = `${singular}s`,
) {
  return `${count} ${agree(count, singular, plural)}`;
}
