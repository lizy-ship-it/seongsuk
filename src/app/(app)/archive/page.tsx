import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { averageRating } from "@/lib/meeting";
import { formatMonthLabel } from "@/lib/format";
import { BookCover, Card, Eyebrow, Stars } from "@/components/ui";

export default async function ArchivePage() {
  const meetings = await prisma.meeting.findMany({
    where: { status: "COMPLETE" },
    orderBy: [{ year: "desc" }, { month: "desc" }],
    include: {
      host: true,
      book: true,
      reviews: { select: { rating: true } },
      attendances: { where: { status: "ATTENDING" }, select: { id: true } },
    },
  });

  return (
    <div className="space-y-8">
      <header>
        <Eyebrow>Archive</Eyebrow>
        <h1 className="font-display text-3xl mt-2">지난 독서모임</h1>
        <p className="text-muted text-sm mt-2">
          우리가 함께 읽은 책과 기록이 쌓입니다.
        </p>
        <Link
          href="/archive/attendance"
          className="mt-3 inline-flex items-center rounded-full bg-ink px-4 py-2 text-sm font-semibold text-surface"
        >
          인원별 참석 현황 →
        </Link>
      </header>

      {meetings.length === 0 ? (
        <Card>
          <p className="text-muted text-sm">아직 완료된 모임이 없어요.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {meetings.map((m) => {
            const avg = averageRating(m.reviews);
            return (
              <Link key={m.id} href={`/archive/${m.id}`}>
                <Card className="h-full hover:border-accent transition-colors">
                  <Eyebrow>{formatMonthLabel(m.year, m.month)}</Eyebrow>
                  <div className="mt-3 flex gap-4 items-center">
                    {m.book && (
                      <BookCover
                        title={m.book.title}
                        author={m.book.author}
                        coverUrl={m.book.coverUrl}
                        size="sm"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-display text-base font-semibold leading-snug">
                        {m.book ? `『${m.book.title}』` : "책 미정"}
                      </p>
                      <p className="text-xs text-muted mt-0.5">
                        책장 {m.host?.name ?? "미정"}
                      </p>
                      {avg != null && (
                        <p className="mt-2 flex items-center gap-2">
                          <Stars value={avg} className="text-sm" />
                          <span className="font-display text-sm">{avg}</span>
                        </p>
                      )}
                      <p className="text-xs text-muted mt-1.5">
                        참석 {m.attendances.length}명 · 리뷰 {m.reviews.length}개
                      </p>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
