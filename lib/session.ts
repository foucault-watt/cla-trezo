import { cookies } from "next/headers";
import {
  getIronSession,
  type IronSession,
  type SessionOptions,
} from "iron-session";

export type SessionStructure = {
  assoId: string;
  slug: string;
  name: string;
  role: string;
};

export type SessionUser = {
  id: string;
  username: string;
  firstname: string;
  lastname: string;
  isAdmin: boolean;
  structures: SessionStructure[];
  // Présent et à true uniquement pour la session du mode démo (cf.
  // lib/auth/demo.ts) — jamais pour une vraie session CLA.
  isDemo?: boolean;
};

export type SessionData = {
  user?: SessionUser;
};

const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret || sessionSecret.length < 32) {
  throw new Error(
    "SESSION_SECRET manquant ou trop court (32 caractères minimum) : voir .env.example",
  );
}

const baseCookieOptions = {
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
};

export const sessionOptions: SessionOptions = {
  cookieName: "cla_trezo_session",
  password: sessionSecret,
  cookieOptions: {
    ...baseCookieOptions,
    maxAge: 60 * 60 * 24 * 30, // 30 jours
  },
};

export async function getSession(): Promise<IronSession<SessionData>> {
  return getIronSession<SessionData>(await cookies(), sessionOptions);
}

// Cookie séparé du vrai `cla_trezo_session` : le mode démo (cf.
// lib/auth/demo.ts) coexiste avec une vraie session sans la remplacer, par
// exemple un vrai utilisateur qui ouvre la démo dans un nouvel onglet.
export const demoSessionOptions: SessionOptions = {
  cookieName: "cla_trezo_demo_session",
  password: sessionSecret,
  cookieOptions: {
    ...baseCookieOptions,
    maxAge: 60 * 60 * 4, // 4 heures : volontairement court, session jetable
  },
};

export async function getDemoSession(): Promise<IronSession<SessionData>> {
  return getIronSession<SessionData>(await cookies(), demoSessionOptions);
}
