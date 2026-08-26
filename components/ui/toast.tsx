"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, CircleAlert, Info, TriangleAlert, X } from "lucide-react";

export type ToastType = "success" | "error" | "info" | "warning";

export type ToastInput = {
  type: ToastType;
  message: string;
  /** 0 = ne disparaît jamais tout seul. Défaut selon le type (voir DEFAULT_DURATION_MS). */
  durationMs?: number;
};

type ToastEntry = ToastInput & { id: string };

const DEFAULT_DURATION_MS: Record<ToastType, number> = {
  success: 4000,
  info: 4000,
  warning: 5000,
  error: 6000,
};

const TOAST_ICON: Record<ToastType, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: CircleAlert,
  warning: TriangleAlert,
  info: Info,
};

const ALERT_CLASS: Record<ToastType, string> = {
  success: "alert-success",
  error: "alert-error",
  warning: "alert-warning",
  info: "alert-info",
};

type ToastContextValue = {
  push: (input: ToastInput) => string;
  dismiss: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

/**
 * Fournisseur global des toasts, monté une seule fois dans app/layout.tsx.
 * Voir docs/agents/toasts.md pour l'usage complet (types, persistance après
 * une redirection côté serveur, etc.).
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: string) => {
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback(
    (input: ToastInput) => {
      const id = crypto.randomUUID();
      setToasts((current) => [...current, { ...input, id }]);
      const durationMs = input.durationMs ?? DEFAULT_DURATION_MS[input.type];
      if (durationMs > 0) {
        timers.current.set(
          id,
          setTimeout(() => dismiss(id), durationMs),
        );
      }
      return id;
    },
    [dismiss],
  );

  const value = useMemo(() => ({ push, dismiss }), [push, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast doit être utilisé sous ToastProvider.");
  }
  return context;
}

function subscribeNever() {
  return () => {};
}
function getClientSnapshot() {
  return true;
}
function getServerSnapshot() {
  return false;
}

/**
 * Rendu via un portail dans document.body, comme Modal (cf. components/ui/modal.tsx)
 * — évite qu'un toast déclenché depuis l'intérieur d'un <form> ne se retrouve
 * imbriqué dans ce <form>. Position bottom-end de daisyUI (`.toast`), déjà
 * responsive nativement : max-width: calc(100vw - 2rem), donc jamais de
 * débordement horizontal sur petit écran.
 */
function ToastViewport({
  toasts,
  onDismiss,
}: {
  toasts: ToastEntry[];
  onDismiss: (id: string) => void;
}) {
  const mounted = useSyncExternalStore(
    subscribeNever,
    getClientSnapshot,
    getServerSnapshot,
  );

  if (!mounted || toasts.length === 0) return null;

  return createPortal(
    <div className="toast toast-end toast-bottom z-[100]">
      {toasts.map((toast) => {
        const Icon = TOAST_ICON[toast.type];
        return (
          <div
            key={toast.id}
            role="alert"
            className={`alert ${ALERT_CLASS[toast.type]} alert-soft shadow-lg`}
          >
            <Icon size={18} aria-hidden="true" />
            <span>{toast.message}</span>
            <button
              type="button"
              className="btn btn-ghost btn-xs btn-circle"
              aria-label="Fermer"
              onClick={() => onDismiss(toast.id)}
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>,
    document.body,
  );
}
