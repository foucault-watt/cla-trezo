import { Sparkles } from "lucide-react";
import { DemoLogoutButton } from "@/components/demo/demo-logout-button";

export function DemoModeBanner() {
  return (
    <div
      role="status"
      className="alert alert-info alert-soft mb-4 flex flex-wrap items-center justify-between gap-3"
    >
      <span className="flex items-center gap-2">
        <Sparkles size={18} className="shrink-0" />
        Vous explorez Trézo avec des données fictives.
      </span>
      <DemoLogoutButton />
    </div>
  );
}
