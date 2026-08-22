"use client";

import "cally";
import { useEffect, useId, useRef } from "react";
import type { DetailedHTMLProps, HTMLAttributes } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

// React 19 résout les éléments JSX via `React.JSX` (dans "react/index.d.ts"),
// pas via le namespace global `JSX` : on augmente donc le module "react"
// lui-même pour déclarer les custom elements enregistrés par `cally`.
declare module "react" {
  // eslint-disable-next-line @typescript-eslint/no-namespace -- seule syntaxe possible pour étendre React.JSX.IntrinsicElements.
  namespace JSX {
    interface IntrinsicElements {
      "calendar-date": DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          value?: string;
          locale?: string;
          firstDayOfWeek?: number;
        },
        HTMLElement
      >;
      "calendar-month": DetailedHTMLProps<
        HTMLAttributes<HTMLElement>,
        HTMLElement
      >;
    }
  }
}

const displayFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

function parseIsoDate(value: string): Date | undefined {
  if (!value) return undefined;
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Sélecteur de date DaisyUI basé sur le Web Component `cally` (calendrier
 * officiel recommandé par DaisyUI, cf. daisyui.com/components/calendar) :
 * remplace `<input type="date">` partout dans le site pour un rendu
 * cohérent avec le thème plutôt que le widget natif du navigateur.
 *
 * L'événement `change` de `calendar-date` ne bubble pas (cf. doc Cally) :
 * le `onChange` JSX de React — bâti sur la délégation d'événements, donc
 * sur le bubbling — ne le capterait jamais. L'écoute se fait donc à la main
 * via `ref` + `addEventListener`, pas via une prop `onChange`.
 *
 * Soumet sa valeur via un `<input type="hidden">` au format `yyyy-MM-dd`
 * (même format que l'ancien input natif), donc compatible telle quelle avec
 * les Server Actions existantes lisant `formData`.
 */
export function DatePicker({
  name,
  value,
  onChange,
  placeholder = "Choisir une date",
  className = "",
  size = "md",
  clearable = false,
}: {
  name: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  size?: "sm" | "md";
  /** Autorise à revenir à une valeur vide (ex : date de publication non fixée). */
  clearable?: boolean;
}) {
  const anchorId = `date-picker-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const popoverId = `${anchorId}-popover`;
  const calendarRef = useRef<HTMLElement & { value: string }>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  // Toujours à jour sans figurer dans les deps de l'effet ci-dessous : sinon
  // un `onChange` recréé à chaque rendu (cas courant, ex. un state parent
  // regroupant plusieurs champs) réattacherait l'event listener DOM à
  // chaque frappe ailleurs dans le formulaire.
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    const element = calendarRef.current;
    if (!element) return;
    function handleChange(event: Event) {
      onChangeRef.current(
        (event.target as HTMLElement & { value: string }).value ?? "",
      );
      // `calendar-date` ne ferme pas la popover toute seule : un choix de
      // date est une sélection définitive, pas une valeur à ajuster encore.
      popoverRef.current?.hidePopover();
    }
    element.addEventListener("change", handleChange);
    return () => element.removeEventListener("change", handleChange);
  }, []);

  const selectedDate = parseIsoDate(value);

  return (
    <>
      <input type="hidden" name={name} value={value} />
      <button
        type="button"
        popoverTarget={popoverId}
        id={anchorId}
        style={{ anchorName: `--${anchorId}` } as React.CSSProperties}
        className={`input ${size === "sm" ? "input-sm" : ""} w-full justify-between font-normal ${className}`}
      >
        <span className={value ? "" : "text-base-content/50"}>
          {value && selectedDate
            ? displayFormatter.format(selectedDate)
            : placeholder}
        </span>
        <CalendarDays size={15} className="shrink-0 opacity-60" />
      </button>
      <div
        ref={popoverRef}
        popover="auto"
        id={popoverId}
        className="dropdown bg-base-100 rounded-box shadow-lg"
        style={{ positionAnchor: `--${anchorId}` } as React.CSSProperties}
      >
        <calendar-date
          ref={calendarRef}
          className="cally"
          locale="fr-FR"
          firstDayOfWeek={1}
          value={value}
        >
          <ChevronLeft slot="previous" size={16} />
          <ChevronRight slot="next" size={16} />
          <calendar-month></calendar-month>
        </calendar-date>
        {clearable && value && (
          <button
            type="button"
            className="btn btn-ghost btn-sm btn-block rounded-t-none"
            onClick={() => {
              onChange("");
              popoverRef.current?.hidePopover();
            }}
          >
            Vider
          </button>
        )}
      </div>
    </>
  );
}
