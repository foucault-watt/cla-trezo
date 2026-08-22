import Link from "next/link";
import {
  ArrowLeftRight,
  LayoutDashboard,
  LogOut,
  Receipt,
  HandCoins,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";
import { DemoLoginButton } from "@/components/demo/demo-login-button";
import { DemoLogoutButton } from "@/components/demo/demo-logout-button";
import { DemoModeBanner } from "@/components/demo/demo-mode-banner";
import { LastStructureTracker } from "@/components/nav/last-structure-tracker";
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
      label: "Dashboard",
      icon: <LayoutDashboard size={18} />,
    },
    {
      href: `/app/${assoSlug}/notes-de-frais`,
      label: "Notes de frais",
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
      <p className="px-2 pb-2 text-sm font-medium">
        {user.firstname} {user.lastname}
      </p>
      {!user.isDemo && user.structures.length > 1 && (
        <Link
          href="/app"
          className="btn btn-ghost btn-sm w-full justify-start gap-2"
        >
          <ArrowLeftRight size={18} />
          Changer d&apos;Asso
        </Link>
      )}
      {!user.isDemo && user.isAdmin && (
        <Link
          href="/app/admin"
          className="btn btn-ghost btn-sm w-full justify-start gap-2"
        >
          <ShieldCheck size={18} />
          Vue admin
        </Link>
      )}
      {user.isDemo ? (
        <DemoLogoutButton
          className="btn btn-ghost btn-sm w-full justify-start gap-2"
          icon={<LogOut size={18} />}
        />
      ) : (
        <>
          <DemoLoginButton
            className="btn btn-ghost btn-sm w-full justify-start gap-2"
            icon={<Sparkles size={18} />}
          />
          <LogoutButton />
        </>
      )}
    </div>
  );

  return (
    <SidebarDrawer
      navItems={navItems}
      rootLabel={structure.name}
      footerSlot={footerSlot}
    >
      {!user.isDemo && <LastStructureTracker assoSlug={assoSlug} />}
      {user.isDemo && <DemoModeBanner />}
      <SectionBreadcrumbs root={structure.name} items={navItems} />
      {children}
    </SidebarDrawer>
  );
}
