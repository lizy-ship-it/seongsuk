import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, Eyebrow } from "@/components/ui";
import {
  AttendanceByMember,
  type AttendanceMeeting,
} from "@/components/AttendanceByMember";

export default async function AttendancePage() {
  const members = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true },
  });

  const meetings = await prisma.meeting.findMany({
    where: { status: "COMPLETE" },
    orderBy: [{ year: "desc" }, { month: "desc" }],
    include: {
      book: { select: { title: true } },
      attendances: { select: { userId: true, status: true } },
    },
  });

  const data: AttendanceMeeting[] = meetings.map((m) => ({
    id: m.id,
    label: `${m.year}년 ${m.month}월`,
    bookTitle: m.book?.title ?? null,
    statuses: Object.fromEntries(
      m.attendances.map((a) => [a.userId, a.status]),
    ),
  }));

  return (
    <div className="space-y-6">
      <Link href="/archive" className="text-sm text-muted hover:text-ink">
        ← 아카이브
      </Link>

      <header>
        <Eyebrow>Attendance</Eyebrow>
        <h1 className="font-display text-3xl mt-2">참석 현황</h1>
        <p className="text-muted text-sm mt-2">
          멤버를 선택하면 매달 참석 기록을 볼 수 있어요.
        </p>
      </header>

      <Card>
        <AttendanceByMember members={members} meetings={data} />
      </Card>
    </div>
  );
}
