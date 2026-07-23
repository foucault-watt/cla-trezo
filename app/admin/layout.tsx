import { Building2, Receipt, HandCoins, FileText } from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";
import { SectionBreadcrumbs } from "@/components/nav/section-breadcrumbs";
import { SidebarDrawer } from "@/components/nav/sidebar-drawer";
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

  const footerSlot = (
    <div>
      {session.user && (
        <p className="px-2 pb-2 text-sm font-medium">
          {session.user.firstname} {session.user.lastname}
        </p>
      )}
      <LogoutButton />
    </div>
  );

  return (
    <SidebarDrawer navItems={navItems} rootLabel="Administration" footerSlot={footerSlot}>
      <SectionBreadcrumbs root="Administration" items={navItems} />
      {children}
    </SidebarDrawer>
  );
}
