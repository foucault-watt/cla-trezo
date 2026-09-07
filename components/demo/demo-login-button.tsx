import type { ReactNode } from "react";
import { demoLoginAction } from "@/lib/auth/actions";

export function DemoLoginButton({
  className = "btn btn-outline w-full max-w-xs h-10",
  icon,
}: {
  className?: string;
  icon?: ReactNode;
}) {
  return (
    <form action={demoLoginAction}>
      <button type="submit" className={className}>
        {icon}
        Démo
      </button>
    </form>
  );
}
