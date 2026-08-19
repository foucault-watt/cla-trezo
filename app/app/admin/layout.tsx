import {
  Building2,
  FileCog,
  FileText,
  FlaskConical,
  HandCoins,
  LayoutDashboard,
  Receipt,
} from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";
import { BackToAppLink } from "@/components/nav/back-to-app-link";
import { SectionBreadcrumbs } from "@/components/nav/section-breadcrumbs";
import { SidebarDrawer } from "@/components/nav/sidebar-drawer";
import { requireAdmin } from "@/lib/auth/guards";

const navItems = [
  {
    href: "/app/admin",
    label: "Tableau de bord",
    icon: <LayoutDashboard size={18} />,
  },
  {
    href: "/app/admin/associations",
    label: "Associations",
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
    href: "/app/admin/rapports",
    label: "Rapports",
    icon: <FileText size={18} />,
  },
  {
    href: "/app/admin/parametres-pdf",
    label: "Paramètres PDF",
    icon: <FileCog size={18} />,
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
      rootLabel="Administration"
      footerSlot={footerSlot}
      edgeGlow
    >
      <SectionBreadcrumbs root="Administration" items={navItems} />
      {children}
    </SidebarDrawer>
  );
}
