"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";

async function requireUserId(): Promise<string> {
  const userId = await getSessionUserId();
  if (!userId) throw new Error("Unauthorized");
  return userId;
}

function revalidate() {
  revalidatePath("/");
  revalidatePath("/meeting");
  revalidatePath("/schedule");
}

/** Claim an open host slot (first-come, single host). No-op if already taken. */
export async function claimHost(formData: FormData) {
  const userId = await requireUserId();
  const meetingId = String(formData.get("meetingId"));
  await prisma.meeting.updateMany({
    where: { id: meetingId, hostId: null },
    data: { hostId: userId },
  });
  revalidate();
}

/** Current host steps down; the slot re-opens for anyone to claim. */
export async function releaseHost(formData: FormData) {
  const userId = await requireUserId();
  const meetingId = String(formData.get("meetingId"));
  await prisma.meeting.updateMany({
    where: { id: meetingId, hostId: userId },
    data: { hostId: null, hostChangeRequestedById: null },
  });
  revalidate();
}

/** A non-host asks to take over; the current host must approve. */
export async function requestHostChange(formData: FormData) {
  const userId = await requireUserId();
  const meetingId = String(formData.get("meetingId"));
  const meeting = await prisma.meeting.findUnique({
    where: { id: meetingId },
    select: { hostId: true },
  });
  if (!meeting?.hostId || meeting.hostId === userId) return;
  await prisma.meeting.update({
    where: { id: meetingId },
    data: { hostChangeRequestedById: userId },
  });
  revalidate();
}

export async function cancelHostRequest(formData: FormData) {
  const userId = await requireUserId();
  const meetingId = String(formData.get("meetingId"));
  await prisma.meeting.updateMany({
    where: { id: meetingId, hostChangeRequestedById: userId },
    data: { hostChangeRequestedById: null },
  });
  revalidate();
}

/** Host hands the role to the requester. */
export async function grantHostChange(formData: FormData) {
  const userId = await requireUserId();
  const meetingId = String(formData.get("meetingId"));
  const meeting = await prisma.meeting.findUnique({
    where: { id: meetingId },
    select: { hostId: true, hostChangeRequestedById: true },
  });
  if (!meeting || meeting.hostId !== userId || !meeting.hostChangeRequestedById) {
    return;
  }
  await prisma.meeting.update({
    where: { id: meetingId },
    data: {
      hostId: meeting.hostChangeRequestedById,
      hostChangeRequestedById: null,
    },
  });
  revalidate();
}

/** Host declines the takeover request. */
export async function declineHostChange(formData: FormData) {
  const userId = await requireUserId();
  const meetingId = String(formData.get("meetingId"));
  await prisma.meeting.updateMany({
    where: { id: meetingId, hostId: userId },
    data: { hostChangeRequestedById: null },
  });
  revalidate();
}
