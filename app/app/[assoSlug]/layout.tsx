import Link from "next/link";
import { ArrowLeftRight, LayoutDashboard, Receipt, HandCoins } from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";
import { SectionBreadcrumbs } from "@/components/nav/section-breadcrumbs";
import { SidebarDrawer } from "@/components/nav/sidebar-drawer";
import { requireStructureAccess } from "@/lib/auth/guards";

export default async function MemberLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ assoSlug: string }>;
}>) {
  const { assoSlug } = await params;
  const { structure, user } = await requireStructureAccess(assoSlug);

  const navItems = [
    {
      href: `/app/${assoSlug}`,
      label: "Tableau de bord",
      icon: <LayoutDashboard size={18} />,
    },
    {
      href: `/app/${assoSlug}/factures`,
      label: "Factures",
      icon: <Receipt size={18} />,
    },
    {
      href: `/app/${assoSlug}/subventions`,
      label: "Subventions",
      icon: <HandCoins size={18} />,
    },
  ];

  const footerSlot = (
    <div>
      {user.structures.length > 1 && (
        <Link href="/app" className="btn btn-ghost btn-sm w-full justify-start gap-2">
          <ArrowLeftRight size={18} />
          Changer de structure
        </Link>
      )}
      <p className="px-2 pb-2 text-sm font-medium">
        {user.firstname} {user.lastname}
      </p>
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
