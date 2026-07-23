"use client";

import { usePathname } from "next/navigation";

export function SectionBreadcrumbs({
  root,
  items,
}: {
  root: string;
  items: { href: string; label: string }[];
}) {
  const pathname = usePathname();
  const current = items.find(
    ({ href }) => pathname === href || pathname.startsWith(`${href}/`)
  );

  return (
    <div className="breadcrumbs mb-4 text-sm">
      <ul>
        <li>{root}</li>
        {current && <li>{current.label}</li>}
      </ul>
    </div>
  );
}
