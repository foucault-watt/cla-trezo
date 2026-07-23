import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeftRight, LayoutDashboard, Receipt, HandCoins } from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";
import { NavLink } from "@/components/nav/nav-link";
import { SectionBreadcrumbs } from "@/components/nav/section-breadcrumbs";
import { getSession } from "@/lib/session";

export default async function MemberLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ assoSlug: string }>;
}>) {
  const { assoSlug } = await params;
  const session = await getSession();
  const structure = session.user?.structures.find((s) => s.slug === assoSlug);

  if (!structure) {
    notFound();
  }

  const navItems = [
    {
      href: `/${assoSlug}/dashboard`,
      label: "Tableau de bord",
      icon: <LayoutDashboard size={18} />,
    },
    {
      href: `/${assoSlug}/factures`,
      label: "Factures",
      icon: <Receipt size={18} />,
    },
    {
      href: `/${assoSlug}/subventions`,
      label: "Subventions",
      icon: <HandCoins size={18} />,
    },
  ];

  return (
    <div className="flex flex-1">
      <aside className="flex w-64 shrink-0 flex-col border-r border-base-200 p-4">
        <p className="mb-4 truncate px-2 text-sm font-semibold text-base-content/70">
          {structure.name}
        </p>
        <ul className="menu w-full flex-1 gap-1">
          {navItems.map((item) => (
            <NavLink key={item.href} {...item} />
          ))}
        </ul>
        <div className="border-t border-base-200 pt-2">
          {session.user && session.user.structures.length > 1 && (
            <Link
              href="/"
              className="btn btn-ghost btn-sm w-full justify-start gap-2"
            >
              <ArrowLeftRight size={18} />
              Changer de structure
            </Link>
          )}
          {session.user && (
            <p className="px-2 pb-2 text-sm font-medium">
              {session.user.firstname} {session.user.lastname}
            </p>
          )}
          <LogoutButton />
        </div>
      </aside>
      <main className="flex-1 p-6">
        <SectionBreadcrumbs root={structure.name} items={navItems} />
        {children}
      </main>
    </div>
  );
}
