import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const COOKIE = "bc_session";
const ACCESS_COOKIE = "bc_access";
const SECRET = process.env.SESSION_SECRET ?? "dev-book-club-secret-change-me";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

// ── Shared access code gate (private to a group) ──
function accessToken(): string {
  const code = process.env.ACCESS_CODE ?? "";
  return createHmac("sha256", SECRET)
    .update(`access:${code}`)
    .digest("base64url");
}

/** True when an ACCESS_CODE is configured (gate active). */
export function accessRequired(): boolean {
  return !!process.env.ACCESS_CODE;
}

export async function setAccessGranted(): Promise<void> {
  const store = await cookies();
  store.set(ACCESS_COOKIE, accessToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 180, // 6 months
  });
}

/** Whether this browser has passed the access-code gate (or gate is off). */
export async function hasAccess(): Promise<boolean> {
  if (!accessRequired()) return true;
  const store = await cookies();
  return store.get(ACCESS_COOKIE)?.value === accessToken();
}

export function checkAccessCode(code: string): boolean {
  return accessRequired() && code === process.env.ACCESS_CODE;
}

function sign(userId: string): string {
  const sig = createHmac("sha256", SECRET).update(userId).digest("base64url");
  return `${userId}.${sig}`;
}

function verify(token: string | undefined): string | null {
  if (!token) return null;
  const dot = token.lastIndexOf(".");
  if (dot === -1) return null;
  const userId = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = createHmac("sha256", SECRET)
    .update(userId)
    .digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return userId;
}

export async function setSession(userId: string): Promise<void> {
  const store = await cookies();
  store.set(COOKIE, sign(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE);
}

/** The signed-in user id from the cookie, or null. Does not hit the DB. */
export async function getSessionUserId(): Promise<string | null> {
  const store = await cookies();
  return verify(store.get(COOKIE)?.value);
}

/** The signed-in user (DB lookup), or null. */
export async function getCurrentUser() {
  const userId = await getSessionUserId();
  if (!userId) return null;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  return user;
}
