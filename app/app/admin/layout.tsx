import type { Metadata } from "next";
import {
  Archive,
  Building2,
  FileCog,
  FlaskConical,
  HandCoins,
  LayoutDashboard,
  Receipt,
  Tags,
} from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";
import { BackToAppLink } from "@/components/nav/back-to-app-link";
import { SectionBreadcrumbs } from "@/components/nav/section-breadcrumbs";
import { SidebarDrawer } from "@/components/nav/sidebar-drawer";
import { requireAdmin } from "@/lib/auth/guards";

// Le loading.tsx du segment isole les pages du cookies() de requireAdmin() :
// sans ça, `next build` tente de les prérendre et interroge la base.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    default: "Administration",
    template: "%s · Admin · CLA Trézo",
  },
};

const navItems = [
  {
    href: "/app/admin",
    label: "Dashboard",
    icon: <LayoutDashboard size={18} />,
  },
  {
    href: "/app/admin/associations",
    label: "Assos",
    icon: <Building2 size={18} />,
  },
  {
    href: "/app/admin/notes-de-frais",
    label: "Notes de frais",
    icon: <Receipt size={18} />,
  },
  {
    href: "/app/admin/subventions",
    label: "Subventions",
    icon: <HandCoins size={18} />,
  },
  {
    href: "/app/admin/stockage",
    label: "Stockage",
    icon: <Archive size={18} />,
  },
  {
    href: "/app/admin/parametres-pdf",
    label: "Paramètres PDF",
    icon: <FileCog size={18} />,
  },
];

const devNavItems = [
  {
    href: "/app/admin/types-de-depense",
    label: "Types de dépense",
    icon: <Tags size={18} />,
  },
  {
    href: "/app/admin/developpement/pdf-lab",
    label: "Développement",
    icon: <FlaskConical size={18} />,
  },
];

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await requireAdmin();

  const footerSlot = (
    <div>
      <p className="px-2 pb-2 text-sm font-medium">
        {user.firstname} {user.lastname}
      </p>
      <BackToAppLink />
      <LogoutButton />
    </div>
  );

  return (
    <SidebarDrawer
      navItems={navItems}
      secondaryNavItems={devNavItems}
      secondaryLabel="Outils internes"
      rootLabel="Administration"
      footerSlot={footerSlot}
      edgeGlow
    >
      <SectionBreadcrumbs
        root="Administration"
        items={[...navItems, ...devNavItems]}
      />
      {children}
    </SidebarDrawer>
  );
}
