import { cookies } from "next/headers";
import { getIronSession, type IronSession, type SessionOptions } from "iron-session";

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

export const sessionOptions: SessionOptions = {
  cookieName: "cla_trezo_session",
  password: sessionSecret,
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 jours
  },
};

export async function getSession(): Promise<IronSession<SessionData>> {
  return getIronSession<SessionData>(await cookies(), sessionOptions);
}
