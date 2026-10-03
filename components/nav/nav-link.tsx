"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { NAV_DRAWER_ID } from "./nav-drawer-id";

// On mobile the sidebar is a daisyUI drawer driven by a checkbox: uncheck it
// so the drawer closes once a tab is picked. No-op at lg+ (drawer-open).
function closeNavDrawer() {
  const toggle = document.getElementById(NAV_DRAWER_ID);
  if (toggle instanceof HTMLInputElement) toggle.checked = false;
}

export function NavLink({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: ReactNode;
}) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <li>
      <Link
        href={href}
        className={isActive ? "menu-active" : undefined}
        onClick={closeNavDrawer}
      >
        {icon}
        {label}
      </Link>
    </li>
  );
}
