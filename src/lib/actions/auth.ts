"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentMeeting } from "@/lib/meeting";
import {
  setSession,
  clearSession,
  setAccessGranted,
  checkAccessCode,
} from "@/lib/session";

/** Gate: verify the shared group access code before member selection. */
export async function submitAccessCode(formData: FormData) {
  const code = String(formData.get("code") ?? "").trim();
  if (checkAccessCode(code)) {
    await setAccessGranted();
    redirect("/login");
  }
  redirect("/login?codeerr=1");
}

/** Invite-style login: pick your member identity (no password for MVP). */
export async function login(formData: FormData) {
  const userId = String(formData.get("userId") ?? "");
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    redirect("/login?error=notfound");
  }
  await setSession(user.id);
  redirect("/");
}

/**
 * Enter as a chosen identity + role. Choosing "host" claims this month's
 * open host slot (first-come, single host); ignored if already taken.
 */
export async function enter(formData: FormData) {
  const userId = String(formData.get("userId") ?? "");
  const role = String(formData.get("role") ?? "member");
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) redirect("/login?error=notfound");

  if (role === "host") {
    const meeting = await getCurrentMeeting();
    if (meeting && meeting.hostId == null) {
      await prisma.meeting.updateMany({
        where: { id: meeting.id, hostId: null },
        data: { hostId: userId },
      });
    }
  }
  await setSession(userId);
  redirect("/");
}

export async function logout() {
  await clearSession();
  redirect("/login");
}
