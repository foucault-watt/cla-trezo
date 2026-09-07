import type { AssoOverview } from "@/lib/admin/associations";
import type { SessionStructure } from "@/lib/session";

export type MemberAssoCard = SessionStructure & {
  overview: AssoOverview | null;
};
