import { redirect } from "next/navigation";
import { getClaLoginUrl } from "@/lib/auth/cla";
import { isDevAuthBypassEnabled } from "@/lib/auth/dev-config";

export async function GET() {
  if (isDevAuthBypassEnabled()) {
    redirect("/api/auth/dev-login");
  }

  redirect(getClaLoginUrl());
}
