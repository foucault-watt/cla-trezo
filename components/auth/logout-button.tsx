import { LogOut } from "lucide-react";
import { logoutAction } from "@/lib/auth/actions";

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <button type="submit" className="btn btn-ghost btn-sm w-full justify-start gap-2">
        <LogOut size={18} />
        Déconnexion
      </button>
    </form>
  );
}
