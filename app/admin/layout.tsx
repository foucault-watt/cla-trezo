import Link from "next/link";
import { Building2, Receipt, HandCoins, FileText } from "lucide-react";

const navItems = [
  { href: "/associations", label: "Associations", icon: Building2 },
  { href: "/factures", label: "Factures", icon: Receipt },
  { href: "/subventions", label: "Subventions", icon: HandCoins },
  { href: "/rapports", label: "Rapports", icon: FileText },
];

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-1">
      <aside className="w-64 shrink-0 border-r border-base-200 p-4">
        <p className="mb-4 px-2 text-sm font-semibold text-base-content/70">
          Administration
        </p>
        <ul className="menu w-full gap-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <li key={href}>
              <Link href={href}>
                <Icon size={18} />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
