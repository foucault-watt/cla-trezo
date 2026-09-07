import { Menu } from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { NavLink } from "./nav-link";

type SidebarDrawerNavItem = {
  href: string;
  label: string;
  icon: ReactNode;
};

// Sidebar fixed at lg+, collapses behind a hamburger drawer below that.
// Shared by the admin and member layouts so both sections of the app
// behave the same way on mobile.
export function SidebarDrawer({
  navItems,
  secondaryNavItems,
  secondaryLabel,
  rootLabel,
  footerSlot,
  children,
  edgeGlow = false,
}: {
  navItems: SidebarDrawerNavItem[];
  secondaryNavItems?: SidebarDrawerNavItem[];
  secondaryLabel?: string;
  rootLabel: string;
  footerSlot: ReactNode;
  children: ReactNode;
  edgeGlow?: boolean;
}) {
  return (
    <div className="drawer lg:drawer-open flex-1">
      {edgeGlow && (
        <div className="admin-edge-glow pointer-events-none fixed inset-0 z-50" aria-hidden="true" />
      )}
      <input id="app-nav-drawer" type="checkbox" className="drawer-toggle" />
      <div className="drawer-content flex flex-1 flex-col bg-base-200">
        <div className="flex items-center gap-2 border-b border-base-300 bg-base-100 p-3 lg:hidden">
          <label
            htmlFor="app-nav-drawer"
            aria-label="Ouvrir le menu"
            className="btn btn-square btn-ghost btn-sm drawer-button"
          >
            <Menu size={18} />
          </label>
          <Image src="/logo.png" alt="" width={24} height={24} className="rounded-sm" />
          <span className="flex-1 font-semibold">{rootLabel}</span>
          <ThemeToggle />
        </div>
        <main className="flex-1 p-6">{children}</main>
      </div>
      <div className="drawer-side z-40">
        <label htmlFor="app-nav-drawer" aria-label="Fermer le menu" className="drawer-overlay" />
        <aside className="flex h-full w-64 flex-col border-r border-base-300 bg-base-100 p-4">
          <div className="mb-4 flex items-center justify-between px-2">
            <div className="flex min-w-0 items-center gap-2">
              <Image src="/logo.png" alt="" width={28} height={28} className="shrink-0 rounded-sm" />
              <p className="truncate text-sm font-semibold text-base-content/70">{rootLabel}</p>
            </div>
            <div className="hidden lg:block">
              <ThemeToggle />
            </div>
          </div>
          <ul className="menu w-full flex-1 gap-1">
            {navItems.map((item) => (
              <NavLink key={item.href} {...item} />
            ))}
          </ul>
          {secondaryNavItems && secondaryNavItems.length > 0 && (
            <ul className="menu w-full gap-1 border-t border-base-200 pt-2">
              {secondaryLabel && <li className="menu-title">{secondaryLabel}</li>}
              {secondaryNavItems.map((item) => (
                <NavLink key={item.href} {...item} />
              ))}
            </ul>
          )}
          <div className="border-t border-base-200 pt-2">{footerSlot}</div>
        </aside>
      </div>
    </div>
  );
}
