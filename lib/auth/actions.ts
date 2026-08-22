"use server";

import { redirect } from "next/navigation";
import { getDemoSession, getSession } from "@/lib/session";
import { provisionDemoFixtures } from "@/lib/auth/demo";
import { DEMO_ASSO_SLUG } from "@/lib/auth/demo-config";

export async function logoutAction() {
  const session = await getSession();
  session.destroy();
  redirect("/");
}

/**
 * Provisionne/reset les fixtures démo puis ouvre une session démo, sur un
 * cookie séparé de la vraie session (cf. lib/session.ts) — ne déconnecte
 * jamais un utilisateur réel déjà connecté.
 */
export async function demoLoginAction() {
  const demoUser = await provisionDemoFixtures();
  const demoSession = await getDemoSession();
  demoSession.user = demoUser;
  await demoSession.save();
  redirect(`/app/${DEMO_ASSO_SLUG}`);
}

export async function demoLogoutAction() {
  const demoSession = await getDemoSession();
  demoSession.destroy();

  const session = await getSession();
  redirect(session.user ? (session.user.isAdmin ? "/app/admin" : "/app") : "/");
}
