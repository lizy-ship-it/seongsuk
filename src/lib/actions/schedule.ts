"use server";

import { revalidatePath } from "next/cache";
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

/** Host adds candidate dates and opens voting (BOOK_SELECTION -> DATE_VOTING). */
export async function addCandidates(formData: FormData) {
  const meetingId = String(formData.get("meetingId"));
  await requireHost(meetingId);
  const dates = formData
    .getAll("dates")
    .map((d) => String(d).trim())
    .filter(Boolean);
  if (dates.length === 0) return;

  await prisma.$transaction([
    prisma.dateCandidate.createMany({
      data: dates.map((d) => ({
        meetingId,
        // datetime-local value -> Date; treat as local wall-clock.
        date: new Date(d),
      })),
    }),
    prisma.meeting.update({
      where: { id: meetingId },
      data: { status: "DATE_VOTING" },
    }),
  ]);
  revalidatePath("/schedule");
  revalidatePath("/");
}

/** Member (or host) submits their available dates (multi-select). */
export async function submitVote(formData: FormData) {
  const userId = await requireUserId();
  const meetingId = String(formData.get("meetingId"));
  const selected = formData.getAll("candidateIds").map(String);

  const meeting = await prisma.meeting.findUnique({
    where: { id: meetingId },
    select: { status: true, dateCandidates: { select: { id: true } } },
  });
  if (!meeting || meeting.status !== "DATE_VOTING") {
    revalidatePath("/schedule");
    return;
  }
  const validIds = new Set(meeting.dateCandidates.map((c) => c.id));
  const toInsert = selected.filter((id) => validIds.has(id));

  await prisma.$transaction([
    // Replace this user's votes for this meeting.
    prisma.dateVote.deleteMany({
      where: { userId, candidateId: { in: [...validIds] } },
    }),
    prisma.dateVote.createMany({
      data: toInsert.map((candidateId) => ({ candidateId, userId })),
    }),
  ]);
  revalidatePath("/schedule");
  revalidatePath("/");
}

/** Host confirms the final date and opens attendance re-check. */
export async function confirmDate(formData: FormData) {
  const meetingId = String(formData.get("meetingId"));
  await requireHost(meetingId);
  const candidateId = String(formData.get("candidateId"));

  const candidate = await prisma.dateCandidate.findUnique({
    where: { id: candidateId },
    include: { meeting: { select: { hostId: true } } },
  });
  // Stale UI (candidate removed) — refresh instead of crashing.
  if (!candidate || candidate.meetingId !== meetingId) {
    revalidatePath("/schedule");
    return;
  }

  // Seed attendance rows for all members so the re-check has a roster.
  const members = await prisma.user.findMany({ select: { id: true } });

  await prisma.$transaction([
    prisma.meeting.update({
      where: { id: meetingId },
      data: { status: "ATTENDANCE_CHECK", confirmedDate: candidate.date },
    }),
    prisma.attendance.createMany({
      data: members.map((m) => ({
        meetingId,
        userId: m.id,
        status: "NO_RESPONSE",
      })),
    }),
  ]);
  revalidatePath("/schedule");
  revalidatePath("/meeting");
  revalidatePath("/");
}
