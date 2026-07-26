import Link from "next/link";
import { ArrowLeftRight, Building2, Receipt, HandCoins, FileText } from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";
import { SectionBreadcrumbs } from "@/components/nav/section-breadcrumbs";
import { SidebarDrawer } from "@/components/nav/sidebar-drawer";
import { requireAdmin } from "@/lib/auth/guards";

const navItems = [
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
      <Link href="/app" className="btn btn-ghost btn-sm w-full justify-start gap-2">
        <ArrowLeftRight size={18} />
        Mode application
      </Link>
      <LogoutButton />
    </div>
  );

  return (
    <SidebarDrawer
      navItems={navItems}
      rootLabel="Administration"
      footerSlot={footerSlot}
    >
      <SectionBreadcrumbs root="Administration" items={navItems} />
      {children}
    </SidebarDrawer>
  );
}
