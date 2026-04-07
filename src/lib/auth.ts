import { getIronSession, IronSession, SessionOptions } from "iron-session";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";

export interface SessionData {
  isLoggedIn: boolean;
  user?: {
    id: string;
    name: string;
  };
}

const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: "planer_session",
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
};

export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}

export async function getSessionFromRequest(
  req: NextRequest
): Promise<IronSession<SessionData>> {
  const cookieStore = {
    get: (name: string) => {
      const value = req.cookies.get(name)?.value;
      return value ? { name, value } : undefined;
    },
    set: () => {}, // Read-only for session check
  };
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}

export async function verifyPassword(
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  // Support base64 encoded hash to avoid $ interpolation issues in env
  let hash = hashedPassword;
  if (hash.startsWith("base64:")) {
    hash = Buffer.from(hash.slice(7), "base64").toString("utf-8");
  }
  return bcrypt.compare(plainPassword, hash);
}

export async function hashPassword(plainPassword: string): Promise<string> {
  return bcrypt.hash(plainPassword, 12);
}

export async function requireAuth(): Promise<SessionData> {
  const session = await getSession();

  if (!session.isLoggedIn) {
    throw new Error("Unauthorized");
  }

  return session;
}
