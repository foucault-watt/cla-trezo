import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/**
 * Lien retour vers la page parente, posé au-dessus du titre d'une page de
 * détail. Un seul style pour tout le site (cf. docs/design/COMPONENTS.md,
 * "Page header") : discret, avec l'icône `ArrowLeft` plutôt qu'une flèche
 * « ← » en texte.
 */
export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="link link-hover inline-flex items-center gap-1 text-sm text-base-content/70"
    >
      <ArrowLeft size={14} />
      {label}
    </Link>
  );
}
