"use client";

import { useState } from "react";

/**
 * Ouverture indépendante de chaque groupe d'un accordéon DaisyUI (checkbox,
 * pas radio) : le premier groupe est ouvert par défaut, mais cliquer sur un
 * groupe ne referme pas les autres.
 */
export function useOpenGroups(groups: { key: string }[]) {
  const [openKeys, setOpenKeys] = useState<Set<string>>(
    new Set(groups.length > 0 ? [groups[0].key] : []),
  );

  function toggle(key: string) {
    setOpenKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return { openKeys, toggle };
}
