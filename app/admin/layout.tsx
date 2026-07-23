import { Building2, Receipt, HandCoins, FileText } from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";
import { NavLink } from "@/components/nav/nav-link";
import { SectionBreadcrumbs } from "@/components/nav/section-breadcrumbs";
import { getSession } from "@/lib/session";

const navItems = [
  { href: "/associations", label: "Associations", icon: <Building2 size={18} /> },
  { href: "/factures", label: "Factures", icon: <Receipt size={18} /> },
  { href: "/subventions", label: "Subventions", icon: <HandCoins size={18} /> },
  { href: "/rapports", label: "Rapports", icon: <FileText size={18} /> },
];

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();

  return (
    <div className="flex flex-1">
      <aside className="flex w-64 shrink-0 flex-col border-r border-base-200 p-4">
        <p className="mb-4 px-2 text-sm font-semibold text-base-content/70">
          Administration
        </p>
        <ul className="menu w-full flex-1 gap-1">
          {navItems.map((item) => (
            <NavLink key={item.href} {...item} />
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
      <main className="flex-1 p-6">
        <SectionBreadcrumbs root="Administration" items={navItems} />
        {children}
      </main>
    </div>
  );
}
