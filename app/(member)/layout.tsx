import Link from "next/link";
import { LayoutDashboard, Receipt, HandCoins } from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";
import { getSession } from "@/lib/session";

const navItems = [
  { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/factures", label: "Factures", icon: Receipt },
  { href: "/subventions", label: "Subventions", icon: HandCoins },
];

export default async function MemberLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();

  return (
    <div className="flex flex-1">
      <aside className="flex w-64 shrink-0 flex-col border-r border-base-200 p-4">
        <p className="mb-4 px-2 text-sm font-semibold text-base-content/70">
          Mon association
        </p>
        <ul className="menu w-full flex-1 gap-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <li key={href}>
              <Link href={href}>
                <Icon size={18} />
                {label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="border-t border-base-200 pt-2">
          {session.user && (
            <p className="px-2 pb-2 text-sm font-medium">
              {session.user.firstname} {session.user.lastname}
            </p>
          )}
          <LogoutButton />
        </div>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
