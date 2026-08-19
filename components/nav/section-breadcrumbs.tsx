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
  const current = items
    .filter(({ href }) => pathname === href || pathname.startsWith(`${href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0];

  return (
    <div className="breadcrumbs mb-4 text-sm">
      <ul>
        <li>{root}</li>
        {current && <li>{current.label}</li>}
      </ul>
    </div>
  );
}
