import type { ReactNode } from "react";

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-box border border-dashed border-base-300 bg-base-100 px-6 py-12 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        {icon}
      </div>
      <h2 className="font-semibold">{title}</h2>
      <p className="max-w-sm text-sm text-base-content/70">{description}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
