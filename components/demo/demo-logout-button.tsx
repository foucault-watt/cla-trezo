import type { ReactNode } from "react";
import { demoLogoutAction } from "@/lib/auth/actions";

export function DemoLogoutButton({
  className = "btn btn-sm btn-ghost",
  icon,
}: {
  className?: string;
  icon?: ReactNode;
}) {
  return (
    <form action={demoLogoutAction}>
      <button type="submit" className={className}>
        {icon}
        Quitter le mode démo
      </button>
    </form>
  );
}
