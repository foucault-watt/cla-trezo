import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeftRight, LayoutDashboard, Receipt, HandCoins } from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";
import { SectionBreadcrumbs } from "@/components/nav/section-breadcrumbs";
import { SidebarDrawer } from "@/components/nav/sidebar-drawer";
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

  const footerSlot = (
    <div>
      {session.user && session.user.structures.length > 1 && (
        <Link href="/" className="btn btn-ghost btn-sm w-full justify-start gap-2">
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
  );

  return (
    <SidebarDrawer navItems={navItems} rootLabel={structure.name} footerSlot={footerSlot}>
      <SectionBreadcrumbs root={structure.name} items={navItems} />
      {children}
    </SidebarDrawer>
  );
}
