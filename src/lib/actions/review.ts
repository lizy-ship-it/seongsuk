"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";

/** Submit or update this user's rating + one-line review (PRD §13). */
export async function submitReview(formData: FormData) {
  const userId = await getSessionUserId();
  if (!userId) throw new Error("Unauthorized");

  const meetingId = String(formData.get("meetingId"));
  const rating = Math.max(
    1,
    Math.min(5, parseInt(String(formData.get("rating") ?? "0"), 10) || 0),
  );
  const comment = String(formData.get("comment") ?? "").trim();
  const readBook = formData.get("readBook") != null;
  const attended = formData.get("attended") != null;
  const snsConsent = formData.get("snsConsent") != null;

  if (rating < 1 || !comment) return;

  const meeting = await prisma.meeting.findUnique({
    where: { id: meetingId },
    select: { status: true },
  });
  if (!meeting || meeting.status !== "COMPLETE") {
    revalidatePath(`/archive/${meetingId}`);
    return;
  }

  await prisma.review.upsert({
    where: { meetingId_userId: { meetingId, userId } },
    create: { meetingId, userId, rating, comment, readBook, attended, snsConsent },
    update: { rating, comment, readBook, attended, snsConsent },
  });
  revalidatePath(`/archive/${meetingId}`);
  revalidatePath("/archive");
  revalidatePath("/");
}
