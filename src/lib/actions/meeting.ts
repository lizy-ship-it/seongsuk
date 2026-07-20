"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";

async function requireUserId(): Promise<string> {
  const userId = await getSessionUserId();
  if (!userId) throw new Error("Unauthorized");
  return userId;
}

async function requireHost(meetingId: string): Promise<string> {
  const userId = await requireUserId();
  const meeting = await prisma.meeting.findUnique({
    where: { id: meetingId },
    select: { hostId: true },
  });
  if (!meeting || meeting.hostId !== userId) throw new Error("Host only");
  return userId;
}

function revalidateAll() {
  revalidatePath("/");
  revalidatePath("/meeting");
  revalidatePath("/schedule");
}

/** Host registers this month's book. */
export async function setBook(formData: FormData) {
  const meetingId = String(formData.get("meetingId"));
  await requireHost(meetingId);
  const title = String(formData.get("title") ?? "").trim();
  const author = String(formData.get("author") ?? "").trim();
  const coverUrl = String(formData.get("coverUrl") ?? "").trim() || null;
  if (!title) return;

  await prisma.book.upsert({
    where: { meetingId },
    create: { meetingId, title, author, coverUrl },
    update: { title, author, coverUrl },
  });
  revalidateAll();
}

/** Member/host answers the final attendance re-check. */
export async function respondAttendance(formData: FormData) {
  const userId = await requireUserId();
  const meetingId = String(formData.get("meetingId"));
  const status = String(formData.get("status"));
  if (!["ATTENDING", "NOT_ATTENDING"].includes(status)) return;

  const meeting = await prisma.meeting.findUnique({
    where: { id: meetingId },
    select: { status: true },
  });
  if (!meeting || meeting.status !== "ATTENDANCE_CHECK") {
    revalidateAll();
    return;
  }

  await prisma.attendance.upsert({
    where: { meetingId_userId: { meetingId, userId } },
    create: { meetingId, userId, status },
    update: { status },
  });
  revalidateAll();
}

/** Host saves the venue. `confirm` locks it and advances to PLACE_CONFIRMED. */
export async function savePlace(formData: FormData) {
  const meetingId = String(formData.get("meetingId"));
  await requireHost(meetingId);
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  const address = String(formData.get("address") ?? "").trim() || null;
  const link = String(formData.get("link") ?? "").trim() || null;
  const note = String(formData.get("note") ?? "").trim() || null;
  const costRaw = String(formData.get("cost") ?? "").trim();
  const cost = costRaw ? parseInt(costRaw.replace(/[^0-9]/g, ""), 10) : null;
  const datetimeRaw = String(formData.get("datetime") ?? "").trim();
  const datetime = datetimeRaw ? new Date(datetimeRaw) : null;
  const confirm = formData.get("confirm") != null;

  await prisma.place.upsert({
    where: { meetingId },
    create: { meetingId, name, address, link, note, cost, datetime, reserved: confirm },
    update: { name, address, link, note, cost, datetime, reserved: confirm },
  });

  if (confirm) {
    await prisma.meeting.update({
      where: { id: meetingId },
      data: { status: "PLACE_CONFIRMED" },
    });
  }
  revalidateAll();
}

/** Host replaces the discussion questions (one per non-empty line/field). */
export async function saveQuestions(formData: FormData) {
  const meetingId = String(formData.get("meetingId"));
  await requireHost(meetingId);
  const questions = formData
    .getAll("questions")
    .map((q) => String(q).trim())
    .filter(Boolean);

  await prisma.$transaction([
    prisma.discussionQuestion.deleteMany({ where: { meetingId } }),
    prisma.discussionQuestion.createMany({
      data: questions.map((content, i) => ({
        meetingId,
        order: i + 1,
        content,
      })),
    }),
  ]);
  revalidateAll();
}

/** Host marks the meeting ready — the final notice is complete. */
export async function markReady(formData: FormData) {
  const meetingId = String(formData.get("meetingId"));
  await requireHost(meetingId);
  await prisma.meeting.update({
    where: { id: meetingId },
    data: { status: "READY" },
  });
  revalidateAll();
}

/**
 * Open next month's cycle (host unclaimed). Any member can start it once the
 * current meeting is complete; whoever claims it first becomes next host.
 */
export async function startNextMeeting(formData: FormData) {
  await requireUserId();
  const meetingId = String(formData.get("meetingId"));
  const cur = await prisma.meeting.findUnique({
    where: { id: meetingId },
    select: { year: true, month: true, status: true },
  });
  if (!cur || cur.status !== "COMPLETE") return;

  let year = cur.year;
  let month = cur.month + 1;
  if (month > 12) {
    month = 1;
    year += 1;
  }

  const existing = await prisma.meeting.findFirst({ where: { year, month } });
  if (!existing) {
    await prisma.meeting.create({
      data: { year, month, status: "BOOK_SELECTION" },
    });
  }
  revalidatePath("/");
  revalidatePath("/meeting");
  redirect("/");
}

/** Host completes the meeting, unlocking reviews, then opens the review form. */
export async function completeMeeting(formData: FormData) {
  const meetingId = String(formData.get("meetingId"));
  await requireHost(meetingId);
  await prisma.meeting.update({
    where: { id: meetingId },
    data: { status: "COMPLETE" },
  });
  revalidateAll();
  revalidatePath("/archive");
  // Take the host straight to writing their review.
  redirect(`/archive/${meetingId}#review`);
}
