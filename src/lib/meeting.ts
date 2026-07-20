import { prisma } from "@/lib/prisma";

/** Full meeting payload used across HOME / SCHEDULE / MEETING pages. */
export function meetingInclude() {
  return {
    host: true,
    hostChangeRequestedBy: true,
    book: true,
    place: true,
    dateCandidates: {
      include: { votes: { include: { user: true } } },
      orderBy: { date: "asc" as const },
    },
    attendances: { include: { user: true } },
    discussionQuestions: { orderBy: { order: "asc" as const } },
    reviews: { include: { user: true }, orderBy: { createdAt: "asc" as const } },
  };
}

/** The current (most recent) meeting cycle, or null if none exists yet. */
export async function getCurrentMeeting() {
  return prisma.meeting.findFirst({
    orderBy: [{ year: "desc" }, { month: "desc" }],
    include: meetingInclude(),
  });
}

export async function getMeetingById(id: string) {
  return prisma.meeting.findUnique({
    where: { id },
    include: meetingInclude(),
  });
}

export type FullMeeting = NonNullable<Awaited<ReturnType<typeof getMeetingById>>>;

/** Average rating across a meeting's reviews (null if none). */
export function averageRating(
  reviews: { rating: number }[],
): number | null {
  if (reviews.length === 0) return null;
  const sum = reviews.reduce((a, r) => a + r.rating, 0);
  return Math.round((sum / reviews.length) * 10) / 10;
}

/** Attendance tally for the re-confirmation step. */
export function attendanceTally(
  attendances: { status: string }[],
): { attending: number; notAttending: number; noResponse: number } {
  return {
    attending: attendances.filter((a) => a.status === "ATTENDING").length,
    notAttending: attendances.filter((a) => a.status === "NOT_ATTENDING").length,
    noResponse: attendances.filter((a) => a.status === "NO_RESPONSE").length,
  };
}
