"use client";

import { useEffect, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Building2, Check, Receipt, Wallet } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { demoLoginAction } from "@/lib/auth/actions";

// Chaque étape dure STEP_MS : l'écran reste affiché au moins
// STEPS.length × STEP_MS, même si la préparation des données fictives est
// plus rapide, pour laisser le temps de lire les explications.
const STEP_MS = 2000;

const STEPS = [
  {
    label: "On vous crée un Club fictif…",
    icon: Building2,
    tip: "Chaque Club, Commission ou Association de Centrale Lille a son propre espace, accessible à ses membres via le SSO de CLA.",
  },
  {
    label: "On remplit son Solde…",
    icon: Wallet,
    tip: "CLA gère l'argent des Clubs : chaque entrée et chaque sortie est tracée, et le Solde est visible en temps réel.",
  },
  {
    label: "On prépare des notes de frais et des subventions…",
    icon: Receipt,
    tip: "Un membre dépose ses justificatifs, l'Admin de CLA valide la note de frais et le PDF officiel est généré automatiquement.",
  },
];

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function DemoLoginButton({
  className = "btn btn-outline w-full max-w-xs h-10",
  icon,
}: {
  className?: string;
  icon?: ReactNode;
}) {
  const router = useRouter();
  const { push } = useToast();
  const [, startTransition] = useTransition();
  const [loading, setLoading] = useState(false);

  function start() {
    setLoading(true);
    startTransition(async () => {
      try {
        const [href] = await Promise.all([
          demoLoginAction(),
          wait(STEPS.length * STEP_MS),
        ]);
        // L'écran reste affiché jusqu'au démontage par la navigation.
        router.push(href);
      } catch {
        setLoading(false);
        push({
          type: "error",
          message: "Impossible de préparer la démo. Réessayez dans un instant.",
        });
      }
    });
  }

  return (
    <>
      <button type="button" className={className} onClick={start}>
        {icon}
        Essayer la démo
      </button>
      {loading && <DemoLoadingScreen />}
    </>
  );
}

function DemoLoadingScreen() {
  // STEPS.length = toutes les étapes cochées, en attente de la navigation.
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = setInterval(
      () => setStep((s) => Math.min(s + 1, STEPS.length)),
      STEP_MS,
    );
    return () => clearInterval(id);
  }, []);

  const done = step >= STEPS.length;
  const tip = STEPS[Math.min(step, STEPS.length - 1)].tip;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="demo-loading-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-base-100/90 px-4 backdrop-blur-sm motion-safe:animate-[demo-fade-in_300ms_ease-out]"
    >
      <div className="w-full max-w-md rounded-2xl border border-base-300 bg-base-100 p-6 text-left shadow-xl sm:p-8">
        <p className="text-xs font-medium uppercase tracking-wide text-primary">
          Mode démo
        </p>
        <h2 id="demo-loading-title" className="mt-1 text-xl font-semibold">
          {done
            ? "Votre espace est prêt !"
            : "On vous prépare un espace fictif"}
        </h2>

        <progress
          className="progress progress-primary mt-5 w-full"
          value={Math.min(step + 1, STEPS.length)}
          max={STEPS.length}
          aria-hidden="true"
        />

        <ol className="mt-5 space-y-3" aria-live="polite">
          {STEPS.map(({ label, icon: Icon }, i) => {
            const state = i < step ? "done" : i === step ? "active" : "todo";
            return (
              <li
                key={label}
                className={`flex items-center gap-3 text-sm transition-opacity duration-500 ${
                  state === "todo" ? "opacity-40" : "opacity-100"
                }`}
              >
                <span
                  className={`flex size-8 shrink-0 items-center justify-center rounded-full ${
                    state === "done"
                      ? "bg-success/15 text-success"
                      : "bg-primary/10 text-primary"
                  }`}
                >
                  {state === "done" ? (
                    <Check size={16} />
                  ) : state === "active" ? (
                    <span className="loading loading-spinner loading-xs" />
                  ) : (
                    <Icon size={16} />
                  )}
                </span>
                <span
                  className={state === "active" ? "font-medium" : undefined}
                >
                  {label}
                </span>
              </li>
            );
          })}
        </ol>

        <div className="mt-6 rounded-xl bg-base-200 p-4">
          <p className="text-xs font-semibold text-base-content/60">
            Comment ça marche
          </p>
          <p
            key={tip}
            className="mt-1 text-sm text-base-content/80 motion-safe:animate-[demo-fade-in_400ms_ease-out]"
          >
            {tip}
          </p>
        </div>
      </div>
    </div>
  );
}
